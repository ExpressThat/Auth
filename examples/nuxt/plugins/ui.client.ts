// Registers Stencil web components via the lazy loader on the client side.
// The .client suffix ensures this only runs in the browser (not during SSR).
import { UiPlugin } from "@expressthat-auth/ui-vue";

export default defineNuxtPlugin((app) => {
  app.vueApp.use(UiPlugin);
});
