import { UiPlugin } from "@expressthat-auth/ui-vue";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).use(UiPlugin).mount("#app");
