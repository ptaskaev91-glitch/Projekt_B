# Modules Contract (Phase 4)

Goal: каждый модуль изолирован, общается через dispatch, не зависит от других модулей напрямую.

Rules:
- Экспортируем только intent-экшены и вспомогательные типы из `modules/<name>/index.ts`.
- UI внутри модуля импортирует только свои actions/handlers; никаких cross-module импортов.
- Core подключает handlers модуля через единый entry (`modules/<name>/handlers`).
- UI рендерит модульный компонент (React.lazy) без бизнес-логики: только props/dispatch.
- Удаление модуля должно приводить к graceful fallback (компонент можно временно не монтировать).

Naming conventions:
- Папка модуля: `modules/<domain>`.
- Экшены: `modules/<domain>/actions/index.ts`, типы `domain/intent` (пример: `models/select`).
- Handlers: `modules/<domain>/handlers/index.ts`.
- UI: `modules/<domain>/ui/<FeaturePanel>.tsx`.
- Публичный entry: `modules/<domain>/index.ts` (только actions/types).

Module lifecycle:
- Register: модуль объявляется в `modules/bootstrap.ts` и регистрируется через `registerModule`.
- Wire: UI lazy-load из `modules/<domain>/ui/*`, handlers подключаются в `core/handlers/index.ts`.
- Run: компонент посылает intent через dispatch; решение выполняет core/module handler.
- Disable: отключение модуля не ломает shell (fallback в App).
