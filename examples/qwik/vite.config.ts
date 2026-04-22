import { qwikVite } from "@builder.io/qwik/optimizer";
import { defineConfig } from "vite";

const isPreview = process.argv.includes("preview");

export default defineConfig({
  plugins: [!isPreview && qwikVite({ csr: true })],
  server: { port: 5178 },
});
