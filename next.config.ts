import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Directory containing this config (the Next app root). */
const appRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Turbopack was picking ~/package-lock.json as the workspace root, so env and
 * resolution could drift; API calls then hit localhost:3000 (Next) instead of the Nest port.
 */
function publicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw && !/^https?:\/\/(127\.0\.0\.1|localhost):3000(\/|$)/i.test(raw)) {
    return raw;
  }
  if (raw && /^https?:\/\/(127\.0\.0\.1|localhost):3000/i.test(raw)) {
    return raw.replace(/:3000\b/i, ":3001");
  }
  return "http://localhost:3001/v1";
}

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl(),
  },
  /** Lower peak RAM during `next build` on laptops (swap thrash = “hang”). */
  webpack: (config, { dev }) => {
    if (!dev) {
      const cap = process.env.LOW_MEM_BUILD === "1" ? 1 : 4;
      config.parallelism = cap;
    }
    return config;
  },
};

export default nextConfig;
