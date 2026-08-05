import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Prefer a system Chromium when present (CI sandboxes often lack the shared
// libraries Playwright's bundled headless shell needs).
const systemChromium = [process.env.E2E_CHROMIUM_PATH, "/bin/chromium", "/usr/bin/chromium"].find(
  (p): p is string => !!p && existsSync(p),
);
const launchOptions = systemChromium ? { executablePath: systemChromium } : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "off",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, launchOptions },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], launchOptions },
    },
  ],
});