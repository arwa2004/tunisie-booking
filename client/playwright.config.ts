import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour les tests E2E de TunisieBooking.
 * 
 * Lance les tests sur le serveur de dev Next.js (port 3000).
 * 
 * Utilisation :
 *   npx playwright test
 *   npx playwright test --ui
 *   npx playwright test --headed
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,           // séquentiel pour éviter les conflits de port
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,                     // 1 worker pour ne pas stresser le serveur dev
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Simuler un écran desktop standard
    viewport: { width: 1280, height: 720 },
    // Timeouts
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // ✅ Démarrage automatique du serveur Next.js avant les tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,    // réutilise le serveur si déjà lancé
    timeout: 120_000,             // 2 minutes max pour démarrer
    stdout: "ignore",
    stderr: "pipe",
  },
});
