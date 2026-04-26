import { angularOutputTarget } from "@stencil/angular-output-target";
import type { Config } from "@stencil/core";
import { reactOutputTarget } from "@stencil/react-output-target";
import { vueOutputTarget } from "@stencil/vue-output-target";

export const config: Config = {
  namespace: "expressthat-auth-ui",
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
      type: "docs-readme",
    },
    reactOutputTarget({
      // outDir is the only required option in v1.x
      outDir: "../ui-react/src/generated",
    }),
    vueOutputTarget({
      componentCorePackage: "@expressthat-auth/ui",
      proxiesFile: "../ui-vue/src/generated/index.ts",
      includeImportCustomElements: true,
    }),
    angularOutputTarget({
      componentCorePackage: "@expressthat-auth/ui",
      directivesProxyFile: "../ui-angular/src/generated/index.ts",
      directivesArrayFile: "../ui-angular/src/generated/index.directives.ts",
    }),
  ],
};
