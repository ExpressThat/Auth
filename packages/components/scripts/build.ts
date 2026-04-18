import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { build } from "esbuild";

rmSync("dist", { recursive: true, force: true });

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  sourcemap: true,
  alias: { "@": "./src" },
  external: ["react", "react-dom", "@base-ui/react", "@base-ui/react/*", "recharts"],
};

await Promise.all([
  build({
    ...shared,
    format: "esm",
    outfile: "dist/index.js",
  }),
  build({
    ...shared,
    format: "cjs",
    outfile: "dist/index.cjs",
  }),
]);

execSync("tsc --project tsconfig.build.json", { stdio: "inherit" });
