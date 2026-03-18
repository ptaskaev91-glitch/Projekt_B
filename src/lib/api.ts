import {
  createTextJobViaProxy,
  getTextJobStatusViaProxy,
  loadTextModelsViaProxy,
  createImageJobViaProxy,
  getImageJobStatusViaProxy,
  loadImageModelsViaProxy,
} from "../lib";
import type { ProxyTextStatus, ProxyImageStatus } from "../lib";

export const textApi = {
  loadModels: (opts?: { apiKey?: string; clientAgent?: string }) => loadTextModelsViaProxy(opts),
  createJob: (payload: Record<string, unknown>, opts: { apiKey?: string; clientAgent?: string }) =>
    createTextJobViaProxy(payload, opts),
  pollStatus: (jobId: string, opts: { apiKey?: string; clientAgent?: string }) =>
    getTextJobStatusViaProxy(jobId, opts),
};

export const imageApi = {
  loadModels: (opts?: { apiKey?: string; clientAgent?: string }) => loadImageModelsViaProxy(opts),
  createJob: (payload: Record<string, unknown>, opts: { apiKey?: string; clientAgent?: string }) =>
    createImageJobViaProxy(payload, opts),
  pollStatus: (jobId: string, opts: { apiKey?: string; clientAgent?: string }) =>
    getImageJobStatusViaProxy(jobId, opts),
};

export type { ProxyTextStatus, ProxyImageStatus };
