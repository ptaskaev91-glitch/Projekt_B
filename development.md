# Development Log

## Intent → Decision → State → Render (док диаграмма)
```
Intent (UI событие)
    ↓ dispatch(action)
Decision (handler)
    ↓
State update
    ↓
Render (UI)
```

**Документация проекта:**
- `rules.md` — правила работы
- `history.md` — история переписки
- `structure.md` — структура файлов

## Выполнено

### Инфраструктура
- [x] Supabase проект подключен (config через Vite env; без секретов в репозитории)
- [x] SQL миграция выполнена (profiles, user_settings, chats, messages, jobs, RLS, storage bucket)
- [x] Edge Function `horde-proxy` — каркас готов
- [x] Supabase Auth — magic link, session tracking
- [x] Cloud Sync — загрузка/сохранение чатов в Supabase DB
- [x] Storage — upload/list/delete/signed URLs

### Чат
- [x] ChatGPT-подобный интерфейс
- [x] Контекст чата (история отправляется с каждым запросом)
- [x] Сохранение в localStorage + облачная синхронизация
- [x] Переименование чатов
- [x] Экспорт/импорт (один чат, все чаты)
- [x] Markdown-рендеринг (react-markdown + remark-gfm)
- [x] Копирование ответа
- [x] Поиск по чатам

### Модели
- [x] Загрузка моделей из Horde API
- [x] Автообновление каждые 5 секунд
- [x] Сортировка по мощности vs GPT-5
- [x] Авто / мануальный выбор модели
- [x] Выбор кнопкой в таблице

### Архитектура — РЕФАКТОРИНГ ЗАВЕРШЁН
- [x] `src/App.tsx` сокращён с монолита до orchestration-слоя + bridge в `core/*`
- [x] Базовые UI-компоненты выделены в отдельные файлы: `src/Sidebar.tsx`, `src/ChatArea.tsx`, `src/Panels.tsx`
- [x] Bootstrap вынесен в `src/main.tsx`
- [x] Общий runtime state и handlers вынесены в `core/state` и `core/handlers`
- [x] Модульные фичи вынесены в `modules/image/*` и `modules/models/*`
- [x] Supabase / storage / cloud sync / proxy helpers централизованы в `src/lib.ts`
- [x] Активные React hooks пока консолидированы в `src/hooks.ts`

### Убрано
- [x] Sentry — убран по решению заказчика
- [x] Stripe — не внедряется
- [x] PostHog — не внедряется

### Сборка 17.03.2026
- Добавлен входной файл `src/main.tsx`, перенос bootstrap из `App.tsx`
- `npm run build` — успешно
- Улучшения UI/UX:
  - Дебаунс сохранения чатов/настроек в localStorage (меньше лагов)
  - Прогресс-бар использования контекста с предупреждением при >90%
  - Валидация настроек (API key, минимальный maxContextTokens)
  - Toast-уведомления для ошибок
- ErrorBoundary оборачивает приложение (graceful fail + reload)
- API-слой `src/lib/api.ts` (обёртки над Horde текст/изображение)
- Скрипт `npm run lint` (tsc --noEmit)
- Сборка после правок — успешна

## План дальнейших работ
- Прогнан `npm run lint` — ошибок нет
- Вынесены текстовые/графические вызовы Horde в `src/lib/api.ts`, `hooks.ts` использует сервисный слой
- Добавлен стек toast-уведомлений (очередь) + перехват `unhandledrejection` → toast
- Сборка `npm run build` — успешна
- Добавлен оффлайн/онлайн мониторинг (toasts)
- CI workflow `.github/workflows/ci.yml` (lint + build)
- Сборка после изменений — успешна

Следующие шаги:
- Документировать CI шаги в `DEPLOY.md`
- При необходимости расширить перехват сетевых ошибок (fetch-level)
- Этап 1: `supabase functions deploy horde-proxy`

## Evolution Plan (из evaluation.md, полный перенос)

### Product Evolution Plan (Architecture-Guided, No Rewrite)

This roadmap expands the previous evaluation into a **precise execution
plan** covering architectural evolution, workflow discipline, and
platform emergence.

Principles: - No rewrite - Architecture emerges from behavior - UI
expresses intent only - Core owns decisions - Modules isolate features -
Runtime separated from product logic

------------------------------------------------------------------------

# PHASE 1 --- Direction Stabilization (Steps 1--12)

Goal: Stop architectural drift without refactoring.

