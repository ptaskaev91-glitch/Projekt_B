import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type ThemeMode = "dark" | "light" | "system";

export type GenerationPreset = {
  id: string;
  name: string;
  maxLength: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
};

export type HordeSettings = {
  apiKey: string;
  clientAgent: string;
  modelSelectionMode: "auto" | "manual";
  theme: ThemeMode;
  systemPrompt: string;
  maxContextTokens: number;
  activePresetId: string;
  presets: GenerationPreset[];
  language: "ru" | "en";
};

export type MessageRole = "user" | "assistant";
export type MessageStatus = "done" | "loading" | "error";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
  queuePosition?: number;
  waitTime?: number;
  workerName?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  model: string;
  maxLength: number;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type HordeModelRaw = {
  name?: string;
  type?: string;
  count?: number | string;
  queued?: number | string;
  performance?: number | string;
  eta?: number | string;
  description?: string;
  tags?: string[];
};

export type HordeModelView = {
  name: string;
  workers: number;
  queue: number;
  performance: number;
  eta: number | null;
  strengths: string;
  powerVsGpt5: number;
};

export type ChatAsset = {
  name: string;
  path: string;
  url: string | null;
  createdAt?: string | null;
};

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

export const SETTINGS_KEY = "horde-chat-settings";
export const CHATS_KEY = "horde-chat-history";
export const ACTIVE_CHAT_KEY = "horde-active-chat";

export const DEFAULT_PRESETS: GenerationPreset[] = [
  { id: "balanced", name: "Сбалансированный", maxLength: 400, temperature: 0.7, topP: 0.9, topK: 40, repetitionPenalty: 1.15 },
  { id: "creative", name: "Креативный", maxLength: 600, temperature: 1.0, topP: 0.95, topK: 80, repetitionPenalty: 1.1 },
  { id: "precise", name: "Точный", maxLength: 300, temperature: 0.3, topP: 0.8, topK: 20, repetitionPenalty: 1.2 },
  { id: "code", name: "Код", maxLength: 800, temperature: 0.2, topP: 0.85, topK: 30, repetitionPenalty: 1.05 },
];

export const DEFAULT_SYSTEM_PROMPT = `Ты полезный AI-ассистент. Отвечай на том языке, на котором задан вопрос. Будь точным, полезным и дружелюбным.`;

export const DEFAULT_SETTINGS: HordeSettings = {
  apiKey: "EjTKH-bynCU1seCtW6TeTw",
  clientAgent: "HordeChat/1.0",
  modelSelectionMode: "auto",
  theme: "dark",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  maxContextTokens: 4096,
  activePresetId: "balanced",
  presets: DEFAULT_PRESETS,
  language: "ru",
};

// ═══════════════════════════════════════════════════════════
// UTILS — cn (tailwind class merger)
// ═══════════════════════════════════════════════════════════

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════
// UTILS — helpers
// ═══════════════════════════════════════════════════════════

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function inferStrengths(modelName: string, description?: string, tags?: string[]) {
  const source = `${modelName} ${description ?? ""} ${(tags ?? []).join(" ")}`.toLowerCase();
  if (source.includes("coder") || source.includes("code")) return "Код, дебаг, технические объяснения";
  if (source.includes("role") || source.includes("rp") || source.includes("chat")) return "Диалог, roleplay, креатив";
  if (source.includes("llama") || source.includes("mistral") || source.includes("mixtral")) return "Логика, инструкции, структурированные ответы";
  if (source.includes("story") || source.includes("creative")) return "Истории, стиль, творческие задачи";
  return "Универсальный чат и общие ответы";
}

