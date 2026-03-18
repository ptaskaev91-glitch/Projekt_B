#!/bin/bash
# Скрипт деплоя на TimeWeb Cloud

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR%/runtime}"

cd "$REPO_ROOT"
echo "=== Horde Chat Deploy ==="

# Загрузить переменные из runtime/.env.production (опционально)
ENV_FILE="$SCRIPT_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z0-9_]+=' "$ENV_FILE")
fi

# Остановить старый контейнер
docker stop horde-app 2>/dev/null || true
docker rm horde-app 2>/dev/null || true

# Собрать новый образ
docker build \
  -f runtime/Dockerfile \
  --build-arg SUPABASE_URL="${VITE_SUPABASE_URL:-}" \
  --build-arg SUPABASE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}" \
  --build-arg SUPABASE_ANON_KEY_LEGACY="${VITE_SUPABASE_ANON_KEY_LEGACY:-}" \
  -t horde-chat .

# Запустить контейнер
docker run -d \
  -p 80:80 \
  --name horde-app \
  --restart always \
  horde-chat

echo "=== Готово! Проверь http://$(curl -s ifconfig.me) ==="
