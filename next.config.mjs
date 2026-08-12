import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root; otherwise Turbopack walks up and finds a stray
  // package-lock.json in the home directory.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  async headers() {
    return [
      {
        // A clip's filename is derived from its codepoints, so a given file
        // never changes content — safe to cache forever.
        source: "/audio/:bucket(name|sound|syl|word)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // The manifest is rewritten on every `npm run audio`. Caching it
        // immutably strands the client on a stale (possibly empty) clip list,
        // silently sending every tap to the speechSynthesis fallback.
        source: "/audio/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
