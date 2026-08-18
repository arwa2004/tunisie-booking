'use strict';

/**
 * Logique métier de calcul du prix total d'une réservation.
 * Séparée du contrôleur pour être testable et réutilisable.
 *
 * Règles :
 *  - Prix de base par nuit + supplément pension par nuit
 *  - Supplément enfant : gratuit < 2 ans, +30 DT < 12 ans, +50 DT >= 12 ans
 *  - Total = (base + pension + suppléments enfants) × nbNuits × nbChambres
 */
function calculatePrixTotal({
  prixBaseNuit = 120,
  supplementPension = 0,
  agesEnfants = [],
  dateArrivee,
  dateDepart,
  nbChambres = 1,
} = {}) {
  let nbNuits = 1;

  if (dateArrivee && dateDepart) {
    const d1 = new Date(dateArrivee);
    const d2 = new Date(dateDepart);
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
    if (diff > 0) nbNuits = Math.ceil(diff);
  }

  let supplementEnfants = 0;
  if (Array.isArray(agesEnfants)) {
    agesEnfants.forEach((age) => {
      const n = Number(age);
      if (n < 2) supplementEnfants += 0;
      else if (n < 12) supplementEnfants += 30;
      else supplementEnfants += 50;
    });
  }

  const prixTotal = (prixBaseNuit + supplementPension + supplementEnfants) * nbNuits * nbChambres;

  return Math.round(prixTotal);
}

module.exports = { calculatePrixTotal };

