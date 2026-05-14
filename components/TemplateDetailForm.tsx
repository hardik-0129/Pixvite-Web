"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Template } from "@/lib/templates";
import { isFormFieldEnabled } from "@/lib/templates";
import { withBackendPrefix } from "@/lib/backend-url";
import { InstagramSupportLink } from "./InstagramSupportLink";
import { TemplateCheckoutModal } from "./TemplateCheckoutModal";
import { TemplateEditorPreview } from "./TemplateEditorPreview";

type Props = {
  template: Template;
};

function fieldInputId(name: string) {
  return `field-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function isImageField(field: Template["formFields"][number]) {
  return field.type === "image" || /photo|image/i.test(field.label);
}

function textareaMinHeight(label: string, value: string): number {
  const lines = value.split("\n").length;
  const l = label.toLowerCase();
  if (l.includes("4-lines") || l.includes("description")) return 100;
  if (l.includes("3-lines") || l.includes("subtitle")) return 80;
  if (l.includes("2-lines") || l.includes("address") || l.includes("tag-line")) return 60;
  if (lines >= 3) return Math.min(100, lines * 22 + 24);
  if (lines === 2) return 80;
  return 44;
}

const fieldLabelClass =
  "font-body mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]";

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function TemplateDetailForm({ template }: Props) {
  const router = useRouter();
  const visibleFormFields = useMemo(
    () => template.formFields.filter((f) => isFormFieldEnabled(f)),
    [template.formFields]
  );

  const textFields = useMemo(() => visibleFormFields.filter((f) => !isImageField(f)), [visibleFormFields]);
  const imageFields = useMemo(() => visibleFormFields.filter((f) => isImageField(f)), [visibleFormFields]);
  const hasImageFields = imageFields.length > 0;

  const [activeTab, setActiveTab] = useState<"text" | "image">("text");

  const initial = useMemo(() => {
    const next: Record<string, string> = {};
    template.formFields.forEach((f) => {
      next[f.name] = f.defaultValue;
    });
    return next;
  }, [template.formFields]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [prefillProfile, setPrefillProfile] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string } | undefined>(undefined);

  const [renderOrderId, setRenderOrderId] = useState<string | null>(null);
  const [renderDone, setRenderDone] = useState(false);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [renderPhase, setRenderPhase] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string>("");

  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [audioUploading, setAudioUploading] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioBlobRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
    };
  }, []);

  useEffect(() => {
    fetch(withBackendPrefix("/api/profile"), { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { ok?: boolean; user?: { firstName?: string; lastName?: string; email?: string; phone?: string } }) => {
        if (data.ok && data.user) {
          setPrefillProfile({
            firstName: data.user.firstName ?? "",
            lastName: data.user.lastName ?? "",
            email: data.user.email ?? "",
            phone: data.user.phone ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      try {
        const res = await fetch(`/api/drafts/${encodeURIComponent(template.id)}`);
        if (res.status === 401) {
          if (!cancelled) setIsAuthenticated(false);
          return;
        }
        if (!cancelled) setIsAuthenticated(true);
        if (res.status === 404) return;
        if (!res.ok) return;
        const data = (await res.json()) as { values?: Record<string, string> };
        if (!data.values || cancelled) return;
        const next: Record<string, string> = {};
        Object.entries(data.values).forEach(([k, v]) => {
          if (typeof v === "string") next[k] = v;
        });
        if (!cancelled) {
          setValues((prev) => ({ ...prev, ...next }));
          setDraftMessage("Loaded saved draft");
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    }

    async function checkExistingOrder() {
      try {
        const res = await fetch(`/api/orders/check?templateId=${encodeURIComponent(template.id)}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          order: { razorpayOrderId: string; renderStatus: string | null; renderError: string | null } | null;
        };
        if (cancelled || !data.order) return;
        const { razorpayOrderId, renderStatus, renderError: orderError } = data.order;
        if (cancelled) return;
        setRenderOrderId(razorpayOrderId);
        if (renderStatus === "done") {
          setRenderDone(true);
          setRenderProgress(1);
        } else if (renderStatus === "error") {
          setRenderError(orderError ?? "Render failed.");
        } else if (renderStatus === "pending" || renderStatus === "processing") {
          fetch(`/api/orders/${encodeURIComponent(razorpayOrderId)}/start-render`, { method: "POST" })
            .then(async (sr) => {
              if (!sr.ok || cancelled) return;
              const sd = (await sr.json()) as { alreadyDone?: boolean };
              if (!cancelled && sd.alreadyDone) {
                setRenderDone(true);
                setRenderProgress(1);
              }
            })
            .catch(() => {});
        }
      } catch {
        // ignore — user simply hasn't paid
      }
    }

    void loadDraft();
    void checkExistingOrder();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  useEffect(() => {
    if (!renderOrderId || renderDone || renderError) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    async function poll() {
      if (!renderOrderId) return;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(renderOrderId)}/render-status`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          progress?: number;
          phase?: string;
          error?: string;
        };
        if (data.status === "done") {
          setRenderDone(true);
          setRenderProgress(1);
          setRenderPhase(null);
        } else if (data.status === "error") {
          setRenderError(data.error ?? "Render failed.");
          setRenderPhase(null);
        } else {
          setRenderProgress(data.progress ?? null);
          setRenderPhase(data.phase ?? null);
        }
      } catch {
        // ignore transient errors
      }
    }

    void poll();
    pollingRef.current = setInterval(() => void poll(), 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [renderOrderId, renderDone, renderError]);

  useEffect(() => {
    if (!draftMessage) return;
    const id = window.setTimeout(() => setDraftMessage(""), 1800);
    return () => window.clearTimeout(id);
  }, [draftMessage]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = window.setTimeout(() => {
      fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, values }),
      }).catch(() => {});
    }, 700);
    return () => window.clearTimeout(id);
  }, [isAuthenticated, values, template.id]);

  const onResetDefaults = () => {
    setValues(initial);
    setDraftMessage("Reset to default");
    if (isAuthenticated) {
      fetch(`/api/drafts/${encodeURIComponent(template.id)}`, { method: "DELETE" }).catch(() => {});
    }
  };

  const onSaveDraft = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, values }),
    })
      .then((res) => setDraftMessage(res.ok ? "Draft saved" : "Could not save draft"))
      .catch(() => setDraftMessage("Could not save draft"));
  };

  const handlePaymentVerified = useCallback(
    (payload: { paymentId: string; orderId: string }) => {
      setCheckoutOpen(false);
      setRenderOrderId(payload.orderId);
      setRenderDone(false);
      setRenderProgress(0);
      setRenderPhase(null);
      setRenderError("");

      fetch(`/api/orders/${encodeURIComponent(payload.orderId)}/start-render`, { method: "POST" })
        .then(async (res) => {
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { message?: string };
            setRenderError(err.message ?? "Could not start render.");
            return;
          }
          const data = (await res.json()) as { alreadyDone?: boolean };
          if (data.alreadyDone) {
            setRenderDone(true);
            setRenderProgress(1);
          }
        })
        .catch(() => setRenderError("Network error starting render."));
    },
    []
  );

  const onAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAuthenticated) { router.push("/login"); return; }

    // Instant preview via blob URL
    if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
    const blob = URL.createObjectURL(file);
    audioBlobRef.current = blob;
    setAudioBlobUrl(blob);
    setAudioFileName(file.name);

    setAudioUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: fd });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setDraftMessage(err.message ?? "Audio upload failed.");
        URL.revokeObjectURL(blob);
        audioBlobRef.current = null;
        setAudioBlobUrl(null);
        setAudioFileName("");
        return;
      }
      const data = (await res.json()) as { url: string };
      setCustomAudioUrl(data.url);
    } catch {
      setDraftMessage("Audio upload failed.");
      URL.revokeObjectURL(blob);
      audioBlobRef.current = null;
      setAudioBlobUrl(null);
      setAudioFileName("");
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const onShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: template.title, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      setDraftMessage("Link copied!");
    }
  };

  const progressPct = renderProgress != null ? Math.round(renderProgress * 100) : null;
  const activeFields = activeTab === "text" ? textFields : imageFields;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-6 pt-4">
      <TemplateCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        template={template}
        fieldValues={values}
        customAudioUrl={customAudioUrl}
        prefill={prefillProfile}
        onPaymentSuccess={handlePaymentVerified}
      />

      {/* Back + support bar */}
      <div className="mx-auto max-w-[1280px] px-4 mb-4 flex items-center justify-between">
        <Link
          href="/templates"
          className="font-body inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft />
          <span>Back to Templates</span>
        </Link>
        <InstagramSupportLink className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors" />
      </div>

      {/* Main two-column grid */}
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">

          {/* LEFT — preview */}
          <div className="flex justify-center lg:sticky lg:top-6 lg:self-start">
            <TemplateEditorPreview
              posterSrc={template.thumbnail}
              posterAlt={template.title}
              previewVideoUrl={template.previewVideoUrl}
              backgroundVideoUrl={template.backgroundVideoUrl}
              previewAudioUrl={audioBlobUrl ?? template.previewAudioUrl}
              previewFontUrls={template.previewFontUrls}
              fieldValues={values}
              formFields={template.formFields}
              videoTextOverlays={template.previewVideoTextOverlays}
              lottiePreviewUrl={template.lottiePreviewUrl}
            />
          </div>

          {/* RIGHT — control panel */}
          <div className="flex flex-col bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden border border-[var(--border-card)]">

            {/* Header: title + price + share */}
            <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-start justify-between gap-3">
              <h1 className="font-heading text-base font-semibold leading-snug text-[var(--foreground)] sm:text-lg flex-1 min-w-0">
                {template.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="font-body inline-flex items-center rounded-full px-3 py-1 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #ff7043, #ff4081)" }}
                >
                  ₹{template.price}
                </span>
                <button
                  type="button"
                  onClick={onShare}
                  aria-label="Share"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-card)] text-[var(--text-secondary)] transition hover:bg-gray-50 hover:text-[var(--foreground)]"
                >
                  <ShareIcon />
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="px-4 py-2.5 border-b border-[var(--border-light)]">
              <div className="flex gap-1 rounded-full bg-gray-100 p-1 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={`font-body flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                    activeTab === "text"
                      ? "text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                  style={
                    activeTab === "text"
                      ? { background: "linear-gradient(135deg, #ff7043, #ff4081)" }
                      : {}
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  Text
                </button>
                {hasImageFields && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("image")}
                    className={`font-body flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                      activeTab === "image"
                        ? "text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                    style={
                      activeTab === "image"
                        ? { background: "linear-gradient(135deg, #ff7043, #ff4081)" }
                        : {}
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Images
                  </button>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-[52vh] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
              {activeFields.length === 0 && (
                <p className="font-body py-8 text-center text-sm text-[var(--text-muted)]">
                  No {activeTab === "text" ? "text" : "image"} fields for this template.
                </p>
              )}
              {activeFields.map((field) => (
                <div key={field.name} className="rounded-xl border border-[var(--border-card)] bg-white px-3 py-2.5">
                  {isImageField(field) ? (
                    <>
                      <p className={fieldLabelClass}>{field.label}</p>
                      <div className="mt-1.5 rounded-lg border border-dashed border-gray-300 bg-[var(--bg-page)] p-3 text-center">
                        <input
                          id={`${fieldInputId(field.name)}-file`}
                          accept="image/*"
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Show blob URL immediately for instant preview
                            const blobUrl = URL.createObjectURL(file);
                            setValues((v) => ({ ...v, [field.name]: blobUrl }));
                            // Upload to server so render server can fetch it
                            try {
                              const fd = new FormData();
                              fd.append("image", file);
                              const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                              if (res.ok) {
                                const data = (await res.json()) as { url: string };
                                URL.revokeObjectURL(blobUrl);
                                setValues((v) => ({ ...v, [field.name]: data.url }));
                              }
                            } catch {
                              // keep blob URL for preview; render will fail if paid without re-uploading
                            }
                          }}
                        />
                        <label
                          htmlFor={`${fieldInputId(field.name)}-file`}
                          className="font-body inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-[var(--foreground)] ring-1 ring-gray-200 transition hover:bg-gray-50"
                        >
                          Choose Image
                        </label>
                        {values[field.name] ? (
                          <div className="mt-3">
                            <img
                              src={values[field.name]}
                              alt={field.label}
                              className="mx-auto h-20 w-auto max-w-full rounded-lg border border-gray-200 object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor={fieldInputId(field.name)} className={fieldLabelClass}>
                        {field.label}
                      </label>
                      <textarea
                        id={fieldInputId(field.name)}
                        rows={1}
                        autoComplete="off"
                        value={values[field.name] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                        className="font-body mt-1.5 min-w-0 w-full resize-none overflow-x-hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-[0.9375rem] leading-snug text-[var(--foreground)] transition-colors focus:outline-none focus:border-[var(--brand-primary)] focus:ring-0 hide-scrollbar"
                        style={{
                          minHeight: textareaMinHeight(field.label, values[field.name] ?? ""),
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Audio upload */}
            <div className="px-4 py-2.5 border-t border-[var(--border-light)]">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => void onAudioFileChange(e)}
              />
              {customAudioUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2">
                  <MusicIcon />
                  <span className="font-body flex-1 truncate text-sm font-medium text-pink-700" title={audioFileName}>
                    {audioFileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (audioBlobRef.current) { URL.revokeObjectURL(audioBlobRef.current); audioBlobRef.current = null; }
                      setCustomAudioUrl(null);
                      setAudioBlobUrl(null);
                      setAudioFileName("");
                    }}
                    aria-label="Remove audio"
                    className="shrink-0 rounded-full p-1 text-pink-400 transition hover:bg-pink-100 hover:text-pink-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={audioUploading}
                  onClick={() => audioInputRef.current?.click()}
                  className="font-body w-full inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-pink-50 py-2.5 text-sm font-medium text-pink-500 transition hover:bg-pink-100 hover:text-pink-600 disabled:opacity-60"
                >
                  <MusicIcon />
                  {audioUploading ? "Uploading…" : template.previewAudioUrl ? "Change Audio" : "Add Audio"}
                </button>
              )}
            </div>

            {/* Draft message */}
            {draftMessage ? (
              <div className="px-5">
                <p className="text-center text-xs font-medium text-[var(--text-secondary)]">{draftMessage}</p>
              </div>
            ) : null}

            {/* Render progress panel — only show once polling has returned data or render is complete/errored */}
            {renderOrderId && (renderDone || !!renderError || renderProgress !== null) ? (
              <div className="mx-5 mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4">
                {renderDone ? (
                  <>
                    <p className="font-body text-sm font-semibold text-emerald-900">Your video is ready!</p>
                    <p className="font-body mt-1 text-xs leading-relaxed text-emerald-900/80">
                      Download from this page or your profile orders.
                    </p>
                    <div className="mt-3">
                      <a
                        href={`/api/orders/${encodeURIComponent(renderOrderId)}/video`}
                        download
                        className="font-body inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
                      >
                        Download Video
                      </a>
                    </div>
                  </>
                ) : renderError ? (
                  <>
                    <p className="font-body text-sm font-semibold text-red-800">Render failed</p>
                    <p className="font-body mt-1 text-xs leading-relaxed text-red-800/80">{renderError}</p>
                    <p className="font-body mt-2 text-xs text-red-700/70">Order ID: {renderOrderId}</p>
                  </>
                ) : (
                  <>
                    <p className="font-body text-sm font-semibold text-emerald-900">
                      Preparing your video…{progressPct != null ? ` ${progressPct}%` : ""}
                    </p>
                    {renderPhase ? (
                      <p className="font-body mt-0.5 text-xs text-emerald-900/70 capitalize">{renderPhase}</p>
                    ) : null}
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/70"
                      role="progressbar"
                      aria-valuenow={progressPct ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                        style={{ width: `${progressPct ?? 0}%` }}
                      />
                    </div>
                    <p className="font-body mt-2 text-xs text-emerald-900/60">
                      This may take a minute. You can safely close this tab and come back.
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="px-4 py-3 border-t border-[var(--border-light)] flex gap-2">
              <button
                type="button"
                onClick={onResetDefaults}
                className="font-body flex-1 inline-flex items-center justify-center rounded-xl border-2 border-[var(--border-card)] bg-white py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-gray-300 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onSaveDraft}
                className="font-body flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--border-card)] bg-white py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-gray-300 hover:bg-gray-50"
              >
                <SaveIcon />
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="font-body flex-[2] inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #ff7043, #ff4081)" }}
              >
                <DownloadIcon />
                Download HD Video
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
