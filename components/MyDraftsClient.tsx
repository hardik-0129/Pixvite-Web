"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { withBackendPrefix } from "@/lib/backend-url";

type DraftRow = {
  templateId: string;
  savedAt: string;
  title: string;
  thumbnail: string;
};

function formatDraftDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M15.8334 5.83398C15.6124 5.83398 15.4004 5.92178 15.2441 6.07806C15.0878 6.23434 15 6.4463 15 6.66732V15.9932C14.9761 16.4146 14.7867 16.8094 14.473 17.0918C14.1592 17.3742 13.7466 17.5211 13.325 17.5007H6.67504C6.25345 17.5211 5.84086 17.3742 5.52713 17.0918C5.2134 16.8094 5.02395 16.4146 5.00004 15.9932V6.66732C5.00004 6.4463 4.91224 6.23434 4.75596 6.07806C4.59968 5.92178 4.38772 5.83398 4.16671 5.83398C3.94569 5.83398 3.73373 5.92178 3.57745 6.07806C3.42117 6.23434 3.33337 6.4463 3.33337 6.66732V15.9932C3.35716 16.8567 3.72219 17.6756 4.34852 18.2705C4.97486 18.8655 5.81143 19.1879 6.67504 19.1673H13.325C14.1886 19.1879 15.0252 18.8655 15.6516 18.2705C16.2779 17.6756 16.6429 16.8567 16.6667 15.9932V6.66732C16.6667 6.4463 16.5789 6.23434 16.4226 6.07806C16.2664 5.92178 16.0544 5.83398 15.8334 5.83398Z"
        fill="#EF4444"
        stroke="#EF4444"
        strokeWidth="0.08"
      />
      <path
        d="M16.6667 3.33398H13.3333V1.66732C13.3333 1.4463 13.2455 1.23434 13.0893 1.07806C12.933 0.921782 12.721 0.833984 12.5 0.833984H7.5C7.27899 0.833984 7.06702 0.921782 6.91074 1.07806C6.75446 1.23434 6.66667 1.4463 6.66667 1.66732V3.33398H3.33333C3.11232 3.33398 2.90036 3.42178 2.74408 3.57806C2.5878 3.73434 2.5 3.9463 2.5 4.16732C2.5 4.38833 2.5878 4.60029 2.74408 4.75657C2.90036 4.91285 3.11232 5.00065 3.33333 5.00065H16.6667C16.8877 5.00065 17.0996 4.91285 17.2559 4.75657C17.4122 4.60029 17.5 4.38833 17.5 4.16732C17.5 3.9463 17.4122 3.73434 17.2559 3.57806C17.0996 3.42178 16.8877 3.33398 16.6667 3.33398ZM8.33333 3.33398V2.50065H11.6667V3.33398H8.33333Z"
        fill="#EF4444"
      />
      <path
        d="M9.16667 14.1667V8.33333C9.16667 8.11232 9.07887 7.90036 8.92259 7.74408C8.76631 7.5878 8.55435 7.5 8.33333 7.5C8.11232 7.5 7.90036 7.5878 7.74408 7.74408C7.5878 7.90036 7.5 8.11232 7.5 8.33333V14.1667C7.5 14.3877 7.5878 14.5996 7.74408 14.7559C7.90036 14.9122 8.11232 15 8.33333 15C8.55435 15 8.76631 14.9122 8.92259 14.7559C9.07887 14.5996 9.16667 14.3877 9.16667 14.1667Z"
        fill="#EF4444"
      />
      <path
        d="M12.5 14.1667V8.33333C12.5 8.11232 12.4122 7.90036 12.256 7.74408C12.0997 7.5878 11.8877 7.5 11.6667 7.5C11.4457 7.5 11.2337 7.5878 11.0775 7.74408C10.9212 7.90036 10.8334 8.11232 10.8334 8.33333V14.1667C10.8334 14.3877 10.9212 14.5996 11.0775 14.7559C11.2337 14.9122 11.4457 15 11.6667 15C11.8877 15 12.0997 14.9122 12.256 14.7559C12.4122 14.5996 12.5 14.3877 12.5 14.1667Z"
        fill="#EF4444"
      />
    </svg>
  );
}

function resolveThumb(url: string) {
  if (!url) return "";
  return withBackendPrefix(url);
}

