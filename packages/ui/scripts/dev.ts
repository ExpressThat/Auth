import { execSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, watch } from "node:fs";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dirname, "..");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let building = false;
let rebuildQueued = false;

function runBuild() {
  if (building) {
    rebuildQueued = true;
    return;
  }
  building = true;
  rebuildQueued = false;
  console.log("\n[ui] Building...");
  try {
    execSync("mitosis build", {
      stdio: "inherit",
      cwd: packageRoot,
    });
    console.log("[ui] Build complete ✓");
  } catch {
    console.error("[ui] Build failed ✗");
  }
  building = false;
  if (rebuildQueued) {
    runBuild();
  }
}

function scheduleRebuild(label: string, filename: string | null) {
  console.log(`[ui] Changed: ${label}${filename ? `/${filename}` : ""}`);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runBuild, 300);
}

function watchDir(dir: string, label: string) {
  if (!existsSync(dir)) return;
  watch(dir, { recursive: true }, (_, filename) => scheduleRebuild(label, filename));
  console.log(`[ui] Watching ${label} (${dir})`);
}

// Resolve workspace:* deps and watch their src/
const pkg = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf-8"));
const allDeps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

for (const [name, version] of Object.entries(allDeps)) {
  if (!version.startsWith("workspace:")) continue;
  const symlinkPath = resolve(packageRoot, "node_modules", name);
  if (!existsSync(symlinkPath)) continue;
  const depRoot = realpathSync(symlinkPath);
  watchDir(resolve(depRoot, "src"), name);
}

// Watch own src/
watchDir(resolve(packageRoot, "src"), "src");

// Initial build
runBuild();
