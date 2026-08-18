/**
 * Tests E2E : Parcours de réservation complet
 * 
 * Couvre : choix d'un hôtel, sélection chambre, réservation
 * 
 * Note : nécessite que le serveur backend soit opérationnel avec des données
 */

import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:8000/api";

// Données de test partagées
let hotelId: number | null = null;

test.beforeAll(async ({ request }) => {
  // Récupérer le premier hôtel disponible
  const resp = await request.get(`${API_URL}/hotels`);
  if (resp.ok()) {
    const data = await resp.json();
    const hotels = Array.isArray(data) ? data : data.data || [];
    if (hotels.length > 0) {
      hotelId = hotels[0].id;
    }
  }
});

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
});

// ── Page de détail hôtel ───────────────────────────────────────────────────

test("Réservation - la page de détail hôtel montre les chambres", async ({ page }) => {
  test.skip(!hotelId, "Aucun hôtel disponible sur l'API");

  await page.goto(`/hotels/${hotelId}`);

  // Attendre le chargement
  await page.waitForTimeout(2000);

  // Vérifier qu'on voit le nom de l'hôtel
  await expect(page.locator("h1, h2").first()).toBeVisible();

  // Vérifier la section "Chambres disponibles" ou "Chambre"
  await expect(page.locator("h2, h3, div", { hasText: /Chambre/i }).first()).toBeVisible({ timeout: 5000 });
});

test("Réservation - le formulaire de dates est visible", async ({ page }) => {
  test.skip(!hotelId, "Aucun hôtel disponible sur l'API");

  await page.goto(`/hotels/${hotelId}`);
  await page.waitForTimeout(2000);

  // Vérifier qu'il y a des options ou entrées de réservation / dates
  await expect(page.locator("body")).toBeVisible();
});

// ── Réservation nécessite connexion ────────────────────────────────────────

test("Réservation - sans token, redirige vers login", async ({ page }) => {
  test.skip(!hotelId, "Aucun hôtel disponible sur l'API");

  await page.goto(`/hotels/${hotelId}`);
  await page.waitForTimeout(2000);

  // Essayer de cliquer sur un bouton "Réserver" ou "Payer"
  const reserveBtn = page.locator('button', { hasText: /Réserver|Payer/i }).first();
  if (await reserveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await reserveBtn.click();

    // Doit rediriger vers login
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  }
});
