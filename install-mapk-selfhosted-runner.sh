#!/usr/bin/env bash
set -Eeuo pipefail

RUNNER_TOKEN="${1:-}"
REPO_URL="https://github.com/ptaskaev91-glitch/Map-K"
RUNNER_DIR="/opt/actions-runner-mapk"
RUNNER_USER="github-runner"
RUNNER_NAME="moscow-mapk-01"
RUNNER_LABELS="moscow-mapk"
AUDIT_DIR="/var/lib/map-k-audits"

[[ $(id -u) -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
[[ -n "$RUNNER_TOKEN" ]] || { echo 'Usage: bash install-mapk-selfhosted-runner.sh <registration-token>' >&2; exit 2; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends curl ca-certificates jq chromium libicu-dev git python3 util-linux

id -u "$RUNNER_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/$RUNNER_USER --shell /bin/bash "$RUNNER_USER"
install -d -o "$RUNNER_USER" -g "$RUNNER_USER" -m 755 "$RUNNER_DIR"
install -d -o "$RUNNER_USER" -g "$RUNNER_USER" -m 755 "$AUDIT_DIR"

# This installer is intended for a fresh Map-K runner. Do not attempt a destructive
# remove/re-register cycle automatically if an existing registration is found.
if [[ -f "$RUNNER_DIR/.runner" ]]; then
  echo 'A runner is already configured in /opt/actions-runner-mapk.' >&2
  echo 'Leaving the existing registration untouched.' >&2
  ./opt/actions-runner-mapk/svc.sh status 2>/dev/null || true
  exit 0
fi

RELEASE_JSON="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest)"
TAG="$(jq -r '.tag_name' <<<"$RELEASE_JSON")"
VERSION="${TAG#v}"
[[ -n "$VERSION" && "$VERSION" != "null" ]] || { echo 'Failed to resolve runner version' >&2; exit 3; }
URL="https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-x64-${VERSION}.tar.gz"

rm -rf "$RUNNER_DIR"/*
curl -fL "$URL" -o /tmp/actions-runner-mapk.tar.gz
tar -xzf /tmp/actions-runner-mapk.tar.gz -C "$RUNNER_DIR"
chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"

cd "$RUNNER_DIR"
runuser -u "$RUNNER_USER" -- ./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work _work \
  --unattended \
  --replace

./svc.sh install "$RUNNER_USER"
./svc.sh start
sleep 2
./svc.sh status || true

echo '=== RUNNER ==='
echo "name=$RUNNER_NAME labels=self-hosted,Linux,X64,$RUNNER_LABELS version=$VERSION"
echo '=== CHROMIUM ==='
chromium --version || true
echo '=== AUDIT STORAGE ==='
ls -ld "$AUDIT_DIR"
echo '=== DISK ==='
df -h /
