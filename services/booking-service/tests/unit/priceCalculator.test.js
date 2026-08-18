'use strict';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  TESTS UNITAIRES — priceCalculator.js
 *  Microservice : booking-service (Node.js / Express + MongoDB)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Ces tests vérifient la logique métier PURE de calcul des prix,
 *  sans base de données, sans réseau — exécution en millisecondes.
 *
 *  Structure AAA : Arrange → Act → Assert
 */

const { calculatePrixTotal } = require('../../src/utils/priceCalculator');

describe('🧮 Tests Unitaires — Calcul du Prix Total (priceCalculator)', () => {

  // ── 1. Calcul de base (sans enfants, sans pension) ───────────────────────
  test('calcul correct pour 1 nuit, 1 chambre, sans supplément', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-11',
      nbChambres: 1,
    });
    expect(prix).toBe(120);
  });

  // ── 2. Calcul du nombre de nuits ─────────────────────────────────────────
  test('calcul correct pour 3 nuits', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 100,
      supplementPension: 0,
      agesEnfants: [],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-13',
      nbChambres: 1,
    });
    expect(prix).toBe(300); // 100 × 3 nuits
  });

  // ── 3. Prix par défaut si aucune date fournie (1 nuit) ───────────────────
  test('retourne le prix pour 1 nuit si aucune date fournie', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 200,
      supplementPension: 0,
      agesEnfants: [],
      nbChambres: 1,
    });
    expect(prix).toBe(200); // 200 × 1 nuit par défaut
  });

  // ── 4. Enfant de moins de 2 ans = GRATUIT ────────────────────────────────
  test('enfant < 2 ans est gratuit (supplément = 0 DT)', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [1],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-11',
      nbChambres: 1,
    });
    expect(prix).toBe(120); // Pas de supplément pour bébé
  });

  // ── 5. Enfant entre 2 et 11 ans = +30 DT ────────────────────────────────
  test('enfant entre 2 et 11 ans ajoute 30 DT par nuit', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [6],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-11',
      nbChambres: 1,
    });
    expect(prix).toBe(150); // 120 + 30 = 150
  });

  // ── 6. Enfant de 12 ans et plus = +50 DT ─────────────────────────────────
  test('enfant >= 12 ans ajoute 50 DT par nuit', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [14],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-11',
      nbChambres: 1,
    });
    expect(prix).toBe(170); // 120 + 50 = 170
  });

  // ── 7. Plusieurs enfants d'âges différents ────────────────────────────────
  test('calcul correct avec plusieurs enfants d\'âges différents', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [1, 6, 14], // gratuit + 30 + 50 = 80
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-11',
      nbChambres: 1,
    });
    expect(prix).toBe(200); // 120 + 0 + 30 + 50 = 200
  });

  // ── 8. Supplément pension (demi-pension) ──────────────────────────────────
  test('supplément pension ajouté correctement', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 40, // Demi Pension
      agesEnfants: [],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-12',
      nbChambres: 1,
    });
    expect(prix).toBe(320); // (120 + 40) × 2 nuits = 320
  });

  // ── 9. Plusieurs chambres ─────────────────────────────────────────────────
  test('calcul correct avec 2 chambres', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 120,
      supplementPension: 0,
      agesEnfants: [],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-13',
      nbChambres: 2,
    });
    expect(prix).toBe(720); // 120 × 3 nuits × 2 chambres = 720
  });

  // ── 10. Scénario complet réaliste ─────────────────────────────────────────
  test('scénario complet : 2 chambres, pension, 2 enfants, 3 nuits', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 150,
      supplementPension: 40,
      agesEnfants: [6, 14], // +30 + +50 = 80
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-13',
      nbChambres: 2,
    });
    // (150 + 40 + 30 + 50) × 3 nuits × 2 chambres = 270 × 3 × 2 = 1620
    expect(prix).toBe(1620);
  });

  // ── 11. Le prix est toujours arrondi à l'entier ──────────────────────────
  test('le prix retourné est arrondi à l\'entier', () => {
    const prix = calculatePrixTotal({
      prixBaseNuit: 99.5,
      supplementPension: 0,
      agesEnfants: [],
      dateArrivee: '2026-08-10',
      dateDepart: '2026-08-13',
      nbChambres: 1,
    });
    expect(Number.isInteger(prix)).toBe(true);
  });
});
