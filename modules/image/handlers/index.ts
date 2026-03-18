import { wait } from "../../../src/types";
import {
  createImageJobViaProxy,
  getImageJobStatusViaProxy,
} from "../../../src/lib";
import type { HandlerContext } from "../../../core/handlers/types";
import { imageActionTypes, type ImageGeneratePayload, type ImageRemovePayload } from "../actions";

export const imageHandlers: Record<string, (payload: unknown, ctx: HandlerContext) => unknown> = {
  [imageActionTypes.generate]: async (payload, ctx) => {
    const { prompt, negativePrompt, model, width, height, steps, cfgScale, sampler, n } =
      (payload ?? {}) as ImageGeneratePayload;
    if (!prompt) return;
    const state = ctx.getState();
    const jobId = `img-${Date.now()}`;
    ctx.setState((draft) => {
      draft.imageGenerating = true;
      draft.imageJobs = [
        {
          id: jobId,
          prompt,
          status: "loading",
          queuePosition: undefined,
          waitTime: undefined,
          images: [],
          error: undefined,
          createdAt: Date.now(),
        },
        ...(draft.imageJobs ?? []),
      ];
    });
    try {
      const create = await createImageJobViaProxy(
        {
          prompt: negativePrompt ? `${prompt} ### ${negativePrompt}` : prompt,
          models: [model ?? "Deliberate"],
          params: {
            width: width ?? 512,
            height: height ?? 512,
            steps: steps ?? 30,
            cfg_scale: cfgScale ?? 7.5,
            sampler_name: sampler ?? "k_euler_a",
            n: n ?? 1,
          },
        },
        { apiKey: state.settings.apiKey, clientAgent: state.settings.clientAgent }
      );
      if (!create?.id) throw new Error("Не получен id задачи.");

      for (let i = 0; i < 120; i++) {
        const status = await getImageJobStatusViaProxy(create.id, {
          apiKey: state.settings.apiKey,
          clientAgent: state.settings.clientAgent,
        });
        ctx.setState((draft) => {
          draft.imageJobs = (draft.imageJobs ?? []).map((j) =>
            j.id === jobId ? { ...j, queuePosition: status.queue_position, waitTime: status.wait_time } : j
          );
        });
        if (status.done && Array.isArray(status.generations) && status.generations.length > 0) {
          const images = status.generations.map((g: { img: string; seed: string; worker_name: string }) => ({
            url: g.img.startsWith("http") ? g.img : `data:image/webp;base64,${g.img}`,
            seed: g.seed,
            worker: g.worker_name,
          }));
          ctx.setState((draft) => {
            draft.imageJobs = (draft.imageJobs ?? []).map((j) => (j.id === jobId ? { ...j, status: "done", images } : j));
            draft.imageGenerating = false;
          });
          return;
        }
        if (status.faulted) throw new Error("Задача завершилась с ошибкой.");
        await wait(3000);
      }
      throw new Error("Таймаут ожидания изображения.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка генерации";
      ctx.setState((draft) => {
        draft.imageJobs = (draft.imageJobs ?? []).map((j) => (j.id === jobId ? { ...j, status: "error", error: msg } : j));
        draft.validationErrors = [...draft.validationErrors, msg];
        draft.imageGenerating = false;
      });
    }
  },

  [imageActionTypes.removeJob]: (payload, ctx) => {
    const { id } = (payload ?? {}) as ImageRemovePayload;
    if (!id) return;
    ctx.setState((draft) => {
      draft.imageJobs = (draft.imageJobs ?? []).filter((job) => job.id !== id);
    });
  },

  [imageActionTypes.clearJobs]: (_payload, ctx) => {
    ctx.setState((draft) => {
      draft.imageJobs = [];
    });
  },
};
