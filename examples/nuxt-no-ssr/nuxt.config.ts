import { withSSR } from "@expressthat-auth/ui-vue/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  ssr: false,
  vite: {
    plugins: [withSSR()],
  },
});
