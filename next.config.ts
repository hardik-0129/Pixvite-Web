import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** This app’s root (folder containing this file). Stops Next from using a parent `package-lock.json` as the workspace root. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Allow `next/image` for absolute asset URLs from the admin/API origin (see `lib/template-store.ts` `withBackendPrefix`). */
function remotePatternsFromBackendPrefix(): RemotePattern[] {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_PREFIX || process.env.BACKEND_PREFIX || "").trim();
  if (!raw) return [];
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    const entry: RemotePattern = {
      protocol: u.protocol === "https:" ? "https" : "http",
      hostname: u.hostname,
      pathname: "/**",
    };
    if (u.port) entry.port = u.port;
    return [entry];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/**",
      },
      ...remotePatternsFromBackendPrefix(),
    ],
  },
};

export default nextConfig;
