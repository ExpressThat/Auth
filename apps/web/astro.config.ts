import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import react from "@astrojs/react";
import toolbarRoutes from "@shiftescape/astro-toolbar-routes";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  integrations: [react(), toolbarRoutes()],

  vite: {
    plugins: [
      tailwindcss(),
      visualizer({
        emitFile: true,
        filename: "stats.html",
      }),
    ],
    resolve: {
      alias: [
        {
          // @expressthat-auth/components/foo → src/components/ui/foo
          find: /^@expressthat-auth\/components\/(.+)$/,
          replacement: resolve(__dirname, "../../packages/components/src/components/ui/$1"),
        },
        {
          // @expressthat-auth/components (barrel) → src/index
          find: "@expressthat-auth/components",
          replacement: resolve(__dirname, "../../packages/components/src"),
        },
        {
          // @/ used inside component source files
          find: "@",
          replacement: resolve(__dirname, "../../packages/components/src"),
        },
      ],
    },
    server: {
      watch: {
        // Vite ignores node_modules by default; un-ignore our workspace packages
        // so HMR fires when source files in packages/* change.
        ignored: ["!**/node_modules/@expressthat-auth/**"],
      },
    },
    build: {
      sourcemap: true,
    },
  },

  adapter: node({
    mode: "standalone",
  }),
});
