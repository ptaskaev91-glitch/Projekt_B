#!/usr/bin/env bash
set -Eeuo pipefail

REPO="ptaskaev91-glitch/server-control"
DIR="/root/.server-control"
TOKEN_FILE="$DIR/token"
AGENT="/usr/local/sbin/server-control-agent"
SERVICE="/etc/systemd/system/server-control-agent.service"
TIMER="/etc/systemd/system/server-control-agent.timer"

[[ "$(id -u)" == "0" ]] || { echo "Run as root" >&2; exit 1; }
for bin in curl python3 systemctl; do command -v "$bin" >/dev/null 2>&1 || { echo "Missing $bin" >&2; exit 2; }; done
install -d -m 0700 "$DIR"
if [[ ! -s "$TOKEN_FILE" ]]; then
  read -rsp "GitHub token: " GH_TOKEN; echo
  printf '%s' "$GH_TOKEN" > "$TOKEN_FILE"; unset GH_TOKEN
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
OK=true; MESSAGE="ok"; DATA="{}"
run_json() {
  python3 - "$1" <<'PY'
import json,subprocess,sys
cmd=sys.argv[1]
p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
print(json.dumps({'rc':p.returncode,'output':p.stdout.strip()[-20000:]},ensure_ascii=False))
PY
}
case "$ACTION" in
  noop)
    DATA='{"agent":"alive","version":"2026-08-18"}'
    ;;
  status)
    DATA="$(python3 - <<'PY'
import json,subprocess
def run(cmd,t=25):
 p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=t); return p.stdout.strip()[-12000:]
print(json.dumps({'hostname':run('hostname'),'uptime':run('uptime -p'),'disk':run('df -h /'),'memory':run('free -h'),'failed_units':run('systemctl --failed --no-pager --plain'),'docker':run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' 2>/dev/null || true")},ensure_ascii=False))
PY
)"
    ;;
  disk_audit)
    DATA="$(python3 - <<'PY'
import json,subprocess
def run(cmd,t=60):
 p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=t); return p.stdout.strip()[-30000:]
