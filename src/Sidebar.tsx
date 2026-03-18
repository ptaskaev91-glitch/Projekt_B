import { ChangeEvent, useState } from "react";
import type { ChatSession, HordeSettings } from "./types";
import type { CloudStatus } from "./hooks";
import { supabaseProjectMeta } from "./lib";

type Props = {
  chats: ChatSession[];
  activeChat: ChatSession | null;
  settings: HordeSettings;
  supabaseStatus: "checking" | "ready" | "error";
  cloudStatus: CloudStatus;
  cloudMessage: string;
  lastSyncLabel: string | null;
  sessionEmail: string | null;
  sessionUser: boolean;
  authEmail: string;
  authLoading: boolean;
  authMessage: string;
  onSetAuthEmail: (v: string) => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  onCreateChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onExportChat: (chat: ChatSession) => void;
  onExportAll: () => void;
  onImportChats: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpdateSettings: (s: Partial<HordeSettings>) => void;
  onUpdateMaxLength: (v: number) => void;
  maxLength: number;
};

export function Sidebar(props: Props) {
  const [chatFilter, setChatFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const sorted = [...props.chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const filtered = chatFilter.trim()
    ? sorted.filter((c) => {
        const t = chatFilter.trim().toLowerCase();
        return c.title.toLowerCase().includes(t) || c.model.toLowerCase().includes(t) || c.messages.some((m) => m.content.toLowerCase().includes(t));
      })
    : sorted;

  function saveRename() {
    if (!editingId) return;
    props.onRenameChat(editingId, editingTitle.trim() || "Новый чат");
    setEditingId(null);
  }

  return (
    <aside className="bg-[#11131a] xl:border-r xl:border-zinc-800/80">
      <div className="flex h-full flex-col p-4">
        <button onClick={props.onCreateChat} type="button" className="rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400">
          + Новый чат
        </button>

        <div className="mt-3 flex gap-2">
          <button onClick={props.onExportAll} type="button" className="flex-1 rounded-2xl border border-zinc-700 bg-[#151822] px-3 py-2.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:bg-[#1a1e28]">
            Экспорт
          </button>
          <label className="flex-1">
            <input type="file" accept=".json" className="hidden" onChange={props.onImportChats} />
            <span className="block cursor-pointer rounded-2xl border border-zinc-700 bg-[#151822] px-3 py-2.5 text-center text-xs text-zinc-300 transition hover:border-zinc-600 hover:bg-[#1a1e28]">
              Импорт
            </span>
          </label>
        </div>

        <input
          value={chatFilter}
          onChange={(e) => setChatFilter(e.target.value)}
          placeholder="Поиск по чатам..."
          className="mt-3 w-full rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400"
        />

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {filtered.map((chat) => {
            const isActive = chat.id === props.activeChat?.id;
            const isEditing = editingId === chat.id;
            return (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 rounded-2xl border px-2 py-2 transition ${isActive ? "border-indigo-500/40 bg-indigo-500/10" : "border-zinc-800/80 bg-[#161922] hover:border-zinc-700 hover:bg-[#1a1e28]"}`}
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2 px-2">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 rounded-xl border border-zinc-700 bg-[#0d0f14] px-2 py-1.5 text-sm text-zinc-100 outline-none"
                    />
                    <button onClick={saveRename} type="button" className="text-xs text-emerald-400 hover:text-emerald-300">✓</button>
                    <button onClick={() => setEditingId(null)} type="button" className="text-xs text-zinc-500 hover:text-zinc-300">✕</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => props.onSelectChat(chat.id)} type="button" className="min-w-0 flex-1 px-2 text-left">
                      <p className="truncate text-sm font-medium text-zinc-100">{chat.title}</p>
                      <p className="mt-1 truncate text-[11px] text-zinc-500">{chat.model || "Автовыбор"}</p>
                    </button>
                    <button onClick={() => { setEditingId(chat.id); setEditingTitle(chat.title); }} type="button" className="rounded-xl px-2 py-2 text-xs text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Переименовать">✎</button>
                    <button onClick={() => props.onExportChat(chat)} type="button" className="rounded-xl px-2 py-2 text-xs text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Экспорт">↓</button>
                    <button onClick={() => props.onDeleteChat(chat.id)} type="button" className="rounded-xl px-2 py-2 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100" aria-label="Удалить">✕</button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div className="mt-4 rounded-3xl border border-zinc-800/80 bg-[#0d0f14] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
          <h2 className="mb-4 text-sm font-semibold text-zinc-100">Настройки</h2>
          <div className="space-y-4">
            {/* Supabase */}
            <div className="rounded-2xl border border-zinc-800 bg-[#151822] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Supabase</p>
                  <p className="mt-1 text-sm font-medium text-white">{supabaseProjectMeta.projectRef}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${props.supabaseStatus === "ready" ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : props.supabaseStatus === "error" ? "border border-rose-500/20 bg-rose-500/10 text-rose-200" : "border border-zinc-700 bg-zinc-800/70 text-zinc-300"}`}>
                  {props.supabaseStatus === "ready" ? "готов" : props.supabaseStatus === "error" ? "ошибка" : "проверка"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-zinc-400">
                <p>Cloud: <span className={props.cloudStatus === "ready" ? "text-emerald-400" : props.cloudStatus === "syncing" ? "text-amber-400" : props.cloudStatus === "error" ? "text-rose-400" : "text-zinc-400"}>{props.cloudStatus}</span></p>
                {props.lastSyncLabel && <p className="text-zinc-500">{props.lastSyncLabel}</p>}
                <p className="text-zinc-500">{props.cloudMessage}</p>
              </div>
            </div>

            {/* Auth */}
            <div className="rounded-2xl border border-zinc-800 bg-[#151822] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Auth</p>
                  <p className="mt-1 text-sm font-medium text-white">{props.sessionEmail ?? "Гость"}</p>
                </div>
                {props.sessionUser && (
                  <button type="button" onClick={props.onSignOut} disabled={props.authLoading} className="rounded-2xl border border-zinc-700 bg-[#11131a] px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-600 disabled:opacity-50">
                    {props.authLoading ? "Выход..." : "Выйти"}
                  </button>
                )}
              </div>
              {!props.sessionUser ? (
                <div className="mt-3 space-y-3">
                  <input value={props.authEmail} onChange={(e) => props.onSetAuthEmail(e.target.value)} placeholder="Email для magic link" className="w-full rounded-2xl border border-zinc-800 bg-[#11131a] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400" />
                  <button type="button" onClick={props.onSendMagicLink} disabled={props.authLoading} className="w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60">
                    {props.authLoading ? "Отправка..." : "Войти через magic link"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-emerald-200">Сессия активна. Синхронизация через Supabase DB.</p>
              )}
              {props.authMessage && <p className="mt-3 text-xs text-zinc-400">{props.authMessage}</p>}
            </div>

            {/* API Key */}
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-500">API key</span>
              <input value={props.settings.apiKey} onChange={(e) => props.onUpdateSettings({ apiKey: e.target.value })} className="w-full rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400" />
            </label>

            {/* Client Agent */}
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-500">Client-Agent</span>
              <input value={props.settings.clientAgent} onChange={(e) => props.onUpdateSettings({ clientAgent: e.target.value })} className="w-full rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400" />
            </label>

            {/* Model selection mode */}
            <div>
              <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-500">Выбор сети</span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => props.onUpdateSettings({ modelSelectionMode: "auto" })} className={`rounded-2xl border px-3 py-2.5 text-sm transition ${props.settings.modelSelectionMode === "auto" ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-zinc-800 bg-[#151822] text-zinc-300 hover:border-zinc-700"}`}>Авто</button>
                <button type="button" onClick={() => props.onUpdateSettings({ modelSelectionMode: "manual" })} className={`rounded-2xl border px-3 py-2.5 text-sm transition ${props.settings.modelSelectionMode === "manual" ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-zinc-800 bg-[#151822] text-zinc-300 hover:border-zinc-700"}`}>Мануально</button>
              </div>
            </div>

            {/* Max length */}
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-500">Max length</span>
              <input type="number" min={64} max={2048} value={props.maxLength} onChange={(e) => props.onUpdateMaxLength(Number(e.target.value))} className="w-full rounded-2xl border border-zinc-800 bg-[#151822] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-400" />
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
