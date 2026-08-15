#!/usr/bin/env bash
set -Eeuo pipefail

REPO="ptaskaev91-glitch/server-control"
DIR="/root/.server-control"
TOKEN_FILE="$DIR/token"
AGENT="/usr/local/sbin/server-control-agent"
SERVICE="/etc/systemd/system/server-control-agent.service"
TIMER="/etc/systemd/system/server-control-agent.timer"

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root" >&2
  exit 1
fi

for bin in curl python3 systemctl; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing $bin" >&2; exit 2; }
done

install -d -m 0700 "$DIR"
if [[ ! -s "$TOKEN_FILE" ]]; then
  read -rsp "GitHub token: " GH_TOKEN
  echo
  printf '%s' "$GH_TOKEN" > "$TOKEN_FILE"
  unset GH_TOKEN
fi
chmod 0600 "$TOKEN_FILE"
[[ -f "$DIR/last-id" ]] || echo 0 > "$DIR/last-id"
chmod 0600 "$DIR/last-id"

cat > "$AGENT" <<'AGENT_SCRIPT'
#!/usr/bin/env bash
set -Eeuo pipefail
REPO="ptaskaev91-glitch/server-control"
DIR="/root/.server-control"
TOKEN_FILE="$DIR/token"
LAST_FILE="$DIR/last-id"
API="https://api.github.com/repos/$REPO/contents"
[[ -s "$TOKEN_FILE" ]] || exit 0
TOKEN="$(cat "$TOKEN_FILE")"
HDR=(-H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")

REQ_JSON="$(curl -fsS --max-time 20 "${HDR[@]}" "$API/request.json?ref=main")" || exit 0
REQ_CONTENT="$(python3 -c 'import sys,json,base64; j=json.load(sys.stdin); print(base64.b64decode(j["content"]).decode())' <<<"$REQ_JSON")"
REQ_ID="$(python3 -c 'import sys,json; print(int(json.load(sys.stdin).get("id",0)))' <<<"$REQ_CONTENT")"
ACTION="$(python3 -c 'import sys,json; print(json.load(sys.stdin).get("action","noop"))' <<<"$REQ_CONTENT")"
LAST_ID="$(cat "$LAST_FILE" 2>/dev/null || echo 0)"
[[ "$REQ_ID" =~ ^[0-9]+$ ]] || exit 0
[[ "$LAST_ID" =~ ^[0-9]+$ ]] || LAST_ID=0
(( REQ_ID > LAST_ID )) || exit 0

echo "$REQ_ID" > "$LAST_FILE"
OK=true
MESSAGE="ok"
DATA="{}"
case "$ACTION" in
  noop)
    DATA='{"agent":"alive"}'
    ;;
  status)
    DATA="$(python3 - <<'PY'
import json,subprocess

def run(cmd):
    p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=20)
    return p.stdout.strip()[-12000:]
print(json.dumps({
  'hostname':run('hostname'),
  'uptime':run('uptime -p'),
  'disk':run('df -h /'),
  'memory':run('free -h'),
  'failed_units':run('systemctl --failed --no-pager --plain'),
  'docker':run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' 2>/dev/null || true")
},ensure_ascii=False))
PY
)"
    ;;
  gateway_cert_status)
    DATA="$(python3 - <<'PY'
import json,subprocess

def run(cmd):
    p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=25)
    return p.stdout.strip()[-8000:]
print(json.dumps({
  'renew_service':run('systemctl status public-web-gateway-renew.service --no-pager -l 2>&1 || true'),
  'renew_timer':run('systemctl status public-web-gateway-renew.timer --no-pager -l 2>&1 || true'),
  'cert_files':run("find /opt /etc/letsencrypt -maxdepth 5 -type f \\( -name '*.pem' -o -name '*.crt' \\) 2>/dev/null | head -50"),
  'edge_health':run("curl -ksS --max-time 10 -w '\\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true")
},ensure_ascii=False))
PY
)"
    ;;
  gateway_cert_renew)
    systemctl reset-failed public-web-gateway-renew.service 2>/dev/null || true
    timeout 240 systemctl start public-web-gateway-renew.service >/tmp/server-control-renew.log 2>&1 || RC=$?
    RC="${RC:-0}"
    DATA="$(python3 - "$RC" <<'PY'
