import { FormEvent, useState } from "react";
import type { ImageJob, ImageGeneratePayload } from "../actions";

const SAMPLERS = ["k_euler_a", "k_euler", "k_dpm_2", "k_dpm_2_a", "k_lms", "k_heun", "ddim"];
const SIZES = [512, 576, 640, 704, 768, 832, 896, 960, 1024];

type ImagePanelState = {
  imageJobs: ImageJob[];
  imageGenerating: boolean;
};

type ImagePanelActions = {
  onGenerate: (params: ImageGeneratePayload) => void;
  onRemoveJob: (id: string) => void;
  onClearJobs: () => void;
};

type ImagePanelProps = {
  state: ImagePanelState;
  actions: ImagePanelActions;
};

export function ImagePanel(props: ImagePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState("Deliberate");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [sampler, setSampler] = useState("k_euler_a");
  const [n, setN] = useState(1);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || props.state.imageGenerating) return;
    props.actions.onGenerate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      model,
      width,
      height,
      steps,
      cfgScale,
      sampler,
      n,
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#11131a] border-t border-zinc-800/80">
      <h3 className="text-lg font-semibold text-white">🎨 Генерация изображений</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Описание изображения..."
          className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          rows={2}
        />

        <input
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Негативный промпт (опционально)"
          className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-zinc-400">Модель</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded bg-zinc-800 px-2 py-1 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400">Sampler</label>
            <select
              value={sampler}
              onChange={(e) => setSampler(e.target.value)}
              className="w-full rounded bg-zinc-800 px-2 py-1 text-white"
            >
              {SAMPLERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-zinc-400">Ширина</label>
            <select
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full rounded bg-zinc-800 px-2 py-1 text-white"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-zinc-400">Высота</label>
            <select
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full rounded bg-zinc-800 px-2 py-1 text-white"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-zinc-400">Steps ({steps})</label>
            <input
              type="range"
              min={10}
              max={50}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-zinc-400">CFG ({cfgScale})</label>
            <input
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={cfgScale}
              onChange={(e) => setCfgScale(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-zinc-400">Количество ({n})</label>
            <input
              type="range"
              min={1}
              max={4}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={props.state.imageGenerating || !prompt.trim()}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {props.state.imageGenerating ? "Генерирую..." : "🖼️ Генерировать"}
        </button>
      </form>

      {props.state.imageJobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-300">Результаты</h4>
            <button
              onClick={props.actions.onClearJobs}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Очистить все
            </button>
          </div>

          {props.state.imageJobs.map((job) => (
            <div key={job.id} className="rounded bg-zinc-800/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-zinc-400 truncate flex-1">{job.prompt}</p>
                <button
                  onClick={() => props.actions.onRemoveJob(job.id)}
                  className="text-zinc-500 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>

              {job.status === "loading" && (
                <div className="mt-2 text-xs text-yellow-400">
                  ⏳ Генерирую...
                  {job.queuePosition !== undefined && ` Очередь: ${job.queuePosition}`}
                  {job.waitTime !== undefined && ` (~${job.waitTime}с)`}
                </div>
              )}

              {job.status === "error" && (
                <div className="mt-2 text-xs text-red-400">❌ {job.error}</div>
              )}

              {job.status === "done" && job.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {job.images.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={img.url}
                        alt={`Generated ${i + 1}`}
                        className="w-full rounded border border-zinc-700 hover:border-emerald-500 transition"
                      />
                      <p className="mt-1 text-xs text-zinc-500 truncate">
                        seed: {img.seed}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
