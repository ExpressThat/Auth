import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load DATABASE_URL from workspace root env files first.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "../..");

config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

// Optional fallback if someone keeps env files beside the database package.
config({ path: resolve(__dirname, ".env.local") });
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
