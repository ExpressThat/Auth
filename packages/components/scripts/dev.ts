import { rmSync } from "node:fs";
import { context } from "esbuild";

rmSync("dist", { recursive: true, force: true });

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  sourcemap: true,
  alias: { "@": "./src" },
  external: ["react", "react-dom", "@base-ui/react", "@base-ui/react/*"],
};

const [esm, cjs] = await Promise.all([
  context({
    ...shared,
    format: "esm",
    outfile: "dist/index.js",
  }),
  context({
    ...shared,
    format: "cjs",
    outfile: "dist/index.cjs",
  }),
]);

// Initial build before entering watch mode
await Promise.all([esm.rebuild(), cjs.rebuild()]);
console.log("[components] initial build complete");

await Promise.all([esm.watch(), cjs.watch()]);
console.log("[components] watching for changes...");
