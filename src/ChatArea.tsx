import { ChangeEvent, FormEvent, KeyboardEvent, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatAsset, ChatMessage, ChatSession, HordeSettings } from "./types";
import type { CloudStatus } from "./hooks";

// ═══════════════════════════════════════════════════════════
// MessageBubble
// ═══════════════════════════════════════════════════════════

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const bubbleClass = isUser
    ? "border-indigo-500/20 bg-indigo-500/15 text-indigo-50"
    : message.status === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-50"
      : "border-zinc-800/80 bg-[#151822] text-zinc-100";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`group/msg relative max-w-[92%] rounded-3xl border px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:max-w-[82%] ${bubbleClass}`}>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <span>{isUser ? "Вы" : "Horde"}</span>
          <span>•</span>
          <span>{new Date(message.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
          {message.status === "done" && (
            <button
              onClick={() => copyToClipboard(message.content)}
              type="button"
              className="ml-auto rounded-lg px-2 py-1 text-[10px] text-zinc-500 opacity-0 transition hover:bg-white/5 hover:text-zinc-300 group-hover/msg:opacity-100"
            >
              Копировать
            </button>
          )}
        </div>
        <div className="prose prose-sm prose-invert max-w-none text-sm leading-7">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        {message.status === "loading" && (
          <p className="mt-3 text-xs text-zinc-400">Очередь: {message.queuePosition ?? "-"} · Ожидание: {message.waitTime ?? "-"} сек</p>
        )}
        {message.workerName && <p className="mt-3 text-xs text-zinc-500">Воркер: {message.workerName}</p>}
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════
// ChatArea
// ═══════════════════════════════════════════════════════════

type Props = {
  activeChat: ChatSession | null;
  settings: HordeSettings;
  effectiveModelName: string;
  transportLabel: string;
  supabaseStatus: string;
  cloudStatus: CloudStatus;
  cloudMessage: string;
  sessionEmail: string | null;
  input: string;
  sending: boolean;
  globalError: string;
  assets: ChatAsset[];
  assetsLoading: boolean;
  assetsUploading: boolean;
  assetsError: string;
  sessionUser: boolean;
  contextUsage: number;
  contextPercent: number;
  validationErrors: string[];
  onSetInput: (v: string) => void;
  onSendMessage: (e: FormEvent) => void;
  onFileSelected: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAsset: (path: string) => void;
  onInsertAsset: (asset: ChatAsset) => void;
};

export function ChatArea(props: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="flex min-h-[60vh] flex-col bg-[#0f1117] xl:border-r xl:border-zinc-800/80">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-[#11131a] px-4 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Horde Chat</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-zinc-800 bg-[#151822] px-3 py-1.5 text-zinc-300">
              {props.transportLabel}
            </span>
            <span className={`rounded-full border px-3 py-1.5 ${props.cloudStatus === "ready" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : props.cloudStatus === "syncing" ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : props.cloudStatus === "error" ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-zinc-800 bg-[#151822] text-zinc-300"}`}>
              {props.cloudStatus === "ready" ? "✓ sync" : props.cloudStatus === "syncing" ? "⟳ saving" : props.cloudStatus}
            </span>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-indigo-200">
              {props.effectiveModelName}
            </span>
            <span className={`rounded-full border px-3 py-1.5 ${
              props.contextUsage / props.settings.maxContextTokens > 0.8
                ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                : props.contextUsage / props.settings.maxContextTokens > 0.5
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : "border-zinc-800 bg-[#151822] text-zinc-300"
            }`}>
              ctx: {props.contextUsage}/{props.settings.maxContextTokens}
            </span>
          </div>
        </div>
        <div className="mx-auto mt-2 w-full max-w-4xl">
          <div className="h-2 overflow-hidden rounded-full border border-zinc-800/60 bg-[#0f1117]">
            <div
              className={`h-full transition-all ${props.contextPercent > 90 ? "bg-rose-500" : props.contextPercent > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${props.contextPercent}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            <span>Контекст</span>
            <span>{props.contextPercent}%</span>
          </div>
          {props.contextPercent > 90 && (
            <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100">
              Контекст почти заполнен. Сократите сообщение или очистите историю, чтобы избежать обрезки.
            </div>
          )}
          {props.validationErrors.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
              {props.validationErrors[0]}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          {props.activeChat?.messages.length ? (
            props.activeChat.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          ) : (
            <div className="rounded-[28px] border border-dashed border-zinc-800 bg-[#151822] px-6 py-10 text-center">
              <p className="text-lg font-medium text-zinc-100">Начните новый диалог</p>
              <p className="mt-2 text-sm text-zinc-400">Контекст чата прикладывается автоматически.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer / Input */}
      <footer className="border-t border-zinc-800/80 bg-[#11131a] px-4 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-zinc-800 bg-[#151822] px-3 py-1.5">Модель: {props.effectiveModelName}</span>
            <span className="rounded-full border border-zinc-800 bg-[#151822] px-3 py-1.5">Max: {props.activeChat?.maxLength ?? 400}</span>
            {props.settings.modelSelectionMode === "manual" ? (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-200">Ручной выбор</span>
            ) : (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">Авто</span>
            )}
          </div>

          <form onSubmit={props.onSendMessage} className="rounded-[28px] border border-zinc-800/80 bg-[#151822] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <input ref={fileRef} type="file" className="hidden" onChange={props.onFileSelected} />
            <textarea
              value={props.input}
              onChange={(e) => props.onSetInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-28 w-full resize-y border-0 bg-transparent px-2 py-2 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-500"
              placeholder="Напишите сообщение..."
            />

            <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={!props.sessionUser || !props.activeChat || props.assetsUploading} className="rounded-2xl border border-zinc-700 bg-[#11131a] px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50">
                {props.assetsUploading ? "Загрузка..." : "Файл"}
              </button>
              <span className="text-xs text-zinc-500">
                {!props.sessionUser ? "нужен логин" : props.assetsLoading ? "загрузка..." : `${props.assets.length} файлов`}
              </span>
            </div>

            {props.assets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-800/80 px-2 pt-3">
                {props.assets.map((a) => {
                  const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(a.name);
                  return (
                    <div key={a.path} className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-[#11131a] px-3 py-2 text-xs text-zinc-300">
                      {isImg && a.url ? <img src={a.url} alt={a.name} className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">📄</span>}
                      <span className="max-w-[140px] truncate text-zinc-100">{a.name}</span>
                      <button type="button" onClick={() => props.onInsertAsset(a)} className="text-indigo-300 hover:text-indigo-200">вставить</button>
                      {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">открыть</a>}
                      <button type="button" onClick={() => void props.onRemoveAsset(a.path)} className="text-rose-300 hover:text-rose-200">удалить</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800/80 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500">Enter — отправить · Shift+Enter — новая строка</div>
              <button disabled={props.sending || !props.activeChat} type="submit" className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                {props.sending ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </form>

          {props.assetsError && <p className="text-sm text-amber-300">{props.assetsError}</p>}
          {props.globalError && <p className="text-sm text-rose-300">{props.globalError}</p>}
        </div>
      </footer>
    </section>
  );
}
