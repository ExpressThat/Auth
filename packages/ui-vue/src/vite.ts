// Vite plugin for Stencil Vue components in Nuxt applications.
//
// Provides a browser-compatible polyfill for Node.js `stream` module,
// which is used by the Stencil hydrate module for SSR.
//
// Usage in nuxt.config.ts:
//   import { withSSR } from "@expressthat-auth/ui-vue/vite";
//   vite: { plugins: [withSSR()] }
import type { Plugin } from "vite";

export const withSSR = (): Plugin => ({
  name: "expressthat-auth:ui-vue-ssr",
  config() {
    return {
      resolve: {
        alias: {
          stream: "stream-browserify",
        },
      },
    };
  },
});
