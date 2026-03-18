#!/bin/bash
# Скрипт деплоя на TimeWeb Cloud

echo "=== Horde Chat Deploy ==="

# Остановить старый контейнер
docker stop horde-app 2>/dev/null
docker rm horde-app 2>/dev/null

# Собрать новый образ
docker build -t horde-chat .

# Запустить контейнер
docker run -d \
  -p 80:80 \
  --name horde-app \
  --restart always \
  horde-chat

echo "=== Готово! Проверь http://$(curl -s ifconfig.me) ==="
