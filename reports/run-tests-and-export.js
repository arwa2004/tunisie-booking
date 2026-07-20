/**
 * run-tests-and-export.js
 * Lance PHPUnit, lit le rapport XML, et génère un Excel avec les vrais résultats.
 * Contient l'ensemble complet des 75 cas de tests du projet.
 * Usage: node reports/run-tests-and-export.js
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const XML_OUT    = path.join(__dirname, 'phpunit-report.xml');
const XLS_OUT    = path.join(__dirname, 'rapport-tests-complet.xlsx');

// ─── 1. Lancer PHPUnit ───────────────────────────────────────────────────────
console.log('🚀 Lancement de PHPUnit...');
try {
  execSync(
    `php artisan test --log-junit "${XML_OUT}" --env=testing`,
    { cwd: SERVER_DIR, stdio: 'inherit' }
  );
} catch {
  // PHPUnit retourne un code d'erreur si des tests échouent — on continue quand même
}

// ─── 2. Parser le XML ────────────────────────────────────────────────────────
console.log('\n📄 Lecture du rapport XML...');
const xmlContent = fs.readFileSync(XML_OUT, 'utf8');

function parseTestcases(xml) {
  const results = [];
  const tcRegex = /<testcase([^>]*)>([\s\S]*?)<\/testcase>|<testcase([^\/]*?)\/>/g;
  let m;
  while ((m = tcRegex.exec(xml)) !== null) {
    const attrs  = m[1] || m[3];
    const inner  = m[2] || '';
    const name   = (attrs.match(/name="([^"]*)"/) || [])[1] || '';
    const klass  = (attrs.match(/classname="([^"]*)"/) || [])[1] || '';
    const time   = parseFloat((attrs.match(/time="([^"]*)"/) || [])[1] || 0).toFixed(3);
    const failed = /<failure|<error/.test(inner);
    const msg    = failed
      ? (inner.match(/<(?:failure|error)[^>]*>([\s\S]*?)<\/(?:failure|error)>/) || [])[1]?.trim().slice(0, 120) || ''
      : '';
    results.push({ name, klass, time, statut: failed ? 'FAIL' : 'PASS', msg });
  }
  return results;
}

const tcResults = parseTestcases(xmlContent);
console.log(`   ${tcResults.length} cas trouvés dans le rapport XML`);

const resultMap = new Map();
tcResults.forEach(r => resultMap.set(r.name, r));

// ─── 3. Liste exhaustive des 75 cas de tests ──────────────────────────────────
const PLAN = [
  // ─── DESTINATION (6 tests)
  { id: 'U-DST-01', method: 'test_hasNom_retourne_true_si_nom_renseigne', module: 'Unit / Destination', titre: 'Validation du nom de destination', entree: 'nom = "Djerba", region = "Médenine"', attendu: 'hasNom() → true' },
  { id: 'U-DST-02', method: 'test_hasNom_retourne_false_si_nom_vide', module: 'Unit / Destination', titre: 'Rejet si le nom est vide', entree: 'nom = "" (vide)', attendu: 'hasNom() → false' },
  { id: 'U-DST-03', method: 'test_hasNom_retourne_false_si_nom_manquant', module: 'Unit / Destination', titre: 'Rejet si le nom est absent', entree: 'nom = null', attendu: 'hasNom() → false' },
  { id: 'U-DST-04', method: 'test_hasRegion_retourne_true_si_region_renseignee', module: 'Unit / Destination', titre: 'Validation de la région', entree: 'region = "Sousse"', attendu: 'hasRegion() → true' },
  { id: 'U-DST-05', method: 'test_hasRegion_retourne_false_si_region_vide', module: 'Unit / Destination', titre: 'Rejet si la région est vide', entree: 'region = ""', attendu: 'hasRegion() → false' },
  { id: 'U-DST-06', method: 'test_getNomComplet_retourne_format_correct', module: 'Unit / Destination', titre: 'Format du nom complet', entree: 'nom = "Hammamet", region = "Nabeul"', attendu: 'getNomComplet() → "Hammamet (Nabeul)"' },

  // ─── HOTEL (8 tests)
  { id: 'U-HTL-01', method: 'test_isDisponible_retourne_true_quand_disponible', module: 'Unit / Hôtel', titre: 'Disponibilité positive', entree: 'disponible = 1', attendu: 'isDisponible() → true' },
  { id: 'U-HTL-02', method: 'test_isDisponible_retourne_false_quand_indisponible', module: 'Unit / Hôtel', titre: 'Disponibilité négative', entree: 'disponible = 0', attendu: 'isDisponible() → false' },
  { id: 'U-HTL-03', method: 'test_isEtoilesValide_retourne_true_pour_1_a_5', module: 'Unit / Hôtel', titre: 'Étoiles correctes', entree: 'etoiles = 1 à 5', attendu: 'isEtoilesValide() → true' },
  { id: 'U-HTL-04', method: 'test_isEtoilesValide_retourne_false_pour_zero', module: 'Unit / Hôtel', titre: 'Rejet étoiles = 0', entree: 'etoiles = 0', attendu: 'isEtoilesValide() → false' },
  { id: 'U-HTL-05', method: 'test_isEtoilesValide_retourne_false_pour_six', module: 'Unit / Hôtel', titre: 'Rejet étoiles = 6', entree: 'etoiles = 6', attendu: 'isEtoilesValide() → false' },
  { id: 'U-HTL-06', method: 'test_isPrixValide_retourne_true_pour_prix_positif', module: 'Unit / Hôtel', titre: 'Prix positif', entree: 'prix = 150', attendu: 'isPrixValide() → true' },
  { id: 'U-HTL-07', method: 'test_isPrixValide_retourne_false_pour_prix_zero', module: 'Unit / Hôtel', titre: 'Rejet prix = 0', entree: 'prix = 0', attendu: 'isPrixValide() → false' },
  { id: 'U-HTL-08', method: 'test_isPrixValide_retourne_false_pour_prix_negatif', module: 'Unit / Hôtel', titre: 'Rejet prix négatif', entree: 'prix = -50', attendu: 'isPrixValide() → false' },

  // ─── RESERVATION (17 tests)
  { id: 'U-RES-01', method: 'test_getNbNuits_retourne_nombre_correct', module: 'Unit / Réservation', titre: 'Calcul des nuits standard', entree: '01/08 au 04/08', attendu: 'nbNuits() → 3' },
  { id: 'U-RES-02', method: 'test_getNbNuits_retourne_zero_si_meme_date', module: 'Unit / Réservation', titre: 'Même date arrivée/départ', entree: '01/08 au 01/08', attendu: 'nbNuits() → 0' },
  { id: 'U-RES-03', method: 'test_getNbNuits_retourne_zero_si_depart_avant_arrivee', module: 'Unit / Réservation', titre: 'Départ chronologique avant arrivée', entree: '05/08 au 01/08', attendu: 'nbNuits() → 0' },
  { id: 'U-RES-04', method: 'test_getNbNuits_retourne_zero_si_dates_manquantes', module: 'Unit / Réservation', titre: 'Dates non renseignées', entree: 'null', attendu: 'nbNuits() → 0' },
  { id: 'U-RES-05', method: 'test_calculatePrixTotal_correct_sans_enfants', module: 'Unit / Réservation', titre: 'Prix total standard sans suppléments', entree: '3 nuits × 150 DT', attendu: '450 DT' },
  { id: 'U-RES-06', method: 'test_calculatePrixTotal_avec_enfants_de_differents_ages', module: 'Unit / Réservation', titre: 'Prix total avec enfants d\'âges variés', entree: 'Ado (14 ans) et enfant (8 ans)', attendu: 'Suppl. +50 DT et +30 DT par nuit' },
  { id: 'U-RES-07', method: 'test_calculatePrixTotal_une_nuit_une_chambre_sans_enfants', module: 'Unit / Réservation', titre: 'Calcul 1 nuit 1 chambre', entree: '1 nuit × 100 DT', attendu: '100 DT' },
  { id: 'U-RES-08', method: 'test_calculatePrixTotal_zero_si_meme_date', module: 'Unit / Réservation', titre: 'Prix 0 si 0 nuit', entree: 'dates identiques', attendu: '0 DT' },
  { id: 'U-RES-09', method: 'test_isStatutValide_retourne_true_pour_en_attente', module: 'Unit / Réservation', titre: 'Statut en attente valide', entree: '"en_attente"', attendu: 'isStatutValide() → true' },
  { id: 'U-RES-10', method: 'test_isStatutValide_retourne_true_pour_confirmee', module: 'Unit / Réservation', titre: 'Statut confirmée valide', entree: '"confirmee"', attendu: 'isStatutValide() → true' },
  { id: 'U-RES-11', method: 'test_isStatutValide_retourne_true_pour_annulee', module: 'Unit / Réservation', titre: 'Statut annulée valide', entree: '"annulee"', attendu: 'isStatutValide() → true' },
  { id: 'U-RES-12', method: 'test_isStatutValide_retourne_false_pour_statut_inconnu', module: 'Unit / Réservation', titre: 'Statut erroné rejeté', entree: '"inconnu"', attendu: 'isStatutValide() → false' },
  { id: 'U-RES-13', method: 'test_canTransitionTo_en_attente_vers_confirmee', module: 'Unit / Réservation', titre: 'Transition en attente vers confirmée', entree: 'en_attente → confirme', attendu: 'true' },
  { id: 'U-RES-14', method: 'test_canTransitionTo_en_attente_vers_annulee', module: 'Unit / Réservation', titre: 'Transition en attente vers annulée', entree: 'en_attente → annulee', attendu: 'true' },
  { id: 'U-RES-15', method: 'test_canTransitionTo_annulee_est_etat_terminal', module: 'Unit / Réservation', titre: 'Annulée est un état bloquant', entree: 'annulee → confirmee', attendu: 'false' },
  { id: 'U-RES-16', method: 'test_canTransitionTo_retourne_false_pour_statut_invalide', module: 'Unit / Réservation', titre: 'Transition vers statut erroné', entree: 'confirmee → faux_statut', attendu: 'false' },
  { id: 'U-RES-17', method: 'test_getStatutsValides_contient_les_trois_statuts', module: 'Unit / Réservation', titre: 'Liste des statuts acceptés', entree: 'Appel méthode', attendu: 'Contient en_attente, confirmee, annulee' },

  // ─── VOYAGE (8 tests)
  { id: 'U-VOY-01', method: 'test_isPrixValide_retourne_true_pour_prix_positif', module: 'Unit / Voyage', titre: 'Prix valide positif', entree: 'prix = 400', attendu: 'isPrixValide() → true' },
  { id: 'U-VOY-02', method: 'test_isPrixValide_retourne_false_pour_prix_zero', module: 'Unit / Voyage', titre: 'Rejet prix = 0', entree: 'prix = 0', attendu: 'isPrixValide() → false' },
  { id: 'U-VOY-03', method: 'test_isPrixValide_retourne_false_pour_prix_negatif', module: 'Unit / Voyage', titre: 'Rejet prix négatif', entree: 'prix = -20', attendu: 'isPrixValide() → false' },
  { id: 'U-VOY-04', method: 'test_isDureeValide_retourne_true_pour_un_jour', module: 'Unit / Voyage', titre: 'Durée 1 jour valide', entree: 'duree = 1', attendu: 'isDureeValide() → true' },
  { id: 'U-VOY-05', method: 'test_isDureeValide_retourne_true_pour_une_semaine', module: 'Unit / Voyage', titre: 'Durée longue valide', entree: 'duree = 7', attendu: 'isDureeValide() → true' },
  { id: 'U-VOY-06', method: 'test_isDureeValide_retourne_false_pour_zero_jour', module: 'Unit / Voyage', titre: 'Rejet durée = 0', entree: 'duree = 0', attendu: 'isDureeValide() → false' },
  { id: 'U-VOY-07', method: 'test_getDureeLabel_retourne_un_jour_au_singulier', module: 'Unit / Voyage', titre: 'Singulier libellé', entree: 'duree = 1', attendu: '→ "1 jour"' },
  { id: 'U-VOY-08', method: 'test_getDureeLabel_retourne_pluriel_pour_plusieurs_jours', module: 'Unit / Voyage', titre: 'Pluriel libellé', entree: 'duree = 5', attendu: '→ "5 jours"' },

  // ─── AUTH (4 tests)
  { id: 'F-AUTH-01', method: 'test_register_returns_token', module: 'Feature / Auth', titre: 'Inscription valide', entree: 'POST /api/register', attendu: 'HTTP 201 + token' },
  { id: 'F-AUTH-02', method: 'test_login_correct_returns_200', module: 'Feature / Auth', titre: 'Connexion valide', entree: 'POST /api/login', attendu: 'HTTP 200 + token' },
  { id: 'F-AUTH-03', method: 'test_login_wrong_password_returns_401', module: 'Feature / Auth', titre: 'Connexion mauvais mot de passe', entree: 'POST /api/login (mdp erroné)', attendu: 'HTTP 401' },
  { id: 'F-AUTH-04', method: 'test_logout_revokes_token', module: 'Feature / Auth', titre: 'Déconnexion utilisateur', entree: 'POST /api/logout (token fourni)', attendu: 'HTTP 200' },

  // ─── AVIS (5 tests)
  { id: 'F-AVI-01', method: 'test_get_avis_returns_list_and_stats', module: 'Feature / Avis', titre: 'Récupération des avis de l\'hôtel', entree: 'GET /api/hotels/{id}/avis', attendu: 'HTTP 200 + stats (count, % recommandation)' },
  { id: 'F-AVI-02', method: 'test_post_avis_without_token_returns_401', module: 'Feature / Avis', titre: 'Publication sans token refusée', entree: 'POST /api/hotels/{id}/avis (sans auth)', attendu: 'HTTP 401' },
  { id: 'F-AVI-03', method: 'test_post_avis_with_token_creates_or_updates', module: 'Feature / Avis', titre: 'Publication/Mise à jour d\'un avis', entree: 'POST /api/hotels/{id}/avis avec token', attendu: 'HTTP 201 + avis en BDD' },
  { id: 'F-AVI-04', method: 'test_post_avis_invalid_notes_returns_422', module: 'Feature / Avis', titre: 'Rejet note invalide', entree: 'note_globale = 12 (> 10)', attendu: 'HTTP 422' },
  { id: 'F-AVI-05', method: 'test_delete_avis_authorized', module: 'Feature / Avis', titre: 'Suppression d\'avis', entree: 'DELETE /api/avis/{id}', attendu: 'HTTP 200 + BDD mise à jour' },

  // ─── CHAMBRE (6 tests)
  { id: 'F-CHB-01', method: 'test_get_chambres_returns_list', module: 'Feature / Chambre', titre: 'Liste des chambres', entree: 'GET /api/chambres', attendu: 'HTTP 200' },
  { id: 'F-CHB-02', method: 'test_get_chambre_inexistante_returns_404', module: 'Feature / Chambre', titre: 'Chambre introuvable', entree: 'GET /api/chambres/9999', attendu: 'HTTP 404' },
  { id: 'F-CHB-03', method: 'test_create_chambre_without_token_returns_401', module: 'Feature / Chambre', titre: 'Création sans authentification', entree: 'POST /api/chambres (sans auth)', attendu: 'HTTP 401' },
  { id: 'F-CHB-04', method: 'test_create_chambre_valid_returns_201', module: 'Feature / Chambre', titre: 'Création chambre (Admin)', entree: 'POST /api/chambres (avec auth)', attendu: 'HTTP 201' },
  { id: 'F-CHB-05', method: 'test_update_chambre_prix_returns_200', module: 'Feature / Chambre', titre: 'Modification prix chambre', entree: 'PUT /api/chambres/{id}', attendu: 'HTTP 200' },
  { id: 'F-CHB-06', method: 'test_delete_chambre_returns_200', module: 'Feature / Chambre', titre: 'Suppression chambre', entree: 'DELETE /api/chambres/{id}', attendu: 'HTTP 200' },

  // ─── HOTEL API (5 tests)
  { id: 'F-HTLAPI-01', method: 'test_get_hotels_returns_list', module: 'Feature / Hôtel API', titre: 'Liste publique des hôtels', entree: 'GET /api/hotels', attendu: 'HTTP 200' },
  { id: 'F-HTLAPI-02', method: 'test_get_hotel_by_id_returns_correct_hotel', module: 'Feature / Hôtel API', titre: 'Détail d\'un hôtel existant', entree: 'GET /api/hotels/{id}', attendu: 'HTTP 200' },
  { id: 'F-HTLAPI-03', method: 'test_get_hotel_inexistant_returns_404', module: 'Feature / Hôtel API', titre: 'Hôtel inexistant', entree: 'GET /api/hotels/9999', attendu: 'HTTP 404' },
  { id: 'F-HTLAPI-04', method: 'test_create_hotel_without_token_returns_401', module: 'Feature / Hôtel API', titre: 'Création sans auth', entree: 'POST /api/hotels (sans auth)', attendu: 'HTTP 401' },
  { id: 'F-HTLAPI-05', method: 'test_create_hotel_with_token_returns_201', module: 'Feature / Hôtel API', titre: 'Création hôtel (Admin)', entree: 'POST /api/hotels (avec auth)', attendu: 'HTTP 201' },

  // ─── PROFIL (3 tests)
  { id: 'F-PRF-01', method: 'test_me_returns_authenticated_user', module: 'Feature / Profil', titre: 'Récupération profil connecté', entree: 'GET /api/me', attendu: 'HTTP 200 + détails utilisateur' },
  { id: 'F-PRF-02', method: 'test_update_profile_updates_correctly', module: 'Feature / Profil', titre: 'Mise à jour des infos', entree: 'PUT /api/profil', attendu: 'HTTP 200' },
  { id: 'F-PRF-03', method: 'test_update_password_wrong_current_returns_422', module: 'Feature / Profil', titre: 'Changement mdp mauvais mot de passe actuel', entree: 'PUT /api/profil/password', attendu: 'HTTP 422' },

  // ─── ADMIN RESERVATIONS (6 tests)
  { id: 'F-ADM-01', method: 'test_get_all_reservations_without_admin_returns_401', module: 'Feature / Admin Rés.', titre: 'Accès non-admin refusé', entree: 'GET /api/reservations (sans rôle admin)', attendu: 'HTTP 403' },
  { id: 'F-ADM-02', method: 'test_admin_can_list_all_reservations', module: 'Feature / Admin Rés.', titre: 'Liste des réservations (Admin)', entree: 'GET /api/reservations (avec auth admin)', attendu: 'HTTP 200' },
  { id: 'F-ADM-03', method: 'test_admin_can_confirm_reservation', module: 'Feature / Admin Rés.', titre: 'Confirmation réservation', entree: 'PUT /api/reservations/{id} statut=confirmee', attendu: 'HTTP 200' },
  { id: 'F-ADM-04', method: 'test_admin_can_cancel_reservation', module: 'Feature / Admin Rés.', titre: 'Annulation réservation', entree: 'PUT /api/reservations/{id} statut=annulee', attendu: 'HTTP 200' },
  { id: 'F-ADM-05', method: 'test_admin_update_invalid_statut_returns_422', module: 'Feature / Admin Rés.', titre: 'Mise à jour statut erroné', entree: 'statut=zombie', attendu: 'HTTP 422' },
  { id: 'F-ADM-06', method: 'test_admin_can_delete_reservation', module: 'Feature / Admin Rés.', titre: 'Suppression réservation', entree: 'DELETE /api/reservations/{id}', attendu: 'HTTP 200' },

  // ─── RESERVATION API (5 tests)
  { id: 'F-RES-01', method: 'test_create_reservation_without_token_returns_401', module: 'Feature / Réservation API', titre: 'Réservation sans auth', entree: 'POST /api/reservations (sans auth)', attendu: 'HTTP 401' },
  { id: 'F-RES-02', method: 'test_create_reservation_with_invalid_data_returns_422', module: 'Feature / Réservation API', titre: 'Validation des données', entree: 'hotel_id invalide', attendu: 'HTTP 422' },
  { id: 'F-RES-03', method: 'test_create_reservation_valid_returns_201_with_prix', module: 'Feature / Réservation API', titre: 'Création réservation valide', entree: 'hotel, chambre, dates', attendu: 'HTTP 201 + prix_total calculé' },
  { id: 'F-RES-04', method: 'test_create_reservation_chambre_wrong_hotel_returns_422', module: 'Feature / Réservation API', titre: 'Chambre incohérente', entree: 'chambre liée à un autre hôtel', attendu: 'HTTP 422' },
  { id: 'F-RES-05', method: 'test_create_reservation_capacite_insuffisante_returns_422', module: 'Feature / Réservation API', titre: 'Surcapacité', entree: 'nb personnes > capacité chambre', attendu: 'HTTP 422' },

  // ─── EXAMPLES & DEFAULTS (2 tests)
  { id: 'F-EXM-01', method: 'test_the_application_returns_a_successful_response', module: 'Feature / Système', titre: 'Vérification route root', entree: 'GET /', attendu: 'HTTP 200' },
  { id: 'U-EXM-01', method: 'test_that_true_is_true', module: 'Unit / Système', titre: 'Vérification runtime unitaire', entree: 'Appel assert', attendu: 'true is true' }
];

// ─── 4. Construire les données Excel ─────────────────────────────────────────
const now = new Date().toLocaleString('fr-FR');
const HEADER = ['ID', 'Module', 'Titre du Test', 'Étapes / Données d\'entrée', 'Résultat Attendu', 'Statut', 'Durée (s)', 'Message d\'erreur'];

const rows = PLAN.map(p => {
  const res    = resultMap.get(p.method);
  const statut = res ? res.statut : '—';
  const duree  = res ? res.time   : '—';
  const msg    = res ? res.msg    : '';
  return [p.id, p.module, p.titre, p.entree, p.attendu, statut, duree, msg];
});

const passCount = rows.filter(r => r[5] === 'PASS').length;
const failCount = rows.filter(r => r[5] === 'FAIL').length;
const skipCount = rows.filter(r => r[5] === '—').length;

// ─── 5. Générer le fichier Excel ─────────────────────────────────────────────
const wb = xlsx.utils.book_new();

// Feuille 1 – Plan de Tests
const wsData = [HEADER, ...rows];
const ws = xlsx.utils.aoa_to_sheet(wsData);
ws['!cols'] = [
  { wch: 12 }, { wch: 24 }, { wch: 45 },
  { wch: 55 }, { wch: 45 }, { wch: 10 },
  { wch: 12 }, { wch: 40 },
];
xlsx.utils.book_append_sheet(wb, ws, 'Résultats des Tests');

// Feuille 2 – Résumé
const summaryData = [
  ['Rapport d\'exécution — TunisieBooking'],
  ['Généré le', now],
  [''],
  ['Métrique', 'Valeur'],
  ['Total des tests', PLAN.length],
  ['✅ PASS',  passCount],
  ['❌ FAIL',  failCount],
  ['— Non mappé (ou ignoré)', skipCount],
  ['Taux de réussite', `${Math.round(passCount / (passCount + failCount || 1) * 100)} %`],
  [''],
  ['Par catégorie', 'Total', 'PASS', 'FAIL'],
  [
    'Tests Unitaires',
    rows.filter(r => r[0].startsWith('U-')).length,
    rows.filter(r => r[0].startsWith('U-') && r[5]==='PASS').length,
    rows.filter(r => r[0].startsWith('U-') && r[5]==='FAIL').length,
  ],
  [
    'Tests Fonctionnels',
    rows.filter(r => r[0].startsWith('F-')).length,
    rows.filter(r => r[0].startsWith('F-') && r[5]==='PASS').length,
    rows.filter(r => r[0].startsWith('F-') && r[5]==='FAIL').length,
  ],
];
const wsSummary = xlsx.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 10 }];
xlsx.utils.book_append_sheet(wb, wsSummary, 'Résumé');

xlsx.writeFile(wb, XLS_OUT);

// ─── 6. Rapport console ───────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RAPPORT DE TESTS — TunisieBooking');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Total  : ${PLAN.length} tests`);
console.log(`   ✅ PASS : ${passCount}`);
console.log(`   ❌ FAIL : ${failCount}`);
if (failCount > 0) {
  console.log('\n   Tests en échec :');
  rows.filter(r => r[5] === 'FAIL').forEach(r => {
    console.log(`   [${r[0]}] ${r[2]}`);
    if (r[7]) console.log(`           → ${r[7]}`);
  });
}
console.log(`\n✅ Excel généré : ${XLS_OUT}\n`);
