/**
 * Dev watch script for @expressthat-auth/api-client.
 *
 * Monitors all C# source files under packages/ (packages/api and its
 * sub-dependencies) for changes.  On any change it:
 *   1. Rebuilds packages/api   (dotnet build via pnpm gen:spec)
 *   2. Re-generates swagger.json from the built DLL
 *   3. Re-generates src/schema.gen.ts via openapi-typescript
 *
 * Run:  pnpm dev
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root of this package (packages/api-client)
const packageRoot = path.join(__dirname, "..");
// Root of the monorepo packages/ directory
const packagesRoot = path.join(packageRoot, "..");

let building = false;
let pendingRebuild = false;

function runBuild(): Promise<void> {
  return new Promise((resolve) => {
    console.log("[api-client] Running build (gen:spec + gen:types)...");

    const proc = spawn("pnpm", ["build"], {
      cwd: packageRoot,
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log("[api-client] Build complete – types updated.");
      } else {
        console.error(`[api-client] Build failed (exit code ${code}).`);
      }
      resolve();
    });
  });
}

async function triggerRebuild() {
  if (building) {
    pendingRebuild = true;
    return;
  }

  building = true;
  pendingRebuild = false;

  await runBuild();

  building = false;

  if (pendingRebuild) {
    pendingRebuild = false;
    await triggerRebuild();
  }
}

// Watch patterns: all C# source and project files under packages/
// (covers packages/api itself plus any workspace packages it depends on)
const watchPatterns = [
  path.join(packagesRoot, "**", "*.cs"),
  path.join(packagesRoot, "**", "*.csproj"),
];

const ignored = [
  /(^|[/\\])\../, // dotfiles
  /[/\\](bin|obj|node_modules)[/\\]/,
];

const watcher = chokidar.watch(watchPatterns, {
  ignored,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
});

watcher
  .on("change", (filePath) => {
    console.log(`[api-client] Changed: ${path.relative(packagesRoot, filePath)}`);
    void triggerRebuild();
  })
  .on("add", (filePath) => {
    console.log(`[api-client] Added:   ${path.relative(packagesRoot, filePath)}`);
    void triggerRebuild();
  })
  .on("unlink", (filePath) => {
    console.log(`[api-client] Removed: ${path.relative(packagesRoot, filePath)}`);
    void triggerRebuild();
  });

// Initial build on start
console.log("[api-client] Starting – performing initial build...");
triggerRebuild().then(() => {
  console.log("[api-client] Watching packages/ for C# changes...");
});
