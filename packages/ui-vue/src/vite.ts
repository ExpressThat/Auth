// Vite plugin for SSR with Stencil components in Nuxt or other Vite-based frameworks.
// Add to your vite.config.ts / nuxt.config.ts plugins array:
//   import { withSSR } from "@expressthat-auth/ui-vue/vite";
//   plugins: [withSSR()]
import { stencilSSR } from "@stencil/ssr";

export const withSSR = () =>
  stencilSSR({
    from: "@expressthat-auth/ui-vue",
    module: import("./index.js"),
    hydrateModule: import("@expressthat-auth/ui/hydrate"),
  });
