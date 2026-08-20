#!/usr/bin/env bash
set -Eeuo pipefail
[[ "$(id -u)" == "0" ]] || { echo 'Run as root' >&2; exit 1; }
AGENT=/usr/local/sbin/server-control-agent
[[ -f "$AGENT" ]] || { echo 'Existing server-control-agent not found' >&2; exit 2; }

cat >/usr/local/sbin/brain-share-recover-agent <<'RECOVER'
#!/usr/bin/env bash
set -u

if [[ "$(hostname 2>/dev/null || true)" != 'msk-1-vm-6dy5' ]] && ! ip -4 addr show scope global 2>/dev/null | grep -qE 'inet 72\.56\.14\.168/'; then
  echo "REFUSED non-Moscow host=$(hostname 2>/dev/null || true)"
  exit 42
fi

PUBLIC='https://72.56.14.168:8788'
NGINX=/etc/nginx/sites-available/brain-webdav
GATEWAY=brain-share-gateway.service
BRAIN_DIR=/opt/actions-runner-brain/_work/Brain/Brain

echo '=== TARGET ==='
date -Is
hostname

echo '=== GATEWAY ==='
if ! systemctl list-unit-files "$GATEWAY" --no-legend 2>/dev/null | grep -q "$GATEWAY"; then
  if [[ -x "$BRAIN_DIR/ops/install-share-gateway.sh" || -f "$BRAIN_DIR/ops/install-share-gateway.sh" ]]; then
    bash "$BRAIN_DIR/ops/install-share-gateway.sh" >/tmp/brain-share-install.log 2>&1 || true
  fi
fi
systemctl restart "$GATEWAY" >/dev/null 2>&1 || true
echo "share_service=$(systemctl is-active "$GATEWAY" 2>/dev/null || true)"
if curl -fsS --max-time 10 http://127.0.0.1:8795/share/health >/tmp/brain-share-local.json 2>/dev/null; then
  echo "share_local_health=$(python3 -c 'import json; print(str(bool(json.load(open("/tmp/brain-share-local.json")).get("ok"))).lower())' 2>/dev/null || echo false)"
else
  echo 'share_local_health=false'
fi

if [[ ! -f "$NGINX" ]]; then
  echo 'BRAIN_SHARE_RECOVERY_FAILED nginx-site-missing'
  exit 43
fi

python3 - "$NGINX" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
text=p.read_text()
if 'location ^~ /share/' not in text:
    needle='    location / { include /etc/nginx/snippets/brain-webdav-proxy.conf; }\n'
    block='''    location ^~ /share/ {
        proxy_http_version 1.1;
        proxy_pass http://127.0.0.1:8795;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Connection "";
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
'''
    if needle not in text:
        raise SystemExit('nginx insertion point not found')
    text=text.replace(needle,block+needle)
    p.write_text(text)
PY

if ! nginx -t >/tmp/brain-share-nginx.log 2>&1; then
  echo 'BRAIN_SHARE_RECOVERY_FAILED nginx-invalid'
  tail -n 8 /tmp/brain-share-nginx.log 2>/dev/null || true
  exit 44
fi
systemctl reload nginx >/dev/null 2>&1 || systemctl restart nginx >/dev/null 2>&1 || true

echo '=== PUBLIC ==='
if curl -fsS --max-time 15 "$PUBLIC/share/health" >/tmp/brain-share-public.json 2>/dev/null; then
  echo "share_public_health=$(python3 -c 'import json; print(str(bool(json.load(open("/tmp/brain-share-public.json")).get("ok"))).lower())' 2>/dev/null || echo false)"
else
  echo 'share_public_health=false'
fi
if curl -fsS --max-time 15 "$PUBLIC/share/" 2>/dev/null | grep -F 'Пароль Brain' >/dev/null; then
  echo 'share_login_page=true'
else
  echo 'share_login_page=false'
fi

LOGIN=false
python3 - <<'PY' >/tmp/brain-share-login.log 2>&1
import http.cookiejar
import pathlib
import urllib.parse
import urllib.request
secret=pathlib.Path('/etc/brain/webdav-client.txt').read_text()
password=next(line.split('=',1)[1] for line in secret.splitlines() if line.startswith('password='))
jar=http.cookiejar.CookieJar()
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
data=urllib.parse.urlencode({'password':password}).encode()
req=urllib.request.Request('https://72.56.14.168:8788/share/login',data=data,method='POST')
with opener.open(req,timeout=20) as response:
    body=response.read().decode('utf-8',errors='replace')
assert 'Импорт чата' in body
assert any(c.name=='brain_share_session' for c in jar)
PY
[[ $? -eq 0 ]] && LOGIN=true
echo "share_login=$LOGIN"

# Restore the dedicated Brain GitHub runner only after the PWA itself is healthy.
if command -v dev-platform-recover >/dev/null 2>&1 && [[ -f /etc/dev-platform/projects.d/brain.conf ]]; then
  echo '=== BRAIN RUNNER RECOVERY ==='
  dev-platform-recover brain 2>&1 | tail -n 30 || true
else
  BRAIN_SERVICE="$(systemctl list-unit-files --type=service --no-legend --no-pager 2>/dev/null | awk '$1 ~ /^actions\.runner\./ && $1 ~ /moscow-brain-01/ {print $1; exit}')"
  if [[ -n "$BRAIN_SERVICE" ]]; then
    systemctl kill --kill-who=all --signal=SIGKILL "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    systemctl reset-failed "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    systemctl start "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    sleep 3
    echo "brain_runner=$(systemctl is-active "$BRAIN_SERVICE" 2>/dev/null || true)"
  else
    echo 'brain_runner=not-found'
  fi
fi

if [[ "$LOGIN" == true ]] && curl -fsS --max-time 10 "$PUBLIC/share/health" >/dev/null 2>&1; then
  echo 'BRAIN_SHARE_RECOVERY_OK'
  exit 0
fi
echo 'BRAIN_SHARE_RECOVERY_FAILED acceptance'
exit 45
RECOVER
chmod 0700 /usr/local/sbin/brain-share-recover-agent

python3 - "$AGENT" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
text=p.read_text()
if '  brain_share_recovery)' not in text:
    marker='  update_agent)\n'
    block='''  brain_share_recovery)
    if [[ "$(hostname 2>/dev/null || true)" != 'msk-1-vm-6dy5' ]] && ! ip -4 addr show scope global 2>/dev/null | grep -qE 'inet 72\\.56\\.14\\.168/'; then
      # This request is Moscow-only. Other hosts advance their local request id
      # but intentionally do not overwrite Moscow's response.json.
      exit 0
    fi
    DATA="$(run_json '/usr/local/sbin/brain-share-recover-agent')"
    RC="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("rc",1))' <<<"$DATA" 2>/dev/null || echo 1)"
    if [[ "$RC" == '0' ]]; then MESSAGE='Brain Share recovery completed'; else OK=false; MESSAGE='Brain Share recovery failed'; fi
    ;;
'''
    if marker not in text:
        raise SystemExit('agent insertion marker not found')
    text=text.replace(marker,block+marker,1)
    p.write_text(text)
PY
chmod 0700 "$AGENT"
systemctl daemon-reload
systemctl enable --now server-control-agent.timer >/dev/null 2>&1 || true
echo "SERVER_CONTROL_BRAIN_PATCH_OK host=$(hostname 2>/dev/null || true) action=$(grep -c 'brain_share_recovery)' "$AGENT" 2>/dev/null || true) timer=$(systemctl is-active server-control-agent.timer 2>/dev/null || true)"
