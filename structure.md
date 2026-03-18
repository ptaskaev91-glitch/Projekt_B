# Структура проекта

## Текущее состояние — РЕФАКТОРИНГ ЗАВЕРШЁН
- `src/App.tsx` — ~370 строк, оркестратор (всё ещё можно дальше облегчать)
- `src/components/ChatArea.tsx` — 143 строки
- `src/components/Sidebar.tsx` — 194 строки
- `src/components/MessageBubble.tsx` — ~60 строк
- `src/components/ModelsPanel.tsx` — ~120 строк
- `src/components/ImagePanel.tsx` — ~200 строк
- `src/components/SettingsPanel.tsx` — ~250 строк (настройки, темы, пресеты)
- `src/hooks/useImageGeneration.ts` — ~110 строк
- `src/hooks/useAuth.ts` — ~70 строк
- `src/hooks/useModels.ts` — ~120 строк
- `src/hooks.ts` — активные хуки: `useAuth`, `useModels`; legacy runtime logic cloud/assets/image удалена из активного пути
- `src/lib/api.ts` — сервисный слой: текстовые/графические вызовы Horde (create/poll/load)
- `src/lib.ts` — Supabase client + Cloud Sync + Storage helpers (config через Vite env; без захардкоженных ключей)
- `src/ErrorBoundary.tsx` — граничный обработчик ошибок UI
- `src/main.tsx` — bootstrap + ErrorBoundary
- `core/actions/dispatch.ts` — dispatcher: лог + timeline
- `core/handlers/index.ts` — карта action → handler (chat/*, assets/*, cloud/*, image/generate, settings/validate)
- `core/state/index.ts` — AppState, селекторы (activeChat, contextUsage), cloud/assets состояния

## План реструктуризации

### src/types/index.ts
Все типы: HordeSettings, ChatMessage, ChatSession, HordeModelRaw, HordeModelView, ChatAsset, MessageRole, MessageStatus

### src/constants/index.ts
Константы: SETTINGS_KEY, CHATS_KEY, ACTIVE_CHAT_KEY, DEFAULT_SETTINGS

### src/utils/helpers.ts
Утилиты: uid, clamp, toNumber, wait, inferStrengths, calculatePowerVsGpt5, mapModel, getDefaultChat, normalizeMessage, normalizeChat, buildPromptWithContext

### src/hooks/useAuth.ts
Supabase auth: session, authEmail, authLoading, authMessage, supabaseStatus, sendMagicLink, signOut

### src/hooks/useCloudSync.ts
Cloud sync: cloudStatus, cloudMessage, cloudTablesReady, загрузка/сохранение чатов в Supabase DB

### src/hooks/useModels.ts
Модели Horde: models, loadModels, sortedModels, filteredModels, bestModel, effectiveModel, автообновление 5сек

### src/hooks/useChat.ts
Чаты: chats, activeChat, createChat, deleteChat, rename, export/import, sendMessage, pollTextJob

### src/hooks/useAssets.ts
Storage: assets, refreshAssets, upload, remove, insertIntoInput

### src/components/Sidebar.tsx
Левая панель: список чатов, поиск, экспорт/импорт, настройки

### src/components/ChatArea.tsx
Центр: header, сообщения, форма ввода

### src/components/MessageBubble.tsx
Одно сообщение: markdown, копирование, статус

### src/components/ModelsPanel.tsx
Правая панель: активная модель, рейтинг, таблица

### src/lib/supabase.ts
Supabase клиент и конфиг (без изменений)

### src/lib/cloudSync.ts
Cloud sync helpers (без изменений)

### src/lib/hordeProxy.ts
Horde proxy с fallback (без изменений)

### src/lib/storage.ts
Storage helpers (без изменений)

## Public файлы
- `public/manifest.json` — PWA манифест
- `public/favicon.svg` — иконка приложения

## Файлы без изменений
- `src/index.css`
- `src/utils/cn.ts`
- `supabase/*`
- `development.md`
- `index.html` — обновлён (мета-теги, OG, PWA)

## Deploy файлы
- `Dockerfile` — двухэтапная сборка (Node.js builder + Nginx production)
- `.dockerignore` — исключения для Docker-контекста
- `nginx.conf` — SPA fallback, gzip, кэш статики
- `deploy.sh` — скрипт деплоя на TimeWeb Cloud
- `.gitignore` — игнор `node_modules/`, `dist/`, `.env*` (секреты не коммитим)
- `.env.example` — шаблон переменных окружения (Supabase)
- `adr/001-architecture-guardrails.md` — ADR о запрете преждевременных backend/абстракций и обязательности доменных моделей перед персистенцией

## Актуальные уточнения
- `src/App.tsx` — orchestration слой UI: локальные view-state поля + bridge в `core/handlers`; async handlers обновляют состояние через актуальный `AppState` ref, чтобы не было отката сообщений из-за stale closure
- `core/handlers/index.ts` — содержит рабочие async workflow для `chat/sendMessage`, `assets/*`, `cloud/*` + подключенные module handlers (`image`, `models`)
- `core/state/index.ts` — единый shape runtime-состояния, который теперь используется как источник истины для async dispatch обновлений
- `src/main.tsx` — bootstrap приложения + `bootstrapModules()`
- `modules/index.ts` — реестр модулей (register/list, anti-duplicate)
- `modules/bootstrap.ts` — централизованная регистрация модулей при старте
- `modules/image/ui/ImagePanel.tsx` — вынесенный UI для генерации изображений (Phase 4, шаг 38)
- `modules/image/handlers/index.ts` — handlers для image intents, подключены в core
- `modules/image/actions/index.ts` — типы/константы action для image
- `modules/image/index.ts` — публичный entry только для actions/types
- `modules/models/ui/ModelsPanel.tsx` — вынесенный UI панели моделей (Phase 4, шаг 45)
- `modules/models/handlers/index.ts` — handlers для models intents (`models/select`)
- `modules/models/actions/index.ts` — типы/константы action для models
- `modules/models/index.ts` — публичный entry только для actions/types
- `modules/README.md` — контракт модулей (изоляция, только dispatch, без cross-module импортов)
- `runtime/README.md` — стартовый runtime-слой (Phase 5, шаг 49)
