export const imageActionTypes = {
  generate: "image/generate",
  removeJob: "image/removeJob",
  clearJobs: "image/clearJobs",
} as const;

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

export type ImageGeneratePayload = {
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  n?: number;
};

export type ImageRemovePayload = { id?: string };