import json,subprocess,sys
rc=sys.argv[1]
def run(cmd):
    p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=25)
    return p.stdout.strip()[-10000:]
print(json.dumps({
  'start_rc':rc,
  'service':run('systemctl status public-web-gateway-renew.service --no-pager -l 2>&1 || true'),
  'journal':run('journalctl -u public-web-gateway-renew.service -n 80 --no-pager 2>&1 || true'),
  'edge_health':run("curl -ksS --max-time 10 -w '\\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true")
},ensure_ascii=False))
PY
)"
    ;;
  gateway_test)
    DATA="$(python3 - <<'PY'
import json,subprocess

def run(cmd):
    p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=35)
    return p.stdout.strip()[-10000:]
print(json.dumps({
  'direct_adm44':run("curl -LksS --max-time 20 -o /tmp/adm44.html -w 'HTTP=%{http_code} SIZE=%{size_download} TIME=%{time_total}' https://adm44.ru/authorities/administration/alternates.php; grep -o 'Заместители губернатора' /tmp/adm44.html | head -1 || true"),
  'edge_health':run("curl -ksS --max-time 10 -w '\\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true"),
  'containers':run("docker ps --format '{{.Names}} {{.Status}}' | grep -E 'public-web-gateway|browser-worker' || true")
},ensure_ascii=False))
PY
)"
    ;;
  update_agent)
    TMP="$(mktemp)"
    if curl -fsSL --max-time 30 https://raw.githubusercontent.com/ptaskaev91-glitch/Projekt_B/main/server-control-agent.sh -o "$TMP"; then
      chmod 700 "$TMP"
      bash "$TMP" >/tmp/server-control-update.log 2>&1 || true
      MESSAGE="agent update requested"
      DATA='{"update":"requested"}'
    else
      OK=false; MESSAGE="failed to download installer"
    fi
    rm -f "$TMP"
    ;;
  *)
    OK=false
    MESSAGE="unsupported action"
    DATA='{}'
    ;;
esac

RESP="$(python3 - "$REQ_ID" "$ACTION" "$OK" "$MESSAGE" "$DATA" <<'PY'
import json,sys,datetime
rid=int(sys.argv[1]); action=sys.argv[2]; ok=sys.argv[3].lower()=='true'; msg=sys.argv[4]
try: data=json.loads(sys.argv[5])
except Exception: data={'raw':sys.argv[5]}
print(json.dumps({'id':rid,'action':action,'ok':ok,'message':msg,'data':data,'completed_at':datetime.datetime.now(datetime.timezone.utc).isoformat()},ensure_ascii=False))
PY
)"

CUR="$(curl -fsS --max-time 20 "${HDR[@]}" "$API/response.json?ref=main")"
SHA="$(python3 -c 'import sys,json; print(json.load(sys.stdin)["sha"])' <<<"$CUR")"
B64="$(printf '%s' "$RESP" | base64 -w0)"
BODY="$(python3 - "$B64" "$SHA" "$REQ_ID" <<'PY'
import json,sys
print(json.dumps({'message':f'server response {sys.argv[3]}','content':sys.argv[1],'sha':sys.argv[2],'branch':'main'}))
PY
)"
curl -fsS --max-time 30 -X PUT "${HDR[@]}" -H 'Content-Type: application/json' --data-binary "$BODY" "$API/response.json" >/dev/null
AGENT_SCRIPT
chmod 0700 "$AGENT"

cat > "$SERVICE" <<'EOF'
[Unit]
Description=Server control agent
Wants=network-online.target
After=network-online.target docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/server-control-agent
EOF

cat > "$TIMER" <<'EOF'
[Unit]
Description=Poll private server-control repository

[Timer]
OnBootSec=15s
OnUnitActiveSec=20s
AccuracySec=3s
Persistent=false

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now server-control-agent.timer
systemctl start server-control-agent.service || true
printf 'SERVER_CONTROL_OK timer=%s\n' "$(systemctl is-active server-control-agent.timer 2>/dev/null || true)"
