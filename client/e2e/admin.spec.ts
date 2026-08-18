/**
 * Tests E2E : Interface administrateur
 * 
 * Couvre : accès refusé sans rôle admin, navigation admin
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// ── Accès sans auth ────────────────────────────────────────────────────────

test("Admin - accès sans token redirige vers login", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});

test("Admin - les routes admin protégées redirigent", async ({ page }) => {
  const adminRoutes = [
    "/admin/hotels",
    "/admin/destinations",
    "/admin/reservations",
  ];

  for (const route of adminRoutes) {
    await page.goto(route);
    await page.waitForURL("**/login", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  }
});

// ── Profil ─────────────────────────────────────────────────────────────────

test("Profil - sans token redirige vers login", async ({ page }) => {
  await page.goto("/profil");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});
