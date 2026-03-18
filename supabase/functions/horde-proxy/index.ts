const HORDE_BASES = ["https://aihorde.net/api/v2", "https://stablehorde.net/api/v2"] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-horde-api-key, x-client-agent",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

type ProxyAction = "models" | "text-async" | "text-status";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function formatHordeError(status: number, fallback: string) {
  if (status === 400) return "Ошибка 400: проверь параметры запроса Horde.";
  if (status === 401) return "Ошибка 401: невалидный Horde API key.";
  if (status === 429) return "Ошибка 429: Horde rate limit.";
  if (status === 503) return "Ошибка 503: Horde временно недоступен.";
  return fallback || `Horde error ${status}`;
}

async function hordeFetch(path: string, init: RequestInit = {}, auth?: { apiKey?: string; clientAgent?: string }) {
  let lastError: Error | null = null;

  for (const base of HORDE_BASES) {
    try {
      const hasBody = typeof init.body !== "undefined";
      const response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...(auth?.apiKey ? { apikey: auth.apiKey } : {}),
          ...(auth?.clientAgent ? { "Client-Agent": auth.clientAgent } : {}),
          ...(init.headers ?? {}),
        },
      });

      const text = response.status === 204 ? "" : await response.text();
      if (!response.ok) {
        throw new Error(formatHordeError(response.status, text));
      }

      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Horde proxy request failed.");
    }
  }

  throw lastError ?? new Error("Horde proxy request failed.");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const isJsonRequest = (request.headers.get("content-type") ?? "").includes("application/json");
    const body = isJsonRequest ? await request.json().catch(() => ({})) : {};
    const action = (url.searchParams.get("action") ?? body.action ?? "models") as ProxyAction;
    const apiKey = request.headers.get("x-horde-api-key") ?? undefined;
    const clientAgent = request.headers.get("x-client-agent") ?? "HordeChatEdge/1.0";

    if (action === "models") {
      const data = await hordeFetch("/status/models?type=text", { method: "GET" });
      return json({ ok: true, action, data });
    }

    if (action === "text-status") {
      const jobId = String(url.searchParams.get("id") ?? body.id ?? "").trim();
      if (!jobId) {
        return json({ ok: false, error: "Missing job id." }, 400);
      }

      const data = await hordeFetch(`/generate/text/status/${jobId}`, { method: "GET" }, { apiKey, clientAgent });
      return json({ ok: true, action, data });
    }

    if (action === "text-async") {
      const payload = body.request ?? body.payload ?? body;
      const data = await hordeFetch(
        "/generate/text/async",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { apiKey, clientAgent },
      );
      return json({ ok: true, action, data }, 202);
    }

    return json({ ok: false, error: "Unsupported action." }, 400);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown edge error.",
      },
      500,
    );
  }
});
