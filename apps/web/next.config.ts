import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(process.cwd(), "../.."),
    resolveAlias: {
      "@expressthat-auth/components": "../../packages/components/src",
      "@": "../../packages/components/src",
    },
  },
};

export default nextConfig;