async function fetchTemplateInfo(templateId: string): Promise<{ title: string; thumbnail: string }> {
  try {
    const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { title: string; thumbnail: string };
      return { title: data.title, thumbnail: resolveThumb(data.thumbnail || "") };
    }
  } catch {
    // ignore
  }
  return { title: `Template (${templateId})`, thumbnail: "" };
}

const ITEMS_PER_PAGE = 5;

export function MyDraftsClient() {
  const router = useRouter();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/drafts");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as { drafts: { templateId: string; savedAt: string }[] };
      const nextRows: DraftRow[] = [];
      for (const { templateId, savedAt } of data.drafts) {
        const info = await fetchTemplateInfo(templateId);
        nextRows.push({ templateId, savedAt, ...info });
      }
      setRows(nextRows);
    } catch {
      router.replace("/login");
    }
    setBusy(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function removeDraft(templateId: string) {
    fetch(`/api/drafts/${encodeURIComponent(templateId)}`, { method: "DELETE" })
      .then(() => {
        setRows((prev) => {
          const next = prev.filter((r) => r.templateId !== templateId);
          const maxPage = Math.max(1, Math.ceil(next.length / ITEMS_PER_PAGE));
          setPage((p) => Math.min(p, maxPage));
          return next;
        });
      })
      .catch(() => {});
  }

  if (busy) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] font-body">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="mb-6 text-[32px] font-bold text-[#111827] md:text-[56px]">My Drafts</h1>
          <p className="text-sm text-gray-500">Loading drafts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-body">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-[32px] font-bold text-[#111827] md:text-[56px]">My Drafts</h1>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-md">
            <p className="text-gray-600">You don&apos;t have any saved drafts yet.</p>
            <Link href="/templates" className="mt-4 inline-block font-semibold text-rose-700 hover:underline">
              Browse templates →
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md md:block">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Template</p>
                <p className="text-xs font-semibold uppercase text-gray-500">Saved On</p>
                <p className="text-right text-xs font-semibold uppercase text-gray-500">Action</p>
              </div>

              {paginatedRows.map((row) => (
                <div
                  key={row.templateId}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-4 border-t border-gray-100 px-6 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      {row.thumbnail ? (
                        <img
                          src={row.thumbnail}
                          alt=""
                          width={56}
                          height={56}
                          decoding="async"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{row.title}</p>
                      <Link href={`/templates/${row.templateId}`} className="mt-1 text-sm font-semibold text-rose-700 hover:underline">
                        Continue Editing →
                      </Link>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{formatDraftDate(row.savedAt)}</p>
                  <button
                    type="button"
                    className="flex items-center justify-end gap-1 text-sm font-medium text-red-500 hover:text-red-600"
                    onClick={() => removeDraft(row.templateId)}
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4 md:hidden">
              {paginatedRows.map((row) => (
                <div key={row.templateId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md">
                  <div className="mb-3 min-h-40 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {row.thumbnail ? (
                      <img
                        src={row.thumbnail}
                        alt=""
                        width={400}
                        height={160}
                        decoding="async"
                        loading={rows[0]?.templateId === row.templateId ? "eager" : "lazy"}
                        fetchPriority={rows[0]?.templateId === row.templateId ? "high" : undefined}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full bg-gray-100" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {row.templateId} | {row.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Saved on {formatDraftDate(row.savedAt)}</p>
                  <div className="mt-3 flex min-h-11 items-center justify-between">
                    <Link href={`/templates/${row.templateId}`} className="text-sm font-semibold text-rose-700 hover:underline">
                      Continue Editing →
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete draft"
                      className="flex min-h-11 min-w-11 items-center justify-center text-red-500 hover:text-red-600"
                      onClick={() => removeDraft(row.templateId)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
                        p === page
                          ? "bg-gradient-to-r from-[#FF8FA3] to-[#FF5B5B] text-white shadow-sm"
                          : "border border-rose-100 bg-white text-slate-600 hover:bg-rose-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-6 max-w-sm min-h-35">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[#111827]">Draft Actions</p>
            <p className="text-base leading-relaxed text-gray-500">
              You can save drafts while editing and come back later to continue from where you left off. Only text changes are
              stored in drafts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
