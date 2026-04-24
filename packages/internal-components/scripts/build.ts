import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build } from "vite";

rmSync("dist", { recursive: true, force: true });

await build({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "../src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize all node_modules — consumers install their own deps.
      // Self-referencing imports (@expressthat-auth/internal-components/*) are NOT externalized
      // so Rollup resolves them to relative imports in the dist output.
      external: (id) =>
        !id.startsWith(".") &&
        !id.startsWith("@expressthat-auth/internal-components") &&
        !id.startsWith("\0") &&
        !isAbsolute(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        dir: "dist",
        entryFileNames: "[name].js",
      },
    },
    sourcemap: true,
  },
});

execSync("tsgo --project tsconfig.build.json", { stdio: "inherit" });
