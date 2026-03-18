import type { HordeModelView, HordeSettings } from "../../../src/types";

type ModelsPanelState = {
  settings: HordeSettings;
  filteredModels: HordeModelView[];
  effectiveModel: HordeModelView | null;
  effectiveModelName: string;
  modelsLoading: boolean;
  modelsError: string;
  modelFilter: string;
  lastModelsRefresh: number | null;
  activeChatModel: string | undefined;
};

type ModelsPanelActions = {
  onSetModelFilter: (v: string) => void;
  onLoadModels: () => void;
  onSelectModel: (name: string) => void;
};

type ModelsPanelProps = {
  state: ModelsPanelState;
  actions: ModelsPanelActions;
};

export function ModelsPanel(props: ModelsPanelProps) {
  return (
    <aside className="bg-[#11131a]">
      <div className="flex h-full flex-col p-4">
        <div className="rounded-3xl border border-zinc-800/80 bg-[#0d0f14] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Модели Horde</h2>
              <p className="mt-1 text-sm text-zinc-400">Автообновление 5сек · Сортировка по мощности vs GPT-5</p>
            </div>
            <button
              type="button"
              onClick={props.actions.onLoadModels}
              disabled={props.state.modelsLoading}
              className="rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-700 hover:bg-[#1a1e28] disabled:opacity-50"
            >
              {props.state.modelsLoading ? "..." : "Обновить"}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={props.state.modelFilter}
              onChange={(e) => props.actions.onSetModelFilter(e.target.value)}
              placeholder="Поиск моделей..."
              className="w-full rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-[#151822] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Текущая сеть</p>
                <p className="mt-2 text-sm font-medium text-white">{props.state.effectiveModelName}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-[#151822] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Обновление</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {props.state.lastModelsRefresh ? new Date(props.state.lastModelsRefresh).toLocaleTimeString("ru-RU") : "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Моделей: {props.state.filteredModels.length}</p>
              </div>
            </div>
          </div>
        </div>

        {props.state.effectiveModel && (
          <div className="mt-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-200/80">Активный профиль</p>
                <h3 className="mt-2 text-base font-semibold text-white">{props.state.effectiveModel.name}</h3>
              </div>
              <span className="rounded-full border border-indigo-400/20 bg-white/5 px-3 py-1 text-sm font-semibold text-indigo-100">
                {props.state.effectiveModel.powerVsGpt5}%
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-200">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Воркеры</p>
                <p className="mt-2 text-lg font-semibold text-white">{props.state.effectiveModel.workers}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Очередь</p>
                <p className="mt-2 text-lg font-semibold text-white">{props.state.effectiveModel.queue}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Performance</p>
                <p className="mt-2 text-lg font-semibold text-white">{props.state.effectiveModel.performance}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">ETA</p>
                <p className="mt-2 text-lg font-semibold text-white">{props.state.effectiveModel.eta ?? "—"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-indigo-100/90">Сильные стороны: {props.state.effectiveModel.strengths}</p>
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#0d0f14] shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
          <div className="border-b border-zinc-800/80 px-4 py-3">
            <p className="text-sm font-medium text-zinc-100">Рейтинг моделей</p>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[860px] text-left text-xs text-zinc-300">
              <thead className="sticky top-0 bg-[#11131a] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Действие</th>
                  <th className="px-4 py-3">Модель</th>
                  <th className="px-4 py-3">Воркеры</th>
                  <th className="px-4 py-3">Очередь</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Perf</th>
                  <th className="px-4 py-3">Сильна в</th>
                  <th className="px-4 py-3">vs GPT-5</th>
                </tr>
              </thead>
              <tbody>
                {props.state.filteredModels.map((model) => {
                  const isEffective = model.name === props.state.effectiveModelName;
                  const isManual = props.state.activeChatModel === model.name;
                  return (
                    <tr key={model.name} className={`border-t border-zinc-900/80 align-top ${isEffective ? "bg-indigo-500/5" : "hover:bg-[#141820]"}`}>
                      <td className="px-4 py-3">
                        {props.state.settings.modelSelectionMode === "manual" ? (
                          <button
                            type="button"
                            onClick={() => props.actions.onSelectModel(model.name)}
                            className={`rounded-xl px-3 py-2 font-medium transition ${isManual ? "bg-indigo-500 text-white" : "border border-zinc-700 bg-[#151822] text-zinc-100 hover:border-zinc-600"}`}
                          >
                            {isManual ? "Выбрана" : "Выбрать"}
                          </button>
                        ) : (
                          <span className={`inline-flex rounded-xl px-3 py-2 font-medium ${isEffective ? "bg-emerald-500/15 text-emerald-200" : "bg-[#151822] text-zinc-500"}`}>
                            {isEffective ? "Авто" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">{model.name}</td>
                      <td className="px-4 py-3">{model.workers}</td>
                      <td className="px-4 py-3">{model.queue}</td>
                      <td className="px-4 py-3">{model.eta ?? "—"}</td>
                      <td className="px-4 py-3">{model.performance}</td>
                      <td className="px-4 py-3 text-zinc-400">{model.strengths}</td>
                      <td className="px-4 py-3 font-semibold text-white">{model.powerVsGpt5}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {props.state.modelsError && <p className="mt-3 text-sm text-rose-300">{props.state.modelsError}</p>}
      </div>
    </aside>
  );
}
