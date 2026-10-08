"use client";

import { ApiError } from "./client";
import type { Assessment } from "./hooks";

export type LayerName = "Heuristics" | "GeminiMultimodal" | "CommunityReputation";

export interface LayerEvent {
  layer: LayerName;
  available: boolean;
  score?: number | null;
  note?: string | null;
}

interface StreamOptions {
  text: string;
  isLink?: boolean;
  languageCode?: string;
  onLayer?: (e: LayerEvent) => void;
  signal?: AbortSignal;
}

/**
 * Runs a text check and reports each pipeline layer as it finishes (§4.2 SSE), so the progress the
 * user sees is the real pipeline, not a timer. Falls back to the plain POST if streaming is not
 * available (old browser, proxy that buffers, network hiccup) — the user always gets a verdict.
 */
export async function streamCheck({ text, isLink = false, languageCode, onLayer, signal }: StreamOptions): Promise<Assessment> {
  const body = JSON.stringify({ text, isLink, languageCode: languageCode ?? null });

  if (typeof EventSource !== "undefined") {
    const start = await fetch("/backend/api/v1/scam-check/text/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal,
    }).catch(() => null);

    if (start?.ok) {
      const { streamId } = (await start.json()) as { streamId: string };
      const streamed = await new Promise<Assessment | null>((resolve, reject) => {
        const es = new EventSource(`/backend/api/v1/scam-check/${streamId}/stream`);
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          es.close();
          fn();
        };
        signal?.addEventListener("abort", () => finish(() => reject(new DOMException("aborted", "AbortError"))));
        es.addEventListener("layer", (e) => onLayer?.(JSON.parse((e as MessageEvent).data) as LayerEvent));
        es.addEventListener("result", (e) => finish(() => resolve(JSON.parse((e as MessageEvent).data) as Assessment)));
        es.addEventListener("failed", (e) => {
          const p = JSON.parse((e as MessageEvent).data) as { code?: string; message?: string };
          finish(() => reject(new ApiError(400, p.code, p.message ?? "Check failed")));
        });
        // Transport error before a result: fall back to the plain request below.
        es.onerror = () => finish(() => resolve(null));
      });
      if (streamed) return streamed;
    }
  }

  const res = await fetch("/backend/api/v1/scam-check/text", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal,
  });
  if (!res.ok) {
    const p = (await res.json().catch(() => ({}))) as { code?: string; detail?: string; title?: string };
    throw new ApiError(res.status, p.code, p.detail ?? p.title ?? "Check failed");
  }
  return (await res.json()) as Assessment;
}
