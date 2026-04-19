import { rmSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build } from "vite";

rmSync("dist", { recursive: true, force: true });

const _watcher = await build({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "../src") },
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "../src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize all node_modules — consumers install their own deps.
      // Do NOT externalize the local @/ alias (resolved to ./src/* by the alias plugin).
      external: (id) =>
        !id.startsWith(".") && !id.startsWith("@/") && !id.startsWith("\0") && !isAbsolute(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        dir: "dist",
        entryFileNames: "[name].js",
      },
    },
    sourcemap: true,
    watch: {},
  },
});

console.log("[components] initial build complete, watching for changes...");