1. [x] Document rule: UI never mutates global state directly.
2. [x] Add "Intent → Decision → State → Render" diagram to docs.
3. [x] Create `/core` folder (empty allowed).
4. [x] Create `/core/actions`.
5. [x] Implement minimal `dispatch(type, payload)`.
6. [x] Log every dispatched action (temporary debugging).
7. [x] Route ONE existing state change through dispatch.
8. [x] Verify nothing breaks (lint/build).
9. [x] Adopt rule: all new features must use dispatch.
10. [x] Name first intent-based actions.
11. [x] Avoid renaming legacy logic yet.
12. [x] Add development guideline describing action usage.

Outcome: Direction corrected without structural shock.

### Action Usage Guideline (Phase 1)
- Все новые намерения идут через `dispatch({ type, payload })`.
- UI не изменяет состояние напрямую; компоненты вызывают действия.
- Один action — одно намерение пользователя; именуем глаголом в инфинитиве, например `chat/create`, `chat/rename`.
- Логика решения (валидация, выбор модели, обработка ошибок) должна быть в handler/слое core, не в UI.

------------------------------------------------------------------------

# PHASE 2 --- Application Core Emergence (Steps 13--24)

Goal: Logic naturally exits UI.

13. [x] Create `/core/handlers`.
14. [x] Map actions → handlers.
15. [x] Move first conditional logic from UI to handler (`chat/create`).
16. [x] Handlers update state only.
17. [x] Create `/core/state`.
18. [x] Centralize shared state definitions.
19. [x] Remove duplicated UI logic gradually.
20. [x] Introduce derived state selectors (activeChat, contextUsage).
21. [x] UI reads state only via selectors.
22. [x] Add validation logic into handlers (`settings/validate` updates validationErrors).
23. [x] Prevent async workflows inside components (text/assets/cloud orchestration вынесены из App в handlers; UI только dispatch).
24. [x] Document Core responsibilities.

Outcome: Core exists functionally before formally.

------------------------------------------------------------------------

# PHASE 3 --- Anti‑Trap Reinforcement (Steps 25--36)

Goal: Avoid the 3 architectural traps.

25. [x] Audit components for business logic.
26. [x] Move orchestration to handlers.
27. [x] Ban cross-component workflows.
28. [x] Define intent vocabulary rules.
29. [x] Rename mechanical actions to intent actions.
30. [x] Introduce action logging timeline (core/actions/dispatch.ts).

### Intent Vocabulary
- chat/create, chat/delete, chat/rename, chat/setActive, chat/import, chat/sendMessage
- models/select
- image/generate
- settings/validate
- assets/list, assets/upload, assets/remove, assets/cleanup
- cloud/probe, cloud/load, cloud/resolve, cloud/save

### Core Responsibilities
- Core принимает intent (action), выполняет валидацию/решение и обновляет AppState.
- UI только вызывает dispatch и читает данные через selectors; прямые setState недопустимы для бизнес-логики.
- Асинхронные операции с внешними API (Horde/Supabase) располагаются в handlers.
- Именование действий: `domain/intent` (глагол), без технических суффиксов.

### Architecture Audit (Steps 25-27)
- `App.tsx`: chat/settings/assets/cloud/image orchestration переведены на intent actions и core handlers.
- `Sidebar.tsx`: редактирование API key, Client-Agent, режима модели и maxLength идёт через callbacks, которые теперь dispatch'ят intent.
- `ChatArea.tsx`: отправка сообщения и storage operations проходят через dispatch callbacks; компонент рендерит состояние.
- `Panels.tsx`: image generation и settings save вызывают actions/обновления через App, без прямой бизнес-логики между компонентами.
- Правило: cross-component workflows запрещены; координация только через `dispatch` и AppState.
31. [x] Validate predictable action flow — `core/actions/dispatch.ts` ведёт детальный лог (start/end/status/error) и оборачивает handlers в Promise.resolve + try/catch.
32. [x] Reject premature backend creation — правило зафиксировано в ADR 001: новый backend/сервис только после чёткого домена.
33. [x] If persistence needed → define domain concept first — доменная модель и поток намерений обязательны перед добавлением хранилища (ADR 001).
34. [x] Avoid repository/factory abstractions — запрещены generic repo/factory без подтверждённой необходимости (ADR 001).
35. [x] Repeat extraction only when patterns appear 3× — абстрагируем только после 3 повторов (ADR 001).
36. [x] Create architecture decision log (ADR) — добавлен `adr/001-architecture-guardrails.md`.

Outcome: System becomes stable under growth.

------------------------------------------------------------------------

# PHASE 4 --- Modularization (Steps 37--48)

Goal: Features become independent units.

