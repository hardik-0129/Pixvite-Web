export function withBackendPrefix(url: string) {
  // Pixvite-Web `app/api/*` must stay on the storefront origin. Prefixing with the admin
  // origin (e.g. localhost:3001) causes CORS preflight + 404 because those routes only exist here.
  if (url.startsWith("/api/")) return url;
  const base = (process.env.NEXT_PUBLIC_BACKEND_PREFIX || "").trim().replace(/\/+$/, "");
  if (!base) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}
