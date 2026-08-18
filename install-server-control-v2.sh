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
OUT=''
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
    OUT="$(df -h /; journalctl --disk-usage 2>/dev/null || true; docker system df 2>/dev/null || true)" ;;
  prepare_mapk_runner)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update >/tmp/mapk-runner-apt.log 2>&1 || true
    apt-get install -y --no-install-recommends curl ca-certificates jq libicu-dev >/tmp/mapk-runner-apt-install.log 2>&1 || true
    id -u github-runner >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/github-runner --shell /bin/bash github-runner
    install -d -o github-runner -g github-runner -m 755 /opt/actions-runner-mapk
    RELEASE="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest 2>/dev/null || true)"
    TAG="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tag_name", ""))' <<<"$RELEASE" 2>/dev/null || true)"
    VERSION="${TAG#v}"
    if [[ -z "$VERSION" ]]; then
      OUT='failed to resolve latest actions/runner release'
    else
      URL="https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-x64-${VERSION}.tar.gz"
      curl -fL "$URL" -o /tmp/actions-runner.tar.gz >/tmp/mapk-runner-download.log 2>&1 || true
      if [[ -s /tmp/actions-runner.tar.gz ]]; then
        rm -rf /opt/actions-runner-mapk/*
        tar -xzf /tmp/actions-runner.tar.gz -C /opt/actions-runner-mapk
        chown -R github-runner:github-runner /opt/actions-runner-mapk
        OUT="$(echo RUNNER_VERSION=$VERSION; du -sh /opt/actions-runner-mapk; ls -l /opt/actions-runner-mapk/config.sh /opt/actions-runner-mapk/run.sh 2>/dev/null || true; df -h /)"
      else
        OUT="$(echo runner_download_failed; tail -50 /tmp/mapk-runner-download.log 2>/dev/null || true)"
      fi
    fi
    ;;
  runner_status)
    OUT="$(echo '=== runner dir ==='; ls -la /opt/actions-runner-mapk 2>/dev/null | head -30 || true; echo '=== services ==='; systemctl list-units --type=service --all | grep -i actions.runner || true; echo '=== processes ==='; pgrep -af 'Runner.Listener|Runner.Worker' || true; echo '=== disk ==='; df -h /)" ;;
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