print(json.dumps({
 'disk':run('df -hT /'),
 'root_dirs':run('du -xhd1 / 2>/dev/null | sort -h'),
 'var_dirs':run('du -xhd1 /var 2>/dev/null | sort -h'),
 'opt_dirs':run('du -xhd2 /opt 2>/dev/null | sort -h | tail -50'),
 'docker_df':run('docker system df -v 2>/dev/null || true'),
 'journal':run('journalctl --disk-usage 2>/dev/null || true'),
 'amnezia':run("for c in amnezia-awg2 amnezia-shadowsocks amnezia-socks5proxy amnezia-openvpn-cloak amnezia-xray; do docker inspect \"$c\" --format '{{.Name}} running={{.State.Running}} restarts={{.RestartCount}}' 2>/dev/null || echo \"$c missing\"; done")
},ensure_ascii=False))
PY
)"
    ;;
  safe_cleanup)
    BEFORE="$(df -B1 --output=used / | tail -1 | tr -d ' ')"
    journalctl --vacuum-size=150M >/tmp/server-control-journal-clean.log 2>&1 || true
    apt-get clean >/dev/null 2>&1 || true
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/partial/* 2>/dev/null || true
    npm cache clean --force >/dev/null 2>&1 || true
    find /tmp -xdev -mindepth 1 -mtime +3 -type f -delete 2>/dev/null || true
    docker image prune -f >/tmp/server-control-docker-prune.log 2>&1 || true
    AFTER="$(df -B1 --output=used / | tail -1 | tr -d ' ')"
    DATA="$(python3 - "$BEFORE" "$AFTER" <<'PY'
import json,subprocess,sys
b=int(sys.argv[1]); a=int(sys.argv[2])
def run(c):
 p=subprocess.run(c,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30); return p.stdout.strip()[-12000:]
print(json.dumps({'freed_bytes':max(0,b-a),'disk':run('df -h /'),'journal':run('journalctl --disk-usage'),'docker':run('docker system df'),'amnezia':run("for c in amnezia-awg2 amnezia-shadowsocks amnezia-socks5proxy amnezia-openvpn-cloak amnezia-xray; do docker inspect \"$c\" --format '{{.Name}} running={{.State.Running}} restarts={{.RestartCount}}' 2>/dev/null || true; done")},ensure_ascii=False))
PY
)"
    ;;
  install_mapk_worker)
    FREE_KB="$(df -Pk / | awk 'NR==2{print $4}')"
    if (( FREE_KB < 2500000 )); then
      OK=false; MESSAGE="not enough free disk for Map-K worker"; DATA="$(run_json 'df -h /')"
    else
      export DEBIAN_FRONTEND=noninteractive
      apt-get update >/tmp/mapk-apt-update.log 2>&1
      apt-get install -y --no-install-recommends git curl ca-certificates chromium >/tmp/mapk-apt-install.log 2>&1
      if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_24.x | bash - >/tmp/mapk-node-setup.log 2>&1
        apt-get install -y --no-install-recommends nodejs >>/tmp/mapk-apt-install.log 2>&1
      fi
      APP=/opt/map-k-worker
      ASK="$(mktemp)"
      cat >"$ASK" <<'ASKPASS'
#!/bin/sh
case "$1" in
  *Username*) echo x-access-token ;;
  *Password*) cat /root/.server-control/token ;;
  *) echo ;;
esac
ASKPASS
      chmod 700 "$ASK"
      export GIT_ASKPASS="$ASK" GIT_TERMINAL_PROMPT=0
      if [[ ! -d "$APP/.git" ]]; then
        rm -rf "$APP"
        git clone --depth 1 --branch main https://github.com/ptaskaev91-glitch/Map-K.git "$APP" >/tmp/mapk-git.log 2>&1
      else
        git -C "$APP" fetch --depth 1 origin main >/tmp/mapk-git.log 2>&1
        git -C "$APP" reset --hard origin/main >>/tmp/mapk-git.log 2>&1
      fi
      rm -f "$ASK"; unset GIT_ASKPASS GIT_TERMINAL_PROMPT
      install -d -m 755 /var/log/map-k-worker
      install -m 755 "$APP/ops/moscow-worker/run-map-k-audits.sh" /usr/local/sbin/run-map-k-audits
      cat >/etc/systemd/system/map-k-worker.service <<'UNIT'
[Unit]
Description=Map-K audit worker
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
Environment=MAP_K_DIR=/opt/map-k-worker
Environment=MAP_K_BRANCH=main
Environment=CHROME_BIN=/usr/bin/chromium
ExecStart=/usr/local/sbin/run-map-k-audits
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
CPUQuota=55%
MemoryMax=850M
TimeoutStartSec=45min
UNIT
      cat >/etc/systemd/system/map-k-worker.timer <<'UNIT'
[Unit]
Description=Run Map-K worker nightly
[Timer]
OnCalendar=*-*-* 03:20:00
Persistent=true
RandomizedDelaySec=600
Unit=map-k-worker.service
[Install]
WantedBy=timers.target
UNIT
      systemctl daemon-reload
      systemctl enable --now map-k-worker.timer >/tmp/mapk-systemd.log 2>&1
      DATA="$(python3 - <<'PY'
import json,subprocess
def run(c):
 p=subprocess.run(c,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30); return p.stdout.strip()[-12000:]
print(json.dumps({'disk':run('df -h /'),'node':run('node --version; npm --version'),'chromium':run('chromium --version 2>/dev/null || true'),'timer':run('systemctl status map-k-worker.timer --no-pager -l'),'repo':run('git -C /opt/map-k-worker log -1 --oneline'),'amnezia':run("for c in amnezia-awg2 amnezia-shadowsocks amnezia-socks5proxy amnezia-openvpn-cloak amnezia-xray; do docker inspect \"$c\" --format '{{.Name}} running={{.State.Running}} restarts={{.RestartCount}}' 2>/dev/null || true; done")},ensure_ascii=False))
PY
)"
    fi
    ;;
  gateway_test)
    DATA="$(python3 - <<'PY'
import json,subprocess
def run(cmd):
 p=subprocess.run(cmd,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=35); return p.stdout.strip()[-10000:]
print(json.dumps({'edge_health':run("curl -ksS --max-time 10 -w '\\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true"),'containers':run("docker ps --format '{{.Names}} {{.Status}}' | grep -E 'public-web-gateway|browser-worker' || true")},ensure_ascii=False))
PY
)"
    ;;
  update_agent)
    TMP="$(mktemp)"
    if curl -fsSL --max-time 30 https://raw.githubusercontent.com/ptaskaev91-glitch/Projekt_B/main/server-control-agent.sh -o "$TMP"; then
      chmod 700 "$TMP"; bash "$TMP" >/tmp/server-control-update.log 2>&1 || true
      MESSAGE="agent update requested"; DATA='{"update":"requested"}'
    else OK=false; MESSAGE="failed to download installer"; fi
    rm -f "$TMP"
    ;;
  *) OK=false; MESSAGE="unsupported action"; DATA='{}' ;;
esac
RESP="$(python3 - "$REQ_ID" "$ACTION" "$OK" "$MESSAGE" "$DATA" <<'PY'
import json,sys,datetime
rid=int(sys.argv[1]); action=sys.argv[2]; ok=sys.argv[3].lower()=='true'; msg=sys.argv[4]
try:data=json.loads(sys.argv[5])
except Exception:data={'raw':sys.argv[5]}
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
