/**
 * build-test-cases-excel.js
 * ---------------------------------------------------------------------------
 * Génère le FOUILLET EXCEL UNIQUE "Cas_De_Tests_TunisieBooking.xlsx"
 * 
 * Il est basé sur TOUS les fichiers de tests de la capture (Feature & Unit) :
 *  - AuthTest.php
 *  - AvisApiTest.php
 *  - ChambreApiTest.php
 *  - FavoriApiTest.php
 *  - HotelApiTest.php / HotelTest.php
 *  - ProfilApiTest.php
 *  - ReservationApiTest.php / ReservationAdminTest.php / ReservationTest.php
 *  - DestinationTest.php
 *  - VoyageTest.php
 * ---------------------------------------------------------------------------
 * L'utilisateur/testeur peut facilement lire, modifier les coordonnées (email, password, etc.)
 * et relancer l'exécution via : node reports/run-excel-data-tests.js
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const ExcelJS = require("exceljs");

const OUTPUT_EXCEL = path.resolve(__dirname, "Cas_De_Tests_TunisieBooking.xlsx");

// Tous les cas de test extraits des fichiers PHP (Feature & Unit)
const testCases = [
  // ── 1. Authentification (AuthTest.php) ──────────────────────────────────
  {
    id: "TC-AUTH-001",
    sourceFile: "AuthTest.php",
    domaine: "Authentification",
    action: "Connexion utilisateur Admin avec des identifiants valides",
    methode: "POST",
    endpoint: "/login",
    authRequise: "NON",
    donneesSaisies: JSON.stringify({ email: "admin@gmail.com", password: "admin1234" }, null, 2),
    codeAttendu: 200,
    champVerifier: "token",
  },
  {
    id: "TC-AUTH-002",
    sourceFile: "AuthTest.php",
    domaine: "Authentification",
    action: "Connexion échouée avec un mot de passe incorrect",
    methode: "POST",
    endpoint: "/login",
    authRequise: "NON",
    donneesSaisies: JSON.stringify({ email: "admin@gmail.com", password: "mauvaismotdepasse" }, null, 2),
    codeAttendu: 401,
    champVerifier: "message",
  },
  {
    id: "TC-AUTH-003",
    sourceFile: "AuthTest.php",
    domaine: "Authentification",
    action: "Consultation du profil de l'utilisateur connecté (/me)",
    methode: "GET",
    endpoint: "/me",
    authRequise: "OUI",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "email",
  },

  // ── 2. Hôtels (HotelApiTest.php & HotelTest.php) ─────────────────────────
  {
    id: "TC-HOTEL-001",
    sourceFile: "HotelApiTest.php",
    domaine: "Hôtels",
    action: "Consulter la liste publique de tous les hôtels",
    methode: "GET",
    endpoint: "/hotels",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "nom",
  },
  {
    id: "TC-HOTEL-002",
    sourceFile: "HotelApiTest.php",
    domaine: "Hôtels",
    action: "Consulter la fiche détaillée d'un hôtel existant (ID: 1)",
    methode: "GET",
    endpoint: "/hotels/1",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "nom",
  },
  {
    id: "TC-HOTEL-003",
    sourceFile: "HotelApiTest.php",
    domaine: "Hôtels",
    action: "Consulter un hôtel inexistant (ID: 9999) - Doit retourner 404",
    methode: "GET",
    endpoint: "/hotels/9999",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 404,
    champVerifier: "message",
  },

  // ── 3. Chambres (ChambreApiTest.php) ────────────────────────────────────
  {
    id: "TC-CHAMBRE-001",
    sourceFile: "ChambreApiTest.php",
    domaine: "Chambres",
    action: "Consulter la liste des chambres de l'hôtel 1",
    methode: "GET",
    endpoint: "/hotels/1/chambres",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "type",
  },

  // ── 4. Favoris (FavoriApiTest.php) ──────────────────────────────────────
  {
    id: "TC-FAV-001",
    sourceFile: "FavoriApiTest.php",
    domaine: "Favoris",
    action: "Tenter d'accéder aux favoris sans token -> Doit être refusé",
    methode: "GET",
    endpoint: "/favoris",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 401,
    champVerifier: "message",
  },
  {
    id: "TC-FAV-002",
    sourceFile: "FavoriApiTest.php",
    domaine: "Favoris",
    action: "Consulter ses favoris avec un token valide",
    methode: "GET",
    endpoint: "/favoris",
    authRequise: "OUI",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "array",
  },
  {
    id: "TC-FAV-003",
    sourceFile: "FavoriApiTest.php",
    domaine: "Favoris",
    action: "Ajouter ou retirer l'hôtel 1 de ses favoris (Toggle Cœur)",
    methode: "POST",
    endpoint: "/favoris/1",
    authRequise: "OUI",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "message",
  },

  // ── 5. Réservations (ReservationApiTest.php & ReservationAdminTest.php) ──
  {
    id: "TC-RES-001",
    sourceFile: "ReservationApiTest.php",
    domaine: "Réservations",
    action: "Créer une réservation sans être connecté -> Refus 401",
    methode: "POST",
    endpoint: "/reservations",
    authRequise: "NON",
    donneesSaisies: JSON.stringify({ hotel_id: 1, date_arrivee: "2026-08-10", nb_nuits: 3 }, null, 2),
    codeAttendu: 401,
    champVerifier: "message",
  },
  {
    id: "TC-RES-002",
    sourceFile: "ReservationApiTest.php",
    domaine: "Réservations",
    action: "Créer une réservation avec données manquantes -> Erreur 422",
    methode: "POST",
    endpoint: "/reservations",
    authRequise: "OUI",
    donneesSaisies: JSON.stringify({ hotel_id: 1 }, null, 2),
    codeAttendu: 422,
    champVerifier: "message",
  },
  {
    id: "TC-RES-003",
    sourceFile: "ReservationApiTest.php",
    domaine: "Réservations",
    action: "Consulter la liste de ses propres réservations",
    methode: "GET",
    endpoint: "/reservations",
    authRequise: "OUI",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "array",
  },

  // ── 6. Avis (AvisApiTest.php) ───────────────────────────────────────────
  {
    id: "TC-AVIS-001",
    sourceFile: "AvisApiTest.php",
    domaine: "Avis",
    action: "Consulter les avis de l'hôtel 1 (peut être vide)",
    methode: "GET",
    endpoint: "/hotels/1/avis",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "count",
  },

  // ── 7. Destinations & Voyages (DestinationTest.php & VoyageTest.php) ────
  {
    id: "TC-DEST-001",
    sourceFile: "DestinationTest.php",
    domaine: "Destinations",
    action: "Consulter la liste publique des destinations",
    methode: "GET",
    endpoint: "/destinations",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "nom",
  },
  {
    id: "TC-VOY-001",
    sourceFile: "VoyageTest.php",
    domaine: "Voyages",
    action: "Consulter la liste des voyages à l'étranger",
    methode: "GET",
    endpoint: "/voyages",
    authRequise: "NON",
    donneesSaisies: "",
    codeAttendu: 200,
    champVerifier: "nom",
  },
];

async function generateSingleExcel() {
  console.log("==========================================================");
  console.log(" 📝 GÉNÉRATION DU FICHIER EXCEL UNIQUE DE CAS DE TESTS");
  console.log("==========================================================");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cas_De_Tests");

  // En-têtes clairs pour l'utilisateur / testeur
  sheet.columns = [
    { header: "ID Test",            key: "id",            width: 15 },
    { header: "Test PHP Source",    key: "sourceFile",    width: 22 },
    { header: "Domaine Métier",     key: "domaine",       width: 18 },
    { header: "Action Utilisateur / Scénario", key: "action", width: 45 },
    { header: "Méthode HTTP",       key: "methode",       width: 14 },
    { header: "Endpoint API",       key: "endpoint",      width: 28 },
    { header: "Authentification",   key: "authRequise",   width: 16 },
    { header: "Données Saisies (Email, Mdp, Params...)", key: "donneesSaisies", width: 45 },
    { header: "Code HTTP Attendu",  key: "codeAttendu",   width: 18 },
    { header: "Champ de Réponse Attendu", key: "champVerifier", width: 25 },
    { header: "Code HTTP Obtenu",   key: "statutObtenu",  width: 18 },
    { header: "Réponse API Obtenue", key: "reponseAPI",   width: 45 },
    { header: "Résultat Final",     key: "resultat",      width: 16 },
    { header: "Temps (ms)",         key: "tempsMs",       width: 14 },
  ];

  // Style du header
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A1A2E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  // Insérer chaque cas de test
  testCases.forEach((tc) => {
    const row = sheet.addRow({
      id: tc.id,
      sourceFile: tc.sourceFile,
      domaine: tc.domaine,
      action: tc.action,
      methode: tc.methode,
      endpoint: tc.endpoint,
      authRequise: tc.authRequise,
      donneesSaisies: tc.donneesSaisies,
      codeAttendu: tc.codeAttendu,
      champVerifier: tc.champVerifier,
      statutObtenu: "",
      reponseAPI: "",
      resultat: "Non exécuté",
      tempsMs: "",
    });

    row.height = 30;
    row.getCell(1).font = { bold: true };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(7).alignment = { horizontal: "center" };
    row.getCell(9).alignment = { horizontal: "center" };
  });

  await workbook.xlsx.writeFile(OUTPUT_EXCEL);

  console.log(`✅ Fichier unique généré avec succès : ${OUTPUT_EXCEL}`);
  console.log(`📊 Nombre de cas de tests intégrés : ${testCases.length}`);
  console.log("==========================================================\n");
}

generateSingleExcel().catch(console.error);
