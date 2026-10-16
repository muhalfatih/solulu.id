import { defineConfig } from "vitest/config"
import path from "path"

try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./"),
    },
  },
})
