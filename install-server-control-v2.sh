#!/usr/bin/env bash
set -Eeuo pipefail
TOKEN="${1:-}"
[[ $(id -u) -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
[[ -n "$TOKEN" ]] || { echo 'Missing token' >&2; exit 2; }
install -d -m 700 /root/.server-control-v2
printf '%s' "$TOKEN" >/root/.server-control-v2/token
chmod 600 /root/.server-control-v2/token
[[ -f /root/.server-control-v2/last-id ]] || echo 0 >/root/.server-control-v2/last-id
cat >/usr/local/sbin/server-control-v2 <<'AGENT'
#!/usr/bin/env bash
set -Eeuo pipefail
BASE='https://projektb.vercel.app'
TOKEN_FILE='/root/.server-control-v2/token'
LAST_FILE='/root/.server-control-v2/last-id'
TOKEN="$(cat "$TOKEN_FILE")"
RESP="$(curl -fsS --max-time 15 -H "x-server-token: $TOKEN" "$BASE/__scv2_ctl" 2>/dev/null || true)"
[[ -n "$RESP" ]] || exit 0
ID="$(python3 -c 'import json,sys; print(int(json.load(sys.stdin)["id"]))' <<<"$RESP")"
ACTION="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["action"])' <<<"$RESP")"
LAST="$(cat "$LAST_FILE" 2>/dev/null || echo 0)"
(( ID > LAST )) || exit 0
echo "$ID" > "$LAST_FILE"
case "$ACTION" in
  status)
    OUT="$(hostname; uptime -p; df -h /; free -h; docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || true)" ;;
  disk_audit)
    OUT="$(echo '===DISK==='; df -hT /; echo '===ROOT==='; du -xhd1 / 2>/dev/null | sort -h; echo '===VAR==='; du -xhd1 /var 2>/dev/null | sort -h; echo '===OPT==='; du -xhd2 /opt 2>/dev/null | sort -h | tail -50; echo '===DOCKER==='; docker system df -v 2>/dev/null || true; echo '===JOURNAL==='; journalctl --disk-usage 2>/dev/null || true)" ;;
  safe_cleanup)
    journalctl --vacuum-size=150M >/dev/null 2>&1 || true
    apt-get clean >/dev/null 2>&1 || true
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/partial/* 2>/dev/null || true
    npm cache clean --force >/dev/null 2>&1 || true
    docker image prune -f >/dev/null 2>&1 || true
    OUT="$(df -h /; journalctl --disk-usage 2>/dev/null || true; docker system df 2>/dev/null || true; for c in amnezia-awg2 amnezia-shadowsocks amnezia-socks5proxy amnezia-openvpn-cloak amnezia-xray; do docker inspect "$c" --format '{{.Name}} running={{.State.Running}} restarts={{.RestartCount}}' 2>/dev/null || true; done)" ;;
  install_mapk_worker)
    curl -fsSL https://raw.githubusercontent.com/ptaskaev91-glitch/Map-K/main/ops/moscow-worker/install.sh -o /tmp/install-mapk.sh
    chmod 700 /tmp/install-mapk.sh
    MAP_K_DIR=/opt/map-k-worker MAP_K_REPO_URL=https://github.com/ptaskaev91-glitch/Map-K.git bash /tmp/install-mapk.sh >/tmp/install-mapk.log 2>&1 || true
    OUT="$(tail -100 /tmp/install-mapk.log 2>/dev/null || true; df -h /; systemctl status map-k-worker.timer --no-pager -l 2>&1 || true)" ;;
  update_agent)
    curl -fsSL https://raw.githubusercontent.com/ptaskaev91-glitch/Projekt_B/main/install-server-control-v2.sh -o /tmp/scv2.sh
    chmod 700 /tmp/scv2.sh
    bash /tmp/scv2.sh "$TOKEN" >/tmp/scv2-update.log 2>&1 || true
    OUT="$(cat /tmp/scv2-update.log 2>/dev/null || true)" ;;
  *) OUT="unsupported action: $ACTION" ;;
esac
python3 - "$ID" "$ACTION" "$OUT" <<'PY' >/tmp/scv2.json
import json,sys,datetime
print(json.dumps({'id':int(sys.argv[1]),'action':sys.argv[2],'output':sys.argv[3][-10000:],'ts':datetime.datetime.now(datetime.timezone.utc).isoformat()},ensure_ascii=False))
PY
curl -fsS --max-time 20 -X POST -H "x-server-token: $TOKEN" -H 'content-type: application/json' --data-binary @/tmp/scv2.json "$BASE/__scv2_out" >/dev/null 2>&1 || true
AGENT
chmod 700 /usr/local/sbin/server-control-v2
cat >/etc/systemd/system/server-control-v2.service <<'UNIT'
[Unit]
Description=Fixed-action Vercel server control v2
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/server-control-v2
UNIT
cat >/etc/systemd/system/server-control-v2.timer <<'UNIT'
[Unit]
Description=Poll fixed-action Vercel server control v2
[Timer]
OnBootSec=10s
OnUnitActiveSec=20s
AccuracySec=3s
Persistent=false
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now server-control-v2.timer
systemctl start server-control-v2.service || true
echo "SERVER_CONTROL_V2_OK timer=$(systemctl is-active server-control-v2.timer 2>/dev/null || true)"
