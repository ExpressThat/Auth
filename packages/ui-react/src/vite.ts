// Vite plugin for SSR with Stencil components in Remix or other Vite-based frameworks.
// Add to your vite.config.ts plugins array:
//   import { withSSR } from "@expressthat-auth/ui-react/vite";
//   plugins: [withSSR()]
import { stencilSSR } from "@stencil/ssr";

export const withSSR = () =>
  stencilSSR({
    from: "@expressthat-auth/ui-react",
    module: import("./index.js"),
    hydrateModule: import("@expressthat-auth/ui/hydrate"),
  });
