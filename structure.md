# Структура проекта

## Текущее состояние
- `src/App.tsx` — главный orchestration-слой UI: локальный view-state, bridge к `dispatch`, wiring между `core`, `modules` и базовыми экранами.
- `src/main.tsx` — bootstrap React-приложения и запуск module bootstrap.
- `src/Sidebar.tsx` — левая колонка: чаты, поиск, import/export, auth, Supabase/cloud status, базовые настройки.
- `src/ChatArea.tsx` — центральная область: сообщения, composer, отправка, status/context usage.
- `src/Panels.tsx` — панель настроек и связанный UI, который ещё не вынесен в отдельный модуль.
- `src/ErrorBoundary.tsx` — защита UI от runtime-ошибок.
- `src/hooks.ts` — активные hooks: auth, модели, transport label/retry и связанный runtime UI-state.
- `src/types.ts` — доменные типы, default settings, normalizers и часть общих helper-функций.
- `src/lib.ts` — Supabase client, storage/cloud sync helpers, Horde proxy/fallback transport, runtime config guard.
- `src/lib/api.ts` — сервисный слой для текстовых и image запросов к Horde через `src/lib.ts`.
- `src/index.css` — глобальные стили.

## Core
- `core/actions/dispatch.ts` — единый dispatcher с action timeline, logging и обвязкой handlers.
- `core/handlers/index.ts` — карта intent → handler для chat/assets/cloud/settings и подключение module handlers.
- `core/handlers/types.ts` — типы для handler context.
- `core/state/index.ts` — `AppState` и selectors (`activeChat`, `contextUsage` и др.).

## Modules
- `modules/index.ts` — реестр модулей и регистрация без дублей.
- `modules/bootstrap.ts` — централизованный bootstrap модулей при старте.
- `modules/README.md` — правила модульной изоляции и lifecycle.
- `modules/image/actions/index.ts` — action types/constants для image-модуля.
- `modules/image/handlers/index.ts` — handlers генерации изображений.
- `modules/image/index.ts` — публичный entry image-модуля (actions/types only).
- `modules/image/ui/ImagePanel.tsx` — UI генерации изображений.
- `modules/models/actions/index.ts` — action types/constants для выбора модели.
- `modules/models/handlers/index.ts` — handlers модели/selection intent.
- `modules/models/index.ts` — публичный entry models-модуля (actions/types only).
- `modules/models/ui/ModelsPanel.tsx` — UI панели моделей.

## Runtime и инфраструктура
- `runtime/README.md` — стартовая документация runtime-слоя, Phase 5.
- `runtime/Dockerfile` — production build на Node + Nginx (использует root context, конфиг nginx из runtime).
- `runtime/nginx.conf` — SPA routing, gzip, cache headers.
- `runtime/deploy.sh` — серверный deploy script (использует `-f runtime/Dockerfile`).
- `.dockerignore` — исключения для Docker context, включая `.codex`.
- `.gitignore` — исключения для git: `node_modules`, `dist`, `.env*`, `.codex` и локальные IDE-файлы.
- `.env.development.example` — шаблон переменных окружения для локальной разработки.
- `runtime/.env.production.example` — шаблон для прод-сборки через Docker (значения подхватываются build-args).
- `DEPLOY.md` — инструкции по deploy Edge Function и фронта (runtime).
- `.github/workflows/ci.yml` — CI: типизация/сборка.
- Vercel preview — рабочий внешний online preview для демонстрации продукта по ссылке.

## Supabase
- `supabase/config.toml` — локальная конфигурация Supabase CLI.
- `supabase/migrations/0001_init.sql` — SQL-миграция схемы.
- `supabase/functions/horde-proxy/index.ts` — Edge Function proxy для Horde API.

## Документация проекта
- `rules.md` — правила работы.
- `development.md` — план, статусы этапов, аудит и что сделано.
- `history.md` — история переписки и краткие summaries по этапам.
- `adr/001-architecture-guardrails.md` — ADR по архитектурным ограничениям.

## Прочее
- `index.html` — HTML shell, meta-теги, PWA wiring.
- `public/favicon.svg` — иконка.
- `public/manifest.json` — PWA manifest.
- `package.json` — npm scripts и зависимости.
- `package-lock.json` — lockfile зависимостей.
- `vite.config.ts` — конфигурация Vite.
- `tsconfig.json` — конфигурация TypeScript с `vite/client`.

## Что важно сейчас
- UI уже работает через `Intent -> Decision -> State -> Render`.
- Архитектура частично модульная: `image` и `models` вынесены, settings пока живут в `src/Panels.tsx`.
- Git-состояние теперь чистое: локальные служебные файлы и build-артефакты не должны попадать в репозиторий.
- Supabase теперь зависит от `.env`; при пустой конфигурации приложение должно показать ошибку, а не упасть на старте.
- Для внешнего тестирования уже есть рабочий Vercel preview; для постоянного runtime остаётся TimeWeb/Docker путь.
- Следующий архитектурный блок: шаг 52 (`runtime` vs `product` responsibilities), затем structured logging и debug timeline.
