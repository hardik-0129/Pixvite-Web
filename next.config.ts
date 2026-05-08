import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** This app’s root (folder containing this file). Stops Next from using a parent `package-lock.json` as the workspace root. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
    ],
  },
};

export default nextConfig;
