import { defineCustomElements } from "@expressthat-auth/ui/loader";
import type { Plugin } from "vue";

export const UiPlugin: Plugin = {
  install() {
    defineCustomElements();
  },
};
