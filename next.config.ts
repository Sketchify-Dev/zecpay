import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Zcash light-client addon is a native NAPI module; keep it external so
  // Next requires it at runtime instead of trying to bundle a .node binary.
  serverExternalPackages: ["@ledgerhq/zcash-utils"],
  turbopack: {
    // Silence the workspace-root inference warning (a stray lockfile exists in
    // the parent directory).
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
