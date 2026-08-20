#!/usr/bin/env bash
set -Eeuo pipefail
TOKEN="${1:-}"
[[ $(id -u) -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
[[ -n "$TOKEN" ]] || { echo 'Missing token' >&2; exit 2; }
AGENT=/usr/local/sbin/server-control-v2
[[ -f "$AGENT" ]] || { echo 'Existing server-control-v2 agent not found' >&2; exit 3; }

cat >/usr/local/sbin/brain-share-recover-v2 <<'RECOVER'
#!/usr/bin/env bash
set -u

if [[ "$(hostname 2>/dev/null || true)" != 'msk-1-vm-6dy5' ]] && ! ip -4 addr show scope global 2>/dev/null | grep -qE 'inet 72\.56\.14\.168/'; then
  echo "REFUSED non-Moscow host=$(hostname 2>/dev/null || true) ips=$(hostname -I 2>/dev/null || true)"
  exit 42
fi

echo '=== BRAIN SHARE RECOVERY ==='
date -Is
hostname

GATEWAY=brain-share-gateway.service
NGINX=/etc/nginx/sites-available/brain-webdav
PUBLIC='https://72.56.14.168:8788'

if systemctl list-unit-files "$GATEWAY" --no-legend 2>/dev/null | grep -q "$GATEWAY"; then
  systemctl restart "$GATEWAY" >/dev/null 2>&1 || true
fi
printf 'share_service='
systemctl is-active "$GATEWAY" 2>/dev/null || true
printf 'share_local_health='
if curl -fsS --max-time 10 http://127.0.0.1:8795/share/health >/tmp/brain-share-health.json 2>/dev/null; then
  python3 -c 'import json; d=json.load(open("/tmp/brain-share-health.json")); print(str(bool(d.get("ok"))).lower())' 2>/dev/null || echo false
else
  echo false
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
    count=text.count(needle)
    if count < 1:
        raise SystemExit('nginx insertion point not found')
    text=text.replace(needle, block+needle)
    p.write_text(text)
PY

if ! nginx -t >/tmp/brain-share-nginx-test.log 2>&1; then
  echo 'BRAIN_SHARE_RECOVERY_FAILED nginx-invalid'
  tail -n 10 /tmp/brain-share-nginx-test.log 2>/dev/null || true
  exit 44
fi
systemctl reload nginx >/dev/null 2>&1 || systemctl restart nginx >/dev/null 2>&1 || true

printf 'share_public_health='
if curl -fsS --max-time 15 "$PUBLIC/share/health" >/tmp/brain-share-public-health.json 2>/dev/null; then
  python3 -c 'import json; d=json.load(open("/tmp/brain-share-public-health.json")); print(str(bool(d.get("ok"))).lower())' 2>/dev/null || echo false
else
  echo false
fi

LOGIN=false
python3 - <<'PY' >/tmp/brain-share-login-smoke.log 2>&1
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
printf 'share_login=%s\n' "$LOGIN"

if command -v dev-platform-recover >/dev/null 2>&1 && [[ -f /etc/dev-platform/projects.d/brain.conf ]]; then
  echo '=== RECOVER BRAIN RUNNER ==='
  dev-platform-recover brain 2>&1 | tail -n 35 || true
else
  BRAIN_SERVICE="$(systemctl list-unit-files --type=service --no-legend --no-pager 2>/dev/null | awk '$1 ~ /^actions\.runner\./ && $1 ~ /moscow-brain-01/ {print $1; exit}')"
  if [[ -n "$BRAIN_SERVICE" ]]; then
    systemctl kill --kill-who=all --signal=SIGKILL "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    systemctl reset-failed "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    systemctl start "$BRAIN_SERVICE" >/dev/null 2>&1 || true
    sleep 3
    echo "brain_runner_service=$BRAIN_SERVICE state=$(systemctl is-active "$BRAIN_SERVICE" 2>/dev/null || true)"
  else
    echo 'brain_runner_service=not-found'
  fi
fi

if [[ "$LOGIN" == true ]] && curl -fsS --max-time 10 "$PUBLIC/share/health" >/dev/null 2>&1; then
  echo 'BRAIN_SHARE_RECOVERY_OK'
  exit 0
fi
echo 'BRAIN_SHARE_RECOVERY_FAILED acceptance'
exit 45
RECOVER
chmod 700 /usr/local/sbin/brain-share-recover-v2

python3 - "$AGENT" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
text=p.read_text()
if 'brain_share_recovery_moscow)' not in text:
    marker='  update_agent)\n'
    block='''  brain_share_recovery_moscow)
    if ! is_moscow; then
      OUT="REFUSED non-Moscow host=$(hostname 2>/dev/null || true) ips=$(hostname -I 2>/dev/null || true)"
    else
      OUT="$(/usr/local/sbin/brain-share-recover-v2 2>&1 || true)"
    fi
    ;;
'''
    if marker not in text:
        raise SystemExit('agent update marker not found')
    text=text.replace(marker,block+marker,1)
    p.write_text(text)
PY
chmod 700 "$AGENT"
systemctl daemon-reload
systemctl enable --now server-control-v2.timer >/dev/null 2>&1 || true
echo "SERVER_CONTROL_V2_PATCH_OK host=$(hostname 2>/dev/null || true) brain_action=$(grep -c 'brain_share_recovery_moscow)' "$AGENT" 2>/dev/null || true) timer=$(systemctl is-active server-control-v2.timer 2>/dev/null || true)"
