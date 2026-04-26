import { angularOutputTarget } from "@stencil/angular-output-target";
import type { Config } from "@stencil/core";
import { reactOutputTarget } from "@stencil/react-output-target";
import { vueOutputTarget } from "@stencil/vue-output-target";

export const config: Config = {
  namespace: "expressthat-auth-ui",
  minifyJs: false,
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
