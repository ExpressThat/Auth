import { angularOutputTarget } from "@stencil/angular-output-target";
import type { Config } from "@stencil/core";
import { transform } from "esbuild";
import { reactOutputTarget } from "@stencil/react-output-target";
import { vueOutputTarget } from "@stencil/vue-output-target";
import type { Plugin } from "rollup";

// Rollup plugin to transpile TypeScript files from workspace packages
// (e.g. @expressthat-auth/api-client uses JIT source exports pointing to .ts files)
const externalTsPlugin: Plugin = {
  name: "external-ts",
  async transform(code, id) {
    if (id.endsWith(".ts") && !id.includes("/ui/src/")) {
      const result = await transform(code, { loader: "ts", sourcemap: false });
      return { code: result.code };
    }
    return null;
  },
};

export const config: Config = {
  namespace: "expressthat-auth-ui",
  minifyJs: false,
  rollupPlugins: {
    before: [externalTsPlugin],
  },
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "dist-custom-elements",
      customElementsExportBehavior: "auto-define-custom-elements",
      externalRuntime: false,
    },
    {
      type: "dist-hydrate-script",
      dir: "./hydrate",
    },
    {
      type: "docs-readme",
    },
    reactOutputTarget({
      outDir: "../ui-react/src/generated",
      hydrateModule: "@expressthat-auth/ui/hydrate",
      clientModule: "@expressthat-auth/ui-react",
    }),
    vueOutputTarget({
      componentCorePackage: "@expressthat-auth/ui",
      proxiesFile: "../ui-vue/src/generated/index.ts",
      hydrateModule: "@expressthat-auth/ui/hydrate",
      includeImportCustomElements: true,
      includePolyfills: false,
      includeDefineCustomElements: false,
    }),
    angularOutputTarget({
      componentCorePackage: "@expressthat-auth/ui",
      directivesProxyFile: "../ui-angular/src/generated/index.ts",
      directivesArrayFile: "../ui-angular/src/generated/index.directives.ts",
      outputType: "standalone",
    }),
  ],
};
