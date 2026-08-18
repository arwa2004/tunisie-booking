/**
 * Tests E2E : Navigation et recherche d'hôtels
 * 
 * Couvre : page d'accueil, liste des hôtels, détail hôtel
 */

import { test, expect } from "@playwright/test";

// ── Page d'accueil ─────────────────────────────────────────────────────────

test("Accueil - affiche le titre et les sections principales", async ({ page }) => {
  await page.goto("/");

  // Vérifier le titre principal
  await expect(page.locator("h1").first()).toBeVisible();

  // Vérifier les sections (avec regex pour matcher le texte séparé par des spans)
  await expect(page.locator("h2", { hasText: /Destinations/i }).first()).toBeVisible();
  await expect(page.locator("h2", { hasText: /Bons Plans/i }).first()).toBeVisible();
  await expect(page.locator("h2", { hasText: /Voyages/i }).first()).toBeVisible();

  // Vérifier la barre de navigation
  await expect(page.locator("nav").first()).toBeVisible();

  // Vérifier le footer
  await expect(page.locator("footer").first()).toBeVisible();
});

test("Accueil - les liens de navigation fonctionnent", async ({ page }) => {
  await page.goto("/");

  // Cliquer sur "Voir tous les hôtels"
  await page.locator('a[href="/hotels"]').first().click();
  await page.waitForURL("**/hotels");
  await expect(page).toHaveURL(/\/hotels/);
});

// ── Liste des hôtels ───────────────────────────────────────────────────────

test("Hotels - la page se charge et affiche les résultats", async ({ page }) => {
  await page.goto("/hotels");

  // La page doit se charger sans erreur
  await expect(page.locator("body")).toBeVisible();

  // Vérifier la présence du titre (h2 ou h1)
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ── Page de détail d'un hôtel ──────────────────────────────────────────────

test("Hôtel détail - navigation vers un hôtel depuis l'accueil", async ({ page }) => {
  await page.goto("/");

  // Attendre que les hôtels soient chargés
  await page.waitForTimeout(2000);

  // Cliquer sur le premier hôtel disponible
  const hotelLinks = page.locator('a[href^="/hotels/"]');
  const count = await hotelLinks.count();

  if (count > 0) {
    // Récupérer le href du premier lien
    const firstHref = await hotelLinks.first().getAttribute("href");
    await hotelLinks.first().click();

    // Vérifier qu'on est bien sur la page détail
    await page.waitForURL(`**${firstHref}`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});

// ── Recherche avancée ──────────────────────────────────────────────────────

test("Recherche - la SearchBoxAdvanced est visible sur l'accueil", async ({ page }) => {
  await page.goto("/");

  // Vérifier la présence du composant de recherche
  await expect(page.locator("button", { hasText: /Rechercher/i }).first()).toBeVisible();

  // Vérifier les champs de destination
  const destinationSelect = page.locator("select").first();
  await expect(destinationSelect).toBeVisible({ timeout: 5000 });
});

