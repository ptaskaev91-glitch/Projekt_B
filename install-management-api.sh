#!/usr/bin/env bash
set -Eeuo pipefail

TOKEN="${1:-}"
PORT="${2:-8765}"
if [[ "$(id -u)" != "0" ]]; then echo 'Run as root' >&2; exit 1; fi
if [[ ${#TOKEN} -lt 24 ]]; then echo 'Token required as arg1' >&2; exit 2; fi
for b in curl python3 systemctl; do command -v "$b" >/dev/null 2>&1 || { echo "Missing $b" >&2; exit 3; }; done

install -d -m 700 /opt/management-api
curl -fsSL https://raw.githubusercontent.com/ptaskaev91-glitch/Projekt_B/main/management-api.py -o /opt/management-api/management-api.py
chmod 700 /opt/management-api/management-api.py
cat >/etc/management-api.env <<EOF
MGMT_TOKEN=$TOKEN
MGMT_PORT=$PORT
EOF
chmod 600 /etc/management-api.env
cat >/etc/systemd/system/management-api.service <<'EOF'
[Unit]
Description=Fixed-action VPS management API
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/etc/management-api.env
ExecStart=/usr/bin/python3 /opt/management-api/management-api.py
Restart=on-failure
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now management-api.service
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q '^Status: active'; then ufw allow "$PORT/tcp" >/dev/null || true; fi
sleep 1
curl -fsS --max-time 5 "http://127.0.0.1:$PORT/$TOKEN/status" >/tmp/management-api-selftest.json
printf 'MANAGEMENT_API_READY port=%s service=%s\n' "$PORT" "$(systemctl is-active management-api.service)"
