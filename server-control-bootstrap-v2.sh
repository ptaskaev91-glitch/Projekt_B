#!/usr/bin/env bash
set -Eeuo pipefail

DIR="/root/.server-control"
TOKEN_FILE="$DIR/token"
REPO_API="https://api.github.com/repos/ptaskaev91-glitch/server-control"
INSTALLER="https://raw.githubusercontent.com/ptaskaev91-glitch/Projekt_B/main/server-control-agent.sh"

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root" >&2
  exit 1
fi

install -d -m 0700 "$DIR"
rm -f "$TOKEN_FILE"

printf 'GitHub token: ' >/dev/tty
IFS= read -r -s GH_TOKEN </dev/tty
printf '\n' >/dev/tty

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "TOKEN_EMPTY" >&2
  exit 2
fi

printf '%s' "$GH_TOKEN" > "$TOKEN_FILE"
chmod 0600 "$TOKEN_FILE"
unset GH_TOKEN

TOKEN="$(cat "$TOKEN_FILE")"
HTTP="$(curl -sS -o /tmp/server-control-token-check.json -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$REPO_API" || true)"
unset TOKEN

if [[ "$HTTP" != "200" ]]; then
  rm -f "$TOKEN_FILE"
  echo "TOKEN_CHECK_FAILED http=$HTTP" >&2
  exit 3
fi

curl -fsSL "$INSTALLER" | bash
systemctl start server-control-agent.service || true
sleep 2

if systemctl is-active --quiet server-control-agent.timer; then
  echo "SERVER_CONTROL_READY token=valid timer=active"
else
  echo "SERVER_CONTROL_FAILED timer=inactive" >&2
  exit 4
fi
