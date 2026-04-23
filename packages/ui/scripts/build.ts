/* biome-ignore-all lint/correctness/useQwikValidLexicalScope: Node build script, not Qwik runtime code. */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import preact from "@preact/preset-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { build, type ESBuildOptions, type PluginOption } from "vite";
import solid from "vite-plugin-solid";

type BuildTarget = {
  name: string;
  sourceDir: string;
  extensions: Set<string>;
  plugins?: PluginOption[];
  esbuild?: ESBuildOptions;
};

const packageRoot = resolve(import.meta.dirname, "..");
const distRoot = resolve(packageRoot, "dist");

const collectEntries = (rootDir: string, allowedExtensions: Set<string>) => {
  const entries: Record<string, string> = {};
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    for (const item of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = join(current, item.name);

      if (item.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!item.isFile()) {
        continue;
      }

      const extension = extname(item.name);

      if (!allowedExtensions.has(extension)) {
        continue;
      }

      const relativePath = relative(rootDir, absolutePath).replace(/\\/g, "/");
      const entryName = relativePath.replace(/\.[^/.]+$/, "");
      entries[entryName] = absolutePath;
    }
  }

  return entries;
};

const targets: BuildTarget[] = [
  {
    name: "react",
    sourceDir: resolve(packageRoot, "output/react/src"),
    extensions: new Set([".ts", ".tsx", ".js", ".jsx"]),
    plugins: [react()],
  },
  {
    name: "vue",
    sourceDir: resolve(packageRoot, "output/vue/src"),
    extensions: new Set([".vue", ".ts", ".tsx", ".js", ".jsx"]),
    plugins: [vue()],
  },
  {
    name: "svelte",
    sourceDir: resolve(packageRoot, "output/svelte/src"),
    extensions: new Set([".svelte", ".ts", ".js"]),
    plugins: [svelte()],
  },
  {
    name: "angular",
    sourceDir: resolve(packageRoot, "output/angular/src"),
    extensions: new Set([".ts", ".js"]),
  },
  {
    name: "solid",
    sourceDir: resolve(packageRoot, "output/solid/src"),
    extensions: new Set([".ts", ".tsx", ".js", ".jsx"]),
    plugins: [solid()],
  },
  {
    name: "preact",
    sourceDir: resolve(packageRoot, "output/preact/src"),
    extensions: new Set([".ts", ".tsx", ".js", ".jsx"]),
    plugins: [preact()],
  },
  {
    name: "qwik",
    sourceDir: resolve(packageRoot, "output/qwik/src"),
    extensions: new Set([".ts", ".tsx", ".js", ".jsx"]),
    esbuild: {
      jsx: "transform",
      jsxFactory: "h",
      jsxFragment: "Fragment",
    },
  },
];

rmSync(distRoot, { recursive: true, force: true });

for (const target of targets) {
  if (!existsSync(target.sourceDir)) {
    throw new Error(`Missing generated source directory for ${target.name}: ${target.sourceDir}`);
  }

  const entries = collectEntries(target.sourceDir, target.extensions);

  if (Object.keys(entries).length === 0) {
    throw new Error(`No build entries found for ${target.name} in ${target.sourceDir}`);
  }

  await build({
    plugins: target.plugins,
    build: {
      lib: {
        entry: entries,
        formats: ["es"],
      },
      rollupOptions: {
        // Externalize node_modules dependencies; preserve local module resolution.
        external: (id) => !id.startsWith(".") && !id.startsWith("\0") && !isAbsolute(id),
        output: {
          preserveModules: true,
          preserveModulesRoot: target.sourceDir,
          dir: resolve(distRoot, target.name),
          entryFileNames: "[name].js",
        },
      },
      sourcemap: true,
      ...(target.esbuild ? { target: "esnext" } : {}),
    },
    ...(target.esbuild ? { esbuild: target.esbuild } : {}),
  });
}

execSync("tsc --project tsconfig.build.json", { stdio: "inherit" });
