#!/bin/bash
# Скрипт деплоя на TimeWeb Cloud

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR%/runtime}"

cd "$REPO_ROOT"
echo "=== Horde Chat Deploy ==="

# Остановить старый контейнер
docker stop horde-app 2>/dev/null || true
docker rm horde-app 2>/dev/null || true

# Собрать новый образ
docker build -f runtime/Dockerfile -t horde-chat .

# Запустить контейнер
docker run -d \
  -p 80:80 \
  --name horde-app \
  --restart always \
  horde-chat

echo "=== Готово! Проверь http://$(curl -s ifconfig.me) ==="
