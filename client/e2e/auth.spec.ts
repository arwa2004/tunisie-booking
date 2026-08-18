/**
 * Tests E2E : Parcours Authentification
 * 
 * Couvre : inscription, connexion, déconnexion, profil
 */

import { test, expect } from "@playwright/test";

const TEST_USER = {
  nom: "Playwright",
  prenom: "Test",
  email: `e2e_${Date.now()}@test.com`,
  telephone: "+21650123456",
  password: "Test1234!",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// ── Inscription ────────────────────────────────────────────────────────────

test("Inscription - créer un compte avec succès", async ({ page }) => {
  await page.goto("/register");

  // Remplir le formulaire d'inscription
  await page.fill("#nom", TEST_USER.nom);
  await page.fill("#prenom", TEST_USER.prenom);
  await page.fill("#email", TEST_USER.email);
  await page.fill("#telephone", TEST_USER.telephone);
  await page.fill("#password", TEST_USER.password);
  await page.fill("#password_confirmation", TEST_USER.password);

  // Cliquer sur "Créer mon compte" / submit
  await page.click('button[type="submit"]');

  // Attendre la redirection vers l'accueil
  await page.waitForURL("**/", { timeout: 10_000 });

  // Vérifier que le token est stocké
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeTruthy();
});

test("Inscription - mot de passe trop court affiche une erreur", async ({ page }) => {
  await page.goto("/register");

  await page.fill("#nom", "Test");
  await page.fill("#prenom", "User");
  await page.fill("#email", `error_${Date.now()}@test.com`);
  await page.fill("#telephone", "+21650123456");
  await page.fill("#password", "12");
  await page.fill("#password_confirmation", "12");

  await page.click('button[type="submit"]');

  // Le conteneur d'erreur utilise className text-red-600 / bg-red-50
  await expect(page.locator(".bg-red-50, .text-red-600").first()).toBeVisible({ timeout: 8000 });
});

// ── Connexion ──────────────────────────────────────────────────────────────

test("Connexion - email/mot de passe corrects", async ({ page }) => {
  const loginEmail = `login_${Date.now()}@test.com`;

  // 1. S'inscrire d'abord
  await page.goto("/register");
  await page.fill("#nom", "Login");
  await page.fill("#prenom", "Test");
  await page.fill("#email", loginEmail);
  await page.fill("#telephone", "+21650123456");
  await page.fill("#password", "Password123");
  await page.fill("#password_confirmation", "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");

  // 2. Déconnexion
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 3. Connexion
  await page.goto("/login");
  await page.fill('input[type="email"]', loginEmail);
  await page.fill('input[type="password"]', "Password123");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/", { timeout: 10_000 });
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeTruthy();
});

test("Connexion - mauvais mot de passe affiche une erreur", async ({ page }) => {
  await page.goto("/login");

  await page.fill('input[type="email"]', "inexistant@test.com");
  await page.fill('input[type="password"]', "mauvais123");

  await page.click('button[type="submit"]');

  await expect(page.locator(".bg-red-50, .text-red-600").first()).toBeVisible({ timeout: 8000 });
});

// ── Navigation sans auth ───────────────────────────────────────────────────

test("Page login - lien vers inscription est présent", async ({ page }) => {
  await page.goto("/login");

  const registerLink = page.locator('a[href="/register"]');
  await expect(registerLink.first()).toBeVisible();
});

test("Page register - lien vers connexion est présent", async ({ page }) => {
  await page.goto("/register");

  const loginLink = page.locator('a[href="/login"]');
  await expect(loginLink.first()).toBeVisible();
});
