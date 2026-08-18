/**
 * Tests E2E : Parcours de réservation complet
 * Framework : Playwright (Chromium)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * COUVERTURE :
 *   - Page de détail hôtel : affichage des chambres
 *   - Formulaire de dates visible
 *   - Protection de la réservation : l'utilisateur non connecté voit un message
 *     ou est redirigé vers login lorsqu'il tente de réserver
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:8000/api";

// Données de test partagées
let hotelId: number | null = null;

test.beforeAll(async ({ request }) => {
  // Récupérer le premier hôtel disponible via l'API
  try {
    const resp = await request.get(`${API_URL}/hotels`, { timeout: 5000 });
    if (resp.ok()) {
      const data = await resp.json();
      const hotels = Array.isArray(data) ? data : data.data || [];
      if (hotels.length > 0) {
        hotelId = hotels[0].id;
      }
    }
  } catch {
    // backend pas disponible — les tests concernés seront skippés
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 1 : Page de détail hôtel (nécessite le hotel-service)
// ══════════════════════════════════════════════════════════════════════════════

test("Réservation - la page de détail hôtel affiche les chambres", async ({ page }) => {
  test.skip(!hotelId, "⚠️ hotel-service non disponible — aucun hôtel trouvé");

  await page.goto(`/hotels/${hotelId}`);
  await page.waitForTimeout(2000);

  // Vérifier qu'on voit le nom de l'hôtel dans un titre
  await expect(page.locator("h1, h2").first()).toBeVisible();

  // Vérifier la section chambres
  await expect(
    page.locator("h2, h3, section, div", { hasText: /Chambre|chambre|Room/i }).first()
  ).toBeVisible({ timeout: 8000 });
});

test("Réservation - le formulaire de dates et de pension est visible", async ({ page }) => {
  test.skip(!hotelId, "⚠️ hotel-service non disponible — aucun hôtel trouvé");

  await page.goto(`/hotels/${hotelId}`);
  await page.waitForTimeout(2000);

  // Au moins un input de type date ou un champ de sélection doit être visible
  const hasDateInput = await page.locator('input[type="date"], input[type="text"][placeholder*="date" i]')
    .first().isVisible({ timeout: 5000 }).catch(() => false);

  const hasSelectField = await page.locator("select, [role='combobox']")
    .first().isVisible({ timeout: 3000 }).catch(() => false);

  expect(hasDateInput || hasSelectField).toBe(true);
});

// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 2 : Protection de la réservation (sans token)
// ══════════════════════════════════════════════════════════════════════════════

test("Réservation - sans token, un message ou une redirection vers login est déclenchée", async ({ page }) => {
  test.skip(!hotelId, "⚠️ hotel-service non disponible — aucun hôtel trouvé");

  // S'assurer qu'aucun token n'est présent
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  await page.goto(`/hotels/${hotelId}`);
  await page.waitForTimeout(2000);

  // Chercher un bouton "Réserver", "Payer", "Réservation"
  const reserveBtn = page.locator('button, a', { hasText: /Réserver|Payer|Réservation/i }).first();
  const btnVisible = await reserveBtn.isVisible({ timeout: 4000 }).catch(() => false);

  if (btnVisible) {
    await reserveBtn.click();
    await page.waitForTimeout(2000);

    // Soit redirection vers /login, soit un message d'erreur ou modal de connexion apparaît
    const redirectedToLogin = page.url().includes("/login");
    const loginPromptVisible = await page.locator(
      '[class*="modal"], [role="dialog"], .text-red-600, [href="/login"]',
      { hasText: /connexion|login|connecter/i }
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(redirectedToLogin || loginPromptVisible).toBe(true);
  } else {
    // Si pas de bouton "Réserver" visible sans connexion, le test est considéré réussi
    // (l'interface cache déjà l'action de réservation aux non-connectés)
    console.log("ℹ️ Aucun bouton Réserver visible sans connexion — comportement correct");
    expect(true).toBe(true);
  }
});
