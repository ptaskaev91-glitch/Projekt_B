import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib";
import {
  scheduleProxyRetry,
  getTransportLabel,
} from "./lib";
import { textApi } from "./lib/api";
import {
  mapModel,
} from "./types";
import type { HordeModelRaw, HordeModelView, HordeSettings } from "./types";

export type CloudStatus = "idle" | "checking" | "ready" | "syncing" | "schema-missing" | "error" | "conflict";

export type ImageJob = {
  id: string;
  prompt: string;
  status: "loading" | "done" | "error";
  queuePosition?: number;
  waitTime?: number;
  images: { url: string; seed: string; worker: string }[];
  error?: string;
  createdAt: number;
};

export type ImageParams = {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  n?: number;
};

// ═══════════════════════════════════════════════════════════
// useAuth
// ═══════════════════════════════════════════════════════════

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "ready" | "error">("checking");

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setSupabaseStatus("error");
        setAuthMessage(error.message);
        return;
      }
      setSession(data.session);
      setSupabaseStatus("ready");
      if (data.session?.user.email) setAuthEmail(data.session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSupabaseStatus("ready");
      if (next?.user.email) setAuthEmail(next.user.email);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function sendMagicLink() {
    const email = authEmail.trim();
    if (!email) { setAuthMessage("Введите email для входа через magic link."); return; }
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setAuthMessage("Ссылка для входа отправлена на email.");
    } catch (e) {
      setAuthMessage(e instanceof Error ? e.message : "Ошибка входа.");
      setSupabaseStatus("error");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setAuthMessage("Выход выполнен.");
    } catch (e) {
      setAuthMessage(e instanceof Error ? e.message : "Ошибка выхода.");
    } finally {
      setAuthLoading(false);
    }
  }

  return { session, authEmail, setAuthEmail, authLoading, authMessage, supabaseStatus, sendMagicLink, signOut };
}

// ═══════════════════════════════════════════════════════════
// useModels
// ═══════════════════════════════════════════════════════════

export function useModels(settings: HordeSettings, activeChatModel: string | undefined) {
  const [models, setModels] = useState<HordeModelView[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [lastModelsRefresh, setLastModelsRefresh] = useState<number | null>(null);
  const [transportTick, setTransportTick] = useState(0);
  const loadingRef = useRef(false);

  const loadModels = useCallback(async (silent = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) { setModelsLoading(true); setModelsError(""); }
    try {
      const raw = (await textApi.loadModels()) as HordeModelRaw[] | { models?: HordeModelRaw[] } | null;
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.models) ? raw.models : [];
      const mapped = arr.map(mapModel).filter((m): m is HordeModelView => m !== null);
      setModels(mapped);
      setLastModelsRefresh(Date.now());
      setModelsError(mapped.length === 0 ? "Нет text-моделей." : "");
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : "Ошибка загрузки моделей.");
    } finally {
      if (!silent) setModelsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadModels();
    const id = window.setInterval(() => void loadModels(true), 5000);
    return () => window.clearInterval(id);
  }, [loadModels]);

  useEffect(() => {
    scheduleProxyRetry(30000);
    const id = window.setInterval(() => setTransportTick((p) => p + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const sortedModels = useMemo(
    () => [...models].sort((a, b) => b.powerVsGpt5 - a.powerVsGpt5 || b.workers - a.workers || a.queue - b.queue || b.performance - a.performance || a.name.localeCompare(b.name)),
    [models],
  );

  const filteredModels = useMemo(() => {
    const t = modelFilter.trim().toLowerCase();
    if (!t) return sortedModels;
    return sortedModels.filter((m) => `${m.name} ${m.strengths}`.toLowerCase().includes(t));
  }, [modelFilter, sortedModels]);

  const bestModel = sortedModels[0] ?? null;

  const effectiveModelName =
    settings.modelSelectionMode === "auto"
      ? bestModel?.name ?? activeChatModel ?? "aphrodite"
      : activeChatModel || bestModel?.name || "aphrodite";

  const effectiveModel = sortedModels.find((m) => m.name === effectiveModelName) ?? bestModel ?? null;

  const transportLabel = `${getTransportLabel()}${transportTick > 0 ? "" : ""}`;

  return {
    models, sortedModels, filteredModels, bestModel, effectiveModel, effectiveModelName,
    modelsLoading, modelsError, modelFilter, setModelFilter, lastModelsRefresh,
    loadModels, transportLabel,
  };
}