37. [x] Create `/modules` directory.
38. [x] Move one feature into module structure — ImagePanel перенесён в `modules/image/ui/ImagePanel.tsx`, App lazy-load из модуля.
39. [x] Inside module add: - ui/ - actions/ - handlers/ (`modules/image/ui`, `modules/image/actions`, `modules/image/handlers`).
40. [x] Ensure module exports only actions — `modules/image/index.ts` экспортирует только actions/types.
41. [x] Prevent cross-module imports — модульный README с правилами, UI использует только свой entry.
42. [x] Route communication via dispatch — ImagePanel вызывает только dispatch'и через props, handlers подключены в core.
43. [x] Introduce module registration pattern (`modules/index.ts` + `modules/bootstrap.ts` + bootstrap в `src/main.tsx`).
44. [x] Verify module removal causes minimal breakage — `App` lazy-импортирует ImagePanel с fallback-компонентом; legacy ImagePanel удалён из `src/Panels.tsx`.
45. [x] Repeat for second feature — models вынесен в `modules/models` (ui/actions/handlers), App использует модульный `ModelsPanel`.
46. [x] Introduce module naming conventions — зафиксированы в `modules/README.md`.
47. [x] Create module lifecycle documentation — добавлено в `modules/README.md` (register/wire/run/disable).
48. [x] Confirm UI only renders module state — `ModelsPanel` и `ImagePanel` переведены на контракт `state + actions`; UI получает только модульный state slice и callbacks.

Outcome: Project shifts from app → platform.

------------------------------------------------------------------------

# PHASE 5 --- Platform Formation (Steps 49--60)

Goal: System becomes scalable product runtime.

49. [x] Create `/runtime` folder (`runtime/README.md`).
50. [ ] Move docker/nginx/deploy scripts into runtime.
51. [ ] Separate environment configs.
52. [ ] Define runtime vs product responsibility.
53. [ ] Add structured logging from Core.
54. [ ] Introduce event timeline debugging view.
55. [ ] Prepare backend mirror of Core concepts (NOT endpoints).
56. [ ] Design persistence aligned with actions.
57. [ ] Add AI integration as module (action-driven).
58. [ ] Validate UI replaceability (mock UI test).
59. [ ] Document platform architecture diagram.
60. [ ] Freeze architectural principles as project constitution.

Outcome: Mini‑platform achieved without rewrite.

------------------------------------------------------------------------

# Expected Evolution Signals

- shrinking components
- predictable behavior
- faster feature delivery
- minimal regressions
- easier experimentation

------------------------------------------------------------------------

# Final Architecture Shape

project/ core/ modules/ ui/ runtime/ infra/

------------------------------------------------------------------------

# Core Principle

Separate: - Intent - Decision - State - Presentation

Architecture grows from flow, not folders.
## Осталось сделать

### Этап 1 — Deploy Edge Function
- [ ] `supabase functions deploy horde-proxy`
- [ ] Проверить переключение фронта с fallback на proxy
- [ ] Перенести Horde API key в Edge Function secrets

### Этап 2 — Cloud Sync доводка
- [x] Конфликт-резолюция localStorage vs DB (модалка с выбором: облако/локально/слить)
- [x] Индикатор "сохранено / ошибка" в UI (цветной статус + время последней синхронизации)
- [x] Автомёрж: уникальные локальные чаты сохраняются при загрузке из облака
- [ ] Проверка восстановления после logout → login

### Этап 3 — Storage доводка
- [x] Лимит на размер файла (10 МБ)
- [x] Превью изображений в чате
- [x] Cleanup файлов при удалении чата

### Этап 4 — Генерация изображений
- [x] Вернуть image generation
- [x] Inline-отображение картинок
- [ ] Сохранение в Storage (опционально)

### Этап 5 — Качество контекста
- [x] Обрезание по токенам (estimateTokens, buildPromptWithContext)
- [x] System prompt (настраиваемый в SettingsPanel)
- [x] Индикатор использования контекста (в хедере ChatArea)

### Этап 6 — Настройки
- [x] Тёмная / светлая / системная тема
- [x] Пресеты генерации (создание, редактирование, удаление)
- [x] Язык интерфейса (ru/en)

### Этап 7 — Безопасность (позже)
- [ ] Убрать ключи из фронта (только если появится отдельный backend/proxy; publishable/anon остаются в браузере)
- [x] Убрать секреты из git (Vite env + `.env.example` + `.gitignore`)
- [ ] Rate limiting

