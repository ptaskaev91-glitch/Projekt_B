# Деплой Edge Function и фронта (runtime)

## Быстрый старт

```bash
# 1. Установи Supabase CLI
npm install -g supabase

# 2. Войди в аккаунт
supabase login

# 3. Привяжи проект
supabase link --project-ref YOUR_PROJECT_REF

# 4. Задеплой функцию
supabase functions deploy horde-proxy --no-verify-jwt

# 5. Подготовь env для прод сборки фронта (значения не коммитим)
cp runtime/.env.production.example runtime/.env.production
edit runtime/.env.production

# 6. Собери и запусти фронт через Docker (runtime/)
docker build -f runtime/Dockerfile \
  --build-arg SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg SUPABASE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
  --build-arg SUPABASE_ANON_KEY_LEGACY=$VITE_SUPABASE_ANON_KEY_LEGACY \
  -t horde-chat .
docker run -d -p 80:80 --name horde-app --restart always horde-chat
```

## Проверка

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/horde-proxy" \
  -H "Content-Type: application/json" \
  -d '{"action": "models"}'
```

Должен вернуть JSON с моделями.

## Если нужен Horde API key в secrets

```bash
supabase secrets set HORDE_API_KEY=твой_ключ
```
