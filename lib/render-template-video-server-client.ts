/**
 * POST edited Lottie + optional ZIP to the Puppeteer render service → MP4 blob.
 * Set NEXT_PUBLIC_LOTTIE_RENDER_SERVER_URL (e.g. http://127.0.0.1:3847).
 * Optional NEXT_PUBLIC_LOTTIE_RENDER_SECRET must match server RENDER_SECRET.
 *
 * New servers return 202 + jobId and expose GET /render/jobs/:id for progress; the client polls and
 * then downloads GET /render/jobs/:id/file. Older servers may still return 200 with the MP4 body.
 */

export type RenderTemplateVideoOnServerOpts = {
  /** Base URL with no trailing slash, e.g. http://127.0.0.1:3847 */
  baseUrl: string;
  animationData: unknown;
  plateVideoUrl?: string | null;
  audioUrl?: string | null;
  previewFontUrls?: string[] | null;
  zipBlob?: Blob | null;
  /** Must match server RENDER_SECRET when configured */
  renderSecret?: string | null;
  /** 0–1 while server render runs (async jobs only) */
  onProgress?: (progress: number, meta?: { phase?: string }) => void;
  /** Render backend: remotion (default) or browser. */
  renderEngine?: "remotion" | "browser";
};

const POLL_MS = 400;

export async function renderTemplateVideoOnServer(opts: RenderTemplateVideoOnServerOpts): Promise<Blob> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const fd = new FormData();
  fd.append("animationData", JSON.stringify(opts.animationData));
  if (opts.plateVideoUrl?.trim()) fd.append("plateVideoUrl", opts.plateVideoUrl.trim());
  if (opts.audioUrl?.trim()) fd.append("audioUrl", opts.audioUrl.trim());
  if (opts.previewFontUrls?.length) {
    fd.append("previewFontUrls", JSON.stringify(opts.previewFontUrls));
  }
  if (opts.renderSecret?.trim()) fd.append("renderSecret", opts.renderSecret.trim());
  if (opts.renderEngine) fd.append("renderEngine", opts.renderEngine);
  if (opts.zipBlob && opts.zipBlob.size > 0) {
    fd.append("zip", opts.zipBlob, "template.zip");
  }

  const secretHeaders: HeadersInit = {};
  if (opts.renderSecret?.trim()) {
    secretHeaders["X-Render-Secret"] = opts.renderSecret.trim();
  }

  const res = await fetch(`${base}/render`, {
    method: "POST",
    body: fd,
    headers: secretHeaders,
  });

  if (res.status === 202) {
    let jobId: string;
    try {
      const j = (await res.json()) as { jobId?: string };
      if (!j.jobId || typeof j.jobId !== "string") throw new Error("Missing jobId");
      jobId = j.jobId;
    } catch {
      throw new Error("Render server returned 202 without a valid jobId");
    }

    const pollHeaders: HeadersInit = { ...secretHeaders };
    opts.onProgress?.(0, { phase: "queued" });

    for (;;) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const st = await fetch(`${base}/render/jobs/${encodeURIComponent(jobId)}`, {
        headers: pollHeaders,
      });
      if (!st.ok) {
        let detail = st.statusText;
        try {
          const j = (await st.json()) as { error?: string };
          if (j?.error) detail = j.error;
        } catch {
          try {
            detail = await st.text();
          } catch {
            /* ignore */
          }
        }
        throw new Error(detail || `Job status error (${st.status})`);
      }
      const data = (await st.json()) as {
        done?: boolean;
        progress?: number;
        phase?: string;
        error?: string | null;
      };
      if (typeof data.progress === "number" && opts.onProgress) {
        opts.onProgress(Math.min(1, Math.max(0, data.progress)), { phase: data.phase });
      }
      if (data.done) {
        if (data.error) throw new Error(data.error);
        break;
      }
    }

    const fileRes = await fetch(`${base}/render/jobs/${encodeURIComponent(jobId)}/file`, {
      headers: pollHeaders,
    });
    if (!fileRes.ok) {
      let detail = fileRes.statusText;
      try {
        const j = (await fileRes.json()) as { error?: string };
        if (j?.error) detail = j.error;
      } catch {
        try {
          detail = await fileRes.text();
        } catch {
          /* ignore */
        }
      }
      throw new Error(detail || `Render file error (${fileRes.status})`);
    }
    return fileRes.blob();
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) detail = j.error;
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail || `Render server error (${res.status})`);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("video") || ct.includes("octet-stream")) {
    return res.blob();
  }

  throw new Error("Unexpected render response (expected 202 job or video body)");
}
