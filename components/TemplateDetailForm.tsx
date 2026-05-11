"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Template } from "@/lib/templates";
import { isFormFieldEnabled } from "@/lib/templates";
import { EditorProgressStepper } from "./EditorProgressStepper";
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
  "font-body mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)] sm:text-xs";

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" fill="none" />
      <path d="M12 17h.01" fill="none" />
    </svg>
  );
}

export function TemplateDetailForm({ template }: Props) {
  const router = useRouter();
  const visibleFormFields = useMemo(
    () => template.formFields.filter((f) => isFormFieldEnabled(f)),
    [template.formFields]
  );

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
  // null = auth check in flight; true = authenticated; false = not logged in
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Render tracking state
  const [renderOrderId, setRenderOrderId] = useState<string | null>(null);
  const [renderDone, setRenderDone] = useState(false);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [renderPhase, setRenderPhase] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string>("");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: load draft + check for existing paid order
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
          // Render server may have lost the job (restart) — re-submit idempotently
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

  // Poll render status while in-progress
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

  // Auto-save draft
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

  const onResetDefaults = () => {
    setValues(initial);
    setDraftMessage("Reset to default");
    if (isAuthenticated) {
      fetch(`/api/drafts/${encodeURIComponent(template.id)}`, { method: "DELETE" }).catch(() => {});
    }
  };

  const handlePaymentVerified = useCallback(
    (payload: { paymentId: string; orderId: string }) => {
      setCheckoutOpen(false);
      setRenderOrderId(payload.orderId);
      setRenderProgress(0);
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

  const steps = [
    { label: "Choose Template", shortLabel: "Choose", state: "done" as const },
    { label: "Enter Details", shortLabel: "Details", state: "done" as const },
    { label: "Download", shortLabel: "Download", state: renderDone ? ("done" as const) : ("upcoming" as const) },
  ];

  const title = `${template.id} | ${template.title}`;

  const progressPct = renderProgress != null ? Math.round(renderProgress * 100) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-28 pt-2 sm:pb-32 sm:pt-4">
      <TemplateCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        template={template}
        fieldValues={values}
        onPaymentSuccess={handlePaymentVerified}
      />
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 md:px-6">
        <section className="overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--card)] shadow-[0_24px_80px_-16px_rgba(15,23,42,0.12)] sm:rounded-3xl">
          {/* Progress + nav */}
          <div className="border-b border-gray-200/80 bg-gradient-to-b from-gray-50/95 to-gray-50/50 px-3 py-4 sm:px-5 sm:py-5">
            <div className="mx-auto grid w-full max-w-[960px] grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-3 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] sm:grid-rows-1 sm:gap-4">
              <Link
                href="/templates"
                className="group col-start-1 row-start-1 inline-flex shrink-0 touch-manipulation items-center gap-1.5 justify-self-start rounded-full border border-gray-200/90 bg-white px-2.5 py-2 text-xs font-medium text-[var(--foreground)] shadow-sm transition-all hover:border-[var(--brand-end)]/35 hover:shadow sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform group-hover:-translate-x-0.5 sm:h-4 sm:w-4" />
                <span className="font-body hidden min-[380px]:inline">Back</span>
              </Link>

              <div className="col-start-2 row-start-1 flex shrink-0 justify-self-end sm:col-start-3 sm:justify-self-end">
                <InstagramSupportLink className="rounded-full border border-gray-200/90 bg-white px-2.5 py-1.5 text-[11px] shadow-sm sm:px-3 sm:py-2 sm:text-xs" />
              </div>

              <div className="col-span-2 row-start-2 flex min-w-0 justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:px-1">
                <EditorProgressStepper steps={steps} compact className="w-full max-w-lg sm:max-w-md" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="border-b border-gray-100/90 px-4 py-4 sm:px-8 sm:py-5">
            <h1 className="text-center font-heading text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl md:text-2xl">
              {title}
            </h1>
          </div>

          {/* Two columns */}
          <div className="grid gap-8 p-4 sm:gap-10 sm:p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12">
            {/* Preview column */}
            <div className="flex flex-col items-center lg:sticky lg:top-24 lg:self-start">
              <TemplateEditorPreview
                posterSrc={template.thumbnail}
                posterAlt={title}
                previewVideoUrl={template.previewVideoUrl}
                backgroundVideoUrl={template.backgroundVideoUrl}
                previewAudioUrl={template.previewAudioUrl}
                previewFontUrls={template.previewFontUrls}
                fieldValues={values}
                formFields={template.formFields}
                videoTextOverlays={template.previewVideoTextOverlays}
                lottiePreviewUrl={template.lottiePreviewUrl}
              />
              <div className="mt-4 w-full max-w-md lg:hidden">
                <div className="flex gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/90 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff9966] to-[#ff7043] shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-body text-sm leading-relaxed text-gray-800 sm:text-[0.9375rem]">
                    Mobile preview may lag slightly; your final HD export will be smooth. For the best live preview, use
                    a desktop.
                  </p>
                </div>
              </div>
            </div>

            {/* Form column */}
            <div className="flex min-w-0 flex-col">
              <div className="max-h-[min(68vh,560px)] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:max-h-[min(72vh,620px)] lg:max-h-[min(78vh,680px)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80">
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/90 to-gray-50/40 p-4 shadow-inner sm:p-5 md:p-6">
                  <div className="space-y-4 sm:space-y-5">
                    {visibleFormFields.map((field) => (
                      <div key={field.name}>
                        {isImageField(field) ? (
                          <p className={fieldLabelClass}>{field.label}</p>
                        ) : (
                          <label htmlFor={fieldInputId(field.name)} className={fieldLabelClass}>
                            {field.label}
                          </label>
                        )}
                        {isImageField(field) ? (
                          <div className="mt-1.5 rounded-xl border border-dashed border-gray-300/80 bg-white p-4 text-center shadow-sm">
                            <input
                              id={`${fieldInputId(field.name)}-file`}
                              accept="image/*"
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const url = URL.createObjectURL(file);
                                setValues((v) => ({ ...v, [field.name]: url }));
                              }}
                            />
                            <label
                              htmlFor={`${fieldInputId(field.name)}-file`}
                              className="font-body inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--muted)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] ring-1 ring-gray-200/80 transition hover:bg-gray-200/80"
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
                        ) : (
                          <textarea
                            id={fieldInputId(field.name)}
                            rows={1}
                            autoComplete="off"
                            value={values[field.name] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                            className="font-body mt-1.5 min-w-0 w-full resize-none overflow-x-hidden rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-[0.9375rem] leading-snug text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)]/35 sm:px-4 sm:py-3 sm:text-base hide-scrollbar"
                            style={{
                              minHeight: textareaMinHeight(field.label, values[field.name] ?? ""),
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 border-t border-gray-100 bg-white/60 pt-5 sm:mt-8 sm:rounded-b-2xl sm:pt-6">
                <div className="font-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href="#template-editor-preview"
                    className="text-center text-sm font-medium text-[var(--brand-end)] underline decoration-2 underline-offset-4 transition hover:text-[var(--brand-start)] lg:hidden"
                  >
                    Preview your video
                  </a>
                  <div className="flex w-full flex-col gap-3 sm:ml-auto sm:max-w-xl sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="font-body order-3 w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-gray-300 hover:bg-gray-50/80 sm:order-1 sm:w-auto sm:min-w-[160px]"
                      onClick={onResetDefaults}
                    >
                      Reset to Default
                    </button>
                    <button
                      type="button"
                      className="font-body order-2 w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--brand-end)]/50 hover:bg-gray-50/80 sm:order-2 sm:w-auto sm:min-w-[140px]"
                      onClick={onSaveDraft}
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      className="font-body order-1 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg sm:order-3 sm:w-auto sm:min-w-[180px]"
                      style={{
                        background: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
                      }}
                      onClick={() => setCheckoutOpen(true)}
                    >
                      {renderOrderId ? "Download HD Video" : "Download HD Video"}
                    </button>
                  </div>
                </div>
                {draftMessage ? (
                  <p className="mt-3 text-right text-xs font-medium text-[var(--text-secondary)]">{draftMessage}</p>
                ) : null}

                {/* Post-payment render panel */}
                {renderOrderId ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/95 to-white p-4 shadow-sm sm:p-5">
                    {renderDone ? (
                      <>
                        <p className="font-body text-sm font-semibold text-emerald-900">Your video is ready!</p>
                        <p className="font-body mt-1 text-xs leading-relaxed text-emerald-900/80">
                          You can download your video anytime from this page or from your profile orders.
                        </p>
                        <div className="mt-4">
                          <a
                            href={`/api/orders/${encodeURIComponent(renderOrderId)}/video`}
                            download
                            className="font-body inline-flex items-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
                          >
                            Download Video
                          </a>
                        </div>
                      </>
                    ) : renderError ? (
                      <>
                        <p className="font-body text-sm font-semibold text-red-800">Render failed</p>
                        <p className="font-body mt-1 text-xs leading-relaxed text-red-800/80">{renderError}</p>
                        <p className="font-body mt-2 text-xs text-red-700/70">
                          Please contact support with your order ID: {renderOrderId}
                        </p>
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
                          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200/70"
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
                          This may take a minute. You can safely close this tab and come back later.
                        </p>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
