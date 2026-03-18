# Деплой Edge Function

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
