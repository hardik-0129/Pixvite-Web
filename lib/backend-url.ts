export function withBackendPrefix(url: string) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_PREFIX || "").trim().replace(/\/+$/, "");
  if (!base) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}
