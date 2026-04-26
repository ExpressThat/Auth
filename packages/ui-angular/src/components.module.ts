import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";

import { DIRECTIVES } from "./generated/index.directives";

/**
 * NgModule that imports and re-exports all Stencil-generated standalone Angular
 * component proxies. Import this in either:
 *
 * - **NgModule-based apps** (module-first): add to your `NgModule.imports` array.
 * - **Standalone component apps** (Angular 14+): add to the `imports` array of
 *   any standalone `@Component` that uses the web components.
 */
@NgModule({
  imports: [...DIRECTIVES],
  exports: [...DIRECTIVES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UiAngularModule {}
