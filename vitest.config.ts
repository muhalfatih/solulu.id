import { defineConfig } from "vitest/config"
import path from "path"

try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    // Fail-closed config (ADR-0013): tests run with explicit secrets, never a mock bypass.
    env: {
      CRON_SECRET: "test-cron-secret",
      XENDIT_CALLBACK_TOKEN: "valid-xendit-token",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./"),
    },
  },
})
