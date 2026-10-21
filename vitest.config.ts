import { defineConfig } from "vitest/config"
import path from "path"

try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./"),
    },
  },
})
