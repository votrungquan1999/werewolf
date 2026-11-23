import { defineConfig, devices } from "@playwright/test";

// Own port and build directory, so the run never meets a dev server the developer has open.
const E2E_PORT = 3107;

export default defineConfig({
  testDir: "e2e",
  // A failure should show once, not be retried into a pass.
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
  },
  projects: [
    {
      name: "chromium",
      use: {
        // Phone-sized and touch-capable; set after the preset, whose desktop viewport would win otherwise.
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx next dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}/en`,
    env: { NEXT_DIST_DIR: ".next-e2e" },
    // A leftover server on this port is a bug to surface, never one to adopt.
    reuseExistingServer: false,
    // The server's output goes to the run's log, so a failed start shows why.
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
});
