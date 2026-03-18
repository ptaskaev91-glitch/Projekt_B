import type { ChatSession, HordeSettings } from "../../src/types";
import { estimateTokens } from "../../src/types";
import type { ChatAsset } from "../../src/types";
import type { Session } from "@supabase/supabase-js";

export type AppState = {
  chats: ChatSession[];
  settings: HordeSettings;
  activeChatId: string;
  validationErrors: string[];
  assets: ChatAsset[];
  assetsLoading: boolean;
  assetsError: string;
  cloudStatus?: "idle" | "checking" | "ready" | "syncing" | "schema-missing" | "error" | "conflict";
  cloudMessage?: string;
  lastSyncTime?: number | null;
  session?: Session | null;
  conflictData?: {
    localChats: ChatSession[];
    cloudChats: ChatSession[];
    localSettings: HordeSettings;
    cloudSettings: Partial<HordeSettings> | null;
  } | null;
  imageJobs?: {
    id: string;
    prompt: string;
    status: "loading" | "done" | "error";
    queuePosition?: number;
    waitTime?: number;
    images: { url: string; seed: string; worker: string }[];
    error?: string;
    createdAt: number;
  }[];
  imageGenerating?: boolean;
};

export const selectors = {
  activeChat(state: AppState) {
    return state.chats.find((c) => c.id === state.activeChatId) ?? state.chats[0] ?? null;
  },
  contextUsage(state: AppState) {
    const active = selectors.activeChat(state);
    if (!active) return 0;
    return estimateTokens(active.messages.filter((m) => m.status === "done").map((m) => m.content).join(" "));
  },
};