export function calculatePowerVsGpt5(workers: number, queue: number, performance: number, modelName: string) {
  const lower = modelName.toLowerCase();
  const workerScore = clamp(workers * 6, 0, 36);
  const performanceScore = clamp(performance / 3.5, 0, 34);
  const queuePenalty = clamp(queue * 2.7, 0, 24);
  const familyBonus = lower.includes("mixtral") || lower.includes("llama") || lower.includes("mistral") ? 12 : 6;
  return Math.round(clamp(24 + workerScore + performanceScore + familyBonus - queuePenalty, 5, 99));
}

export function mapModel(raw: HordeModelRaw): HordeModelView | null {
  const name = raw.name?.trim();
  if (!name) return null;

  const lowerType = (raw.type ?? "").toLowerCase();
  const isText = lowerType.includes("text") || lowerType.includes("llm") || lowerType === "";
  if (!isText) return null;

  const workers = toNumber(raw.count, 0);
  const queue = toNumber(raw.queued, 0);
  const performance = toNumber(raw.performance, 0);
  const eta = raw.eta == null ? null : toNumber(raw.eta, 0);

  return {
    name,
    workers,
    queue,
    performance,
    eta,
    strengths: inferStrengths(name, raw.description, raw.tags),
    powerVsGpt5: calculatePowerVsGpt5(workers, queue, performance, name),
  };
}

export function getDefaultChat(initialModel = "aphrodite"): ChatSession {
  const now = Date.now();
  return {
    id: uid(),
    title: "Новый чат",
    model: initialModel,
    maxLength: 400,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function normalizeMessage(input: Partial<ChatMessage>): ChatMessage {
  return {
    id: input.id ?? uid(),
    role: input.role === "assistant" ? "assistant" : "user",
    content: typeof input.content === "string" ? input.content : "",
    createdAt: typeof input.createdAt === "number" ? input.createdAt : Date.now(),
    status: input.status === "loading" || input.status === "error" ? input.status : "done",
    queuePosition: typeof input.queuePosition === "number" ? input.queuePosition : undefined,
    waitTime: typeof input.waitTime === "number" ? input.waitTime : undefined,
    workerName: typeof input.workerName === "string" ? input.workerName : undefined,
  };
}

export function normalizeChat(input: Partial<ChatSession>): ChatSession {
  const now = Date.now();
  return {
    id: input.id ?? uid(),
    title: typeof input.title === "string" && input.title.trim() ? input.title : "Новый чат",
    model: typeof input.model === "string" && input.model.trim() ? input.model : "aphrodite",
    maxLength: typeof input.maxLength === "number" ? input.maxLength : 400,
    createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : now,
    messages: Array.isArray(input.messages) ? input.messages.map((m) => normalizeMessage(m)) : [],
  };
}

// Simple token estimation: ~4 chars per token for mixed Russian/English
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildPromptWithContext(
  chat: ChatSession,
  userInput: string,
  systemPrompt: string,
  maxContextTokens: number
): { prompt: string; usedTokens: number; totalTokens: number } {
  const contextMessages = chat.messages.filter((m) => m.status === "done");

  // Build base prompt
  const systemLine = systemPrompt.trim() || "Ты полезный AI-ассистент.";
  const userLine = `Пользователь: ${userInput}`;
  const assistantLine = "Ассистент:";

  const baseTokens = estimateTokens(systemLine + userLine + assistantLine);
  let availableTokens = maxContextTokens - baseTokens - 100; // reserve for response hint

  // Add messages from newest to oldest until we run out of tokens
  const includedMessages: string[] = [];
  for (let i = contextMessages.length - 1; i >= 0 && availableTokens > 0; i--) {
    const m = contextMessages[i];
    const line = `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`;
    const lineTokens = estimateTokens(line);
    if (lineTokens <= availableTokens) {
      includedMessages.unshift(line);
      availableTokens -= lineTokens;
    } else {
      break;
    }
  }

  const lines = [systemLine, ...includedMessages, userLine, assistantLine];
  const prompt = lines.join("\n");
  const usedTokens = estimateTokens(prompt);

  return { prompt, usedTokens, totalTokens: maxContextTokens };
}
