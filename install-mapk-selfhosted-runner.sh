#!/usr/bin/env bash
set -Eeuo pipefail

RUNNER_TOKEN="${1:-}"
REPO_URL="https://github.com/ptaskaev91-glitch/Map-K"
RUNNER_DIR="/opt/actions-runner-mapk"
RUNNER_USER="github-runner"
RUNNER_NAME="moscow-mapk-01"
RUNNER_LABELS="moscow-mapk"

[[ $(id -u) -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
[[ -n "$RUNNER_TOKEN" ]] || { echo 'Usage: bash install-mapk-selfhosted-runner.sh <registration-token>' >&2; exit 2; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends curl ca-certificates jq chromium libicu-dev git python3

id -u "$RUNNER_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/$RUNNER_USER --shell /bin/bash "$RUNNER_USER"
install -d -o "$RUNNER_USER" -g "$RUNNER_USER" -m 755 "$RUNNER_DIR"

if [[ -f "$RUNNER_DIR/.runner" ]]; then
  cd "$RUNNER_DIR"
  ./svc.sh stop || true
  ./svc.sh uninstall || true
  sudo -u "$RUNNER_USER" ./config.sh remove --token "$RUNNER_TOKEN" || true
fi

RELEASE_JSON="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest)"
TAG="$(jq -r '.tag_name' <<<"$RELEASE_JSON")"
VERSION="${TAG#v}"
URL="https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-x64-${VERSION}.tar.gz"

rm -rf "$RUNNER_DIR"/*
curl -fL "$URL" -o /tmp/actions-runner-mapk.tar.gz
tar -xzf /tmp/actions-runner-mapk.tar.gz -C "$RUNNER_DIR"
chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"

cd "$RUNNER_DIR"
sudo -u "$RUNNER_USER" ./config.sh \
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
echo '=== DISK ==='
df -h /
