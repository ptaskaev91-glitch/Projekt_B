import { useEffect, useMemo, useState } from "react";
import type { GenerationPreset, HordeSettings, ThemeMode } from "./types";
import { uid } from "./types";
import {
  clearDispatchLog,
  getDispatchLog,
  subscribeDispatchLog,
} from "../core/actions/dispatch";
import type { DispatchLogEntry, DispatchLogLevel } from "../core/actions/dispatch";

type SettingsPanelProps = {
  settings: HordeSettings;
  onUpdate: (settings: HordeSettings) => void;
  onClose: () => void;
};

const DEFAULT_PRESET: GenerationPreset = {
  id: "default",
  name: "Стандартный",
  maxLength: 400,
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  repetitionPenalty: 1.1,
};

export function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
  const [local, setLocal] = useState<HordeSettings>(() => ({
    ...settings,
    presets: settings.presets?.length ? settings.presets : [DEFAULT_PRESET],
  }));
  const [activeTab, setActiveTab] = useState<"general" | "context" | "presets" | "debug">("general");
  const [debugLogs, setDebugLogs] = useState<DispatchLogEntry[]>(() => getDispatchLog());
  const [debugActionFilter, setDebugActionFilter] = useState("all");
  const [debugLevelFilter, setDebugLevelFilter] = useState<"all" | DispatchLogLevel>("all");
  const [debugEventQuery, setDebugEventQuery] = useState("");

  const update = <K extends keyof HordeSettings>(key: K, value: HordeSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    onUpdate(local);
    onClose();
  };

  const addPreset = () => {
    const newPreset: GenerationPreset = {
      id: uid(),
      name: `Пресет ${local.presets.length + 1}`,
      maxLength: 400,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      repetitionPenalty: 1.1,
    };
    update("presets", [...local.presets, newPreset]);
    update("activePresetId", newPreset.id);
  };

  const updatePreset = (id: string, changes: Partial<GenerationPreset>) => {
    update(
      "presets",
      local.presets.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
  };

  const deletePreset = (id: string) => {
    if (local.presets.length <= 1) return;
    const newPresets = local.presets.filter((p) => p.id !== id);
    update("presets", newPresets);
    if (local.activePresetId === id) {
      update("activePresetId", newPresets[0].id);
    }
  };

  const activePreset = local.presets.find((p) => p.id === local.activePresetId) ?? local.presets[0];
  const debugActionTypes = useMemo(() => {
    return Array.from(new Set(debugLogs.map((item) => item.actionType))).sort((a, b) => a.localeCompare(b));
  }, [debugLogs]);

  const filteredDebugLogs = useMemo(() => {
    const query = debugEventQuery.trim().toLowerCase();
    return [...debugLogs]
      .reverse()
      .filter((item) => {
        if (debugActionFilter !== "all" && item.actionType !== debugActionFilter) return false;
        if (debugLevelFilter !== "all" && item.level !== debugLevelFilter) return false;
        if (!query) return true;
        return [
          item.event,
          item.actionType,
          item.details?.event,
          item.error,
          item.traceId,
          item.actionId,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(query));
      });
  }, [debugActionFilter, debugEventQuery, debugLevelFilter, debugLogs]);

  useEffect(() => {
    setDebugLogs(getDispatchLog());
    const unsubscribe = subscribeDispatchLog((entry) => {
      setDebugLogs((prev) => {
        const next = [...prev, entry];
        if (next.length > 500) next.splice(0, next.length - 500);
        return next;
      });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const debugLevelClass: Record<DispatchLogLevel, string> = {
    debug: "text-zinc-300",
    info: "text-sky-300",
    warn: "text-amber-300",
    error: "text-rose-300",
  };

  const formatTs = (value: number) => new Date(value).toLocaleTimeString();
  const formatDetails = (entry: DispatchLogEntry) => {
    if (!entry.details) return "";
    const text = JSON.stringify(entry.details);
    return text.length > 220 ? `${text.slice(0, 220)}...` : text;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Настройки</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">×</button>
        </div>

        <div className="flex border-b border-zinc-700">
          {(["general", "context", "presets", "debug"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm ${
                activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab === "general" ? "Общие" : tab === "context" ? "Контекст" : tab === "presets" ? "Пресеты" : "Debug"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {activeTab === "general" && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Тема</label>
                <select
                  value={local.theme}
                  onChange={(e) => update("theme", e.target.value as ThemeMode)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2"
                >
                  <option value="dark">Тёмная</option>
                  <option value="light">Светлая</option>
                  <option value="system">Системная</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Язык</label>
                <select
                  value={local.language}
                  onChange={(e) => update("language", e.target.value as "ru" | "en")}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Выбор модели</label>
                <select
                  value={local.modelSelectionMode}
                  onChange={(e) => update("modelSelectionMode", e.target.value as "auto" | "manual")}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2"
                >
                  <option value="auto">Автоматический</option>
                  <option value="manual">Ручной</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Horde API Key</label>
                <input
                  type="password"
                  value={local.apiKey}
                  onChange={(e) => update("apiKey", e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2"
                />
              </div>
            </>
          )}

          {activeTab === "context" && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">System Prompt</label>
                <textarea
                  value={local.systemPrompt}
                  onChange={(e) => update("systemPrompt", e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 resize-none"
                  placeholder="Ты полезный AI-ассистент."
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Макс. токенов контекста: {local.maxContextTokens}
                </label>
                <input
                  type="range"
                  min={512}
                  max={8192}
                  step={256}
                  value={local.maxContextTokens}
                  onChange={(e) => update("maxContextTokens", Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>512</span>
                  <span>8192</span>
                </div>
              </div>
            </>
          )}

          {activeTab === "presets" && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Активный пресет</label>
                <select
                  value={local.activePresetId}
                  onChange={(e) => update("activePresetId", e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2"
                >
                  {local.presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {activePreset && (
                <div className="space-y-3 p-3 bg-zinc-700/50 rounded-lg">
                  <input
                    value={activePreset.name}
                    onChange={(e) => updatePreset(activePreset.id, { name: e.target.value })}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-1 text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">Max Length</label>
                      <input
                        type="number"
                        value={activePreset.maxLength}
                        onChange={(e) => updatePreset(activePreset.id, { maxLength: Number(e.target.value) })}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Temperature</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={activePreset.temperature}
                        onChange={(e) => updatePreset(activePreset.id, { temperature: Number(e.target.value) })}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Top P</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={activePreset.topP}
                        onChange={(e) => updatePreset(activePreset.id, { topP: Number(e.target.value) })}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Top K</label>
                      <input
                        type="number"
                        value={activePreset.topK}
                        onChange={(e) => updatePreset(activePreset.id, { topK: Number(e.target.value) })}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addPreset}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-sm py-1 rounded"
                    >
                      + Новый
                    </button>
                    {local.presets.length > 1 && (
                      <button
                        onClick={() => deletePreset(activePreset.id)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-sm py-1 rounded"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "debug" && (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Action</label>
                  <select
                    value={debugActionFilter}
                    onChange={(e) => setDebugActionFilter(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="all">Все</option>
                    {debugActionTypes.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Level</label>
                  <select
                    value={debugLevelFilter}
                    onChange={(e) => setDebugLevelFilter(e.target.value as "all" | DispatchLogLevel)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="all">Все</option>
                    <option value="debug">debug</option>
                    <option value="info">info</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Поиск по event/error/trace</label>
                  <input
                    value={debugEventQuery}
                    onChange={(e) => setDebugEventQuery(e.target.value)}
                    placeholder="например: cloud.load.error"
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
                <span>Записей: {debugLogs.length} | После фильтра: {filteredDebugLogs.length}</span>
                <button
                  onClick={() => {
                    clearDispatchLog();
                    setDebugLogs([]);
                  }}
                  className="rounded bg-zinc-700 px-2 py-1 hover:bg-zinc-600"
                >
                  Очистить timeline
                </button>
              </div>

              <div className="max-h-[50vh] overflow-auto rounded-lg border border-zinc-700 bg-zinc-900/40">
                {filteredDebugLogs.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-400">Пока нет событий для отображения.</div>
                ) : (
                  <div className="divide-y divide-zinc-700/60">
                    {filteredDebugLogs.map((entry) => (
                      <div key={entry.id} className="p-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-zinc-400">{formatTs(entry.ts)}</span>
                          <span className={`font-semibold ${debugLevelClass[entry.level]}`}>{entry.level}</span>
                          <span className="rounded bg-zinc-700 px-2 py-0.5 text-zinc-100">{entry.event}</span>
                          <span className="text-zinc-200">{entry.actionType}</span>
                          {typeof entry.durationMs === "number" && (
                            <span className="text-zinc-400">{entry.durationMs}ms</span>
                          )}
                        </div>
                        <div className="mt-1 space-y-1 text-zinc-400">
                          <div>trace: {entry.traceId}</div>
                          <div>action: {entry.actionId}</div>
                          {entry.error && <div className="text-rose-300">error: {entry.error}</div>}
                          {entry.details && <div>details: {formatDetails(entry)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-zinc-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded"
          >
            Отмена
          </button>
          <button
            onClick={save}
            className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
