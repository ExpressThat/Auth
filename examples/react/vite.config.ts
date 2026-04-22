import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@builder.io/mitosis/jsx-runtime": "react/jsx-runtime",
    },
  },
  server: { port: 5173 },
});