### Этап 8 — Production
- [x] Мета-теги (SEO, OG, Twitter Card)
- [x] PWA manifest (public/manifest.json)
- [x] Favicon (public/favicon.svg)
- [x] Lazy loading всех компонентов (Sidebar, ChatArea, ModelsPanel, ImagePanel, SettingsPanel)
- [x] Code splitting (React.lazy + Suspense)
- [ ] Домен, HTTPS (требует хостинг)

---

## Деплой на TimeWeb Cloud

### Фаза 1 — Подготовка сервера и первый деплой
**Статус:** готово к выполнению

**Созданные файлы:**
- `Dockerfile` — двухэтапная сборка (Node.js + Nginx)
- `.dockerignore` — исключения для Docker
- `nginx.conf` — SPA-роутинг, gzip, кэш статики
- `deploy.sh` — скрипт деплоя

**Твои действия:**
1. Зайди на сервер TimeWeb по SSH:
   ```bash
   ssh root@ТВОЙ_IP
   ```
2. Установи Docker и Git (если нет):
   ```bash
   curl -fsSL https://get.docker.com | sh
   apt install git -y
   ```
3. Склонируй проект:
   ```bash
   git clone ТВОЙ_РЕПОЗИТОРИЙ /opt/horde-chat
   cd /opt/horde-chat
   ```
4. Запусти деплой:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
5. Проверь в браузере: `http://ТВОЙ_IP`

### Фаза 2 — SSL и домен
**Статус:** ожидает завершения Фазы 1

- [ ] Привязать домен к IP сервера (A-запись в DNS)
- [ ] Установить Certbot для Let's Encrypt
- [ ] Настроить HTTPS в Nginx
- [ ] Редирект HTTP → HTTPS

### Фаза 3 — Финальная проверка
- [ ] Проверить авторизацию Supabase
- [ ] Проверить синхронизацию чатов
- [ ] Проверить генерацию текста/изображений
- [ ] Проверить Storage

---

## Аудит реализации плана

### Что подтверждено
- [x] Проект собирается (`npm run build` успешен)
- [x] Файлы деплоя существуют: `Dockerfile`, `.dockerignore`, `nginx.conf`, `deploy.sh`
- [x] `DEPLOY.md` существует с инструкцией по деплою Edge Function
- [x] Cloud Sync реализован: конфликт-резолюция, автомёрж, статус, last sync
- [x] Storage реализован: upload/list/delete/signed URLs, cleanup при удалении чата
- [x] Lazy loading и production-файлы существуют: `manifest.json`, `favicon.svg`

### Расхождения
- [!] `development.md` раньше утверждал `App.tsx ~180 строк`, фактически `src/App.tsx` = ~370 строк
- [!] `structure.md` содержал устаревшие размеры файлов
- [!] Этап 1 фактически не завершён: Edge Function ещё не задеплоена, фронт работает через proxy/fallback логику

### Текущее реальное состояние
- Фаза деплоя на TimeWeb подготовлена на уровне файлов
- Проект готов к ручному деплою через Docker + Nginx
- Нужна отдельная проверка рантайма на сервере и deploy `horde-proxy` в Supabase

### Git Audit 2026-03-18
- [x] Git-репозиторий создан и привязан к `origin/main`
- [x] Push protection пройден: секреты удалены из коммита и репозитория
- [x] `node_modules/` и `dist/` больше не версионируются
- [x] Локальный служебный каталог `.codex/` исключён из git и Docker context
- [x] Supabase-конфиг переведён на Vite env (`.env.example`, `.gitignore`)
- [x] Добавлен runtime guard: приложение не падает при пустом `.env`, а показывает понятную ошибку конфигурации
- [x] Удалена лишняя зависимость `@sentry/react`
- [x] Документация синхронизирована с реальной структурой репозитория

---

## Hotfix 2026-03-18

### Исправлено
- [x] Починен поток отправки сообщений в `src/App.tsx`
- [x] `dispatch` больше не использует устаревший snapshot `chats/settings` внутри async handler
- [x] `chat/sendMessage` больше не затирает только что добавленное сообщение пользователя и placeholder ответа
- [x] Проверки после фикса: `npm run lint`, `npm run build`

### Причина бага
- В `App.tsx` функция `dispatch` собирала `draft` из замыкания рендера, а не из последнего `AppState`
- Из-за этого следующий async update из `chat/sendMessage` или других handler'ов мог откатить уже применённые изменения и визуально "съесть" сообщение

### Дальше проверить вручную
- [ ] Отправка текста в браузере: сообщение остаётся в истории и получает ответ или ошибку
- [ ] Повторная отправка после входа и cloud sync
