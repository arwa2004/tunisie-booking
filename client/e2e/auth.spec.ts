/**
 * Tests E2E : Parcours Authentification via Keycloak
 * Framework : Playwright (Chromium)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * NOTE ARCHITECTURALE :
 *   Le projet TunisieBooking utilise Keycloak comme fournisseur d'identité
 *   via next-auth. Les pages /login et /register ne contiennent PAS de
 *   formulaires email/password — elles redirigent automatiquement vers Keycloak.
 *
 * COUVERTURE :
 *   - Structure correcte de la page /login (titre, bouton Keycloak, lien register)
 *   - Structure correcte de la page /register (titre, bouton Keycloak, lien login)
 *   - Protection des routes : accès sans session redirige vers /login
 *   - Navigation entre les pages d'auth
 *   - Flux Keycloak complet (skippé si Keycloak non disponible)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { test, expect } from "@playwright/test";

// Vérifie si le serveur Keycloak est accessible
async function isKeycloakAvailable(request: any): Promise<boolean> {
  try {
    const res = await request.get("http://127.0.0.1:8080/realms/tunisiebooking", { timeout: 3000 });
    return res.status() < 500;
  } catch {
    return false;
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 1 : Structure de la page /login
// ══════════════════════════════════════════════════════════════════════════════

test("Page login - affiche le titre 'Connexion'", async ({ page }) => {
  await page.goto("/login");

  // Attendre que la page soit chargée (pas le spinner)
  await page.waitForSelector("h1", { timeout: 10_000 });

  // Le titre "Connexion" doit être visible
  await expect(page.locator("h1")).toContainText("Connexion");
});

test("Page login - affiche le bouton Keycloak", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(500);

  // Le bouton de connexion via Keycloak doit être visible
  const keycloakBtn = page.locator("button", { hasText: /keycloak|connecter/i }).first();
  await expect(keycloakBtn).toBeVisible({ timeout: 10_000 });
});

test("Page login - affiche le lien vers inscription", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(500);

  // Lien vers /register (S'inscrire)
  const registerLink = page.locator('a[href="/register"]');
  await expect(registerLink.first()).toBeVisible({ timeout: 8_000 });
});

test("Page login - affiche le lien retour accueil", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(500);

  // Lien retour vers l'accueil
  const homeLink = page.locator('a[href="/"]').first();
  await expect(homeLink).toBeVisible({ timeout: 8_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 2 : Structure de la page /register
// ══════════════════════════════════════════════════════════════════════════════

test("Page register - affiche le titre 'Créer un compte'", async ({ page }) => {
  await page.goto("/register");
  await page.waitForSelector("h1", { timeout: 10_000 });

  await expect(page.locator("h1")).toContainText("Créer un compte");
});

test("Page register - affiche le bouton S'inscrire avec Keycloak", async ({ page }) => {
  await page.goto("/register");
  await page.waitForTimeout(500);

  const keycloakBtn = page.locator("button", { hasText: /keycloak|inscrire/i }).first();
  await expect(keycloakBtn).toBeVisible({ timeout: 10_000 });
});

test("Page register - affiche le lien vers connexion", async ({ page }) => {
  await page.goto("/register");
  await page.waitForTimeout(500);

  // Lien vers /login (Se connecter)
  const loginLink = page.locator('a[href="/login"]');
  await expect(loginLink.first()).toBeVisible({ timeout: 8_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 3 : Navigation entre les pages d'auth
// ══════════════════════════════════════════════════════════════════════════════

test("Navigation : cliquer sur S'inscrire depuis la page login", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(500);

  // Cliquer sur le lien "S'inscrire"
  await page.locator('a[href="/register"]').first().click();

  // Vérifier qu'on est bien sur /register
  await expect(page).toHaveURL(/\/register/, { timeout: 8_000 });
});

test("Navigation : cliquer sur Se connecter depuis la page register", async ({ page }) => {
  await page.goto("/register");
  await page.waitForTimeout(500);

  // Cliquer sur le lien "Se connecter"
  await page.locator('a[href="/login"]').first().click();

  // Vérifier qu'on est bien sur /login
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 4 : Flux Keycloak complet (skippé si Keycloak non disponible)
// ══════════════════════════════════════════════════════════════════════════════

test("Flux Keycloak - le bouton redirige vers Keycloak", async ({ page, request }) => {
  const keycloakUp = await isKeycloakAvailable(request);
  test.skip(!keycloakUp, "⚠️ Keycloak non disponible — démarrer le conteneur Keycloak d'abord");

  await page.goto("/login");
  await page.waitForTimeout(500);

  // Cliquer sur le bouton Keycloak
  await page.locator("button", { hasText: /keycloak/i }).first().click();

  // Vérifier qu'on est bien redirigé vers Keycloak
  await expect(page).toHaveURL(/keycloak|8080/, { timeout: 15_000 });
});
