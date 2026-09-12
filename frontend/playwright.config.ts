import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev --prefix ..",
      url: "http://localhost:3000/products",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
