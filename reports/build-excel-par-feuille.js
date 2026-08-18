/**
 * build-excel-par-feuille.js
 * ──────────────────────────────────────────────────────────────────────────
 * Génère "TunisieBooking_Tests.xlsx" avec UNE FEUILLE PAR FICHIER DE TEST :
 *
 *   1. Auth          ← AuthTest.php
 *   2. Hotels        ← HotelApiTest.php
 *   3. Chambres      ← ChambreApiTest.php
 *   4. Favoris       ← FavoriApiTest.php
 *   5. Reservations  ← ReservationApiTest.php
 *   6. Avis          ← AvisApiTest.php
 *   7. Destinations  ← DestinationTest.php
 *   8. Voyages       ← VoyageTest.php
 *
 * Colonnes communes à toutes les feuilles :
 *   ID | Description | Méthode | Endpoint | Auth | Données (JSON) |
 *   Code Attendu | Code Obtenu | Résultat | Durée (ms) | Détails Réponse
 *
 * Lancer :  node reports/build-excel-par-feuille.js
 * Tester :  node reports/run-excel-par-feuille.js
 * ──────────────────────────────────────────────────────────────────────────
 */

const path    = require("path");
const ExcelJS = require("exceljs");

const OUTPUT = path.resolve(__dirname, "TunisieBooking_Tests.xlsx");

// ─── Couleurs par feuille ─────────────────────────────────────────────────
const SHEET_COLORS = {
  Auth:         { header: "16213E", tab: "E8375A" },
  Hotels:       { header: "1B4332", tab: "52B788" },
  Chambres:     { header: "1D3557", tab: "457B9D" },
  Favoris:      { header: "4A0E8F", tab: "9B59B6" },
  Reservations: { header: "7F3300", tab: "E67E22" },
  Avis:         { header: "1A3A4A", tab: "17A589" },
  Destinations: { header: "2D2D2D", tab: "95A5A6" },
  Voyages:      { header: "0B3954", tab: "2980B9" },
};

// ─── Colonnes communes ────────────────────────────────────────────────────
const COLUMNS = [
  { header: "ID",               key: "id",           width: 16  },
  { header: "Description",      key: "description",  width: 48  },
  { header: "Méthode",          key: "methode",      width: 10  },
  { header: "Endpoint",         key: "endpoint",     width: 32  },
  { header: "Auth requise",     key: "auth",         width: 13  },
  { header: "Données (JSON)",   key: "donnees",      width: 50  },
  { header: "Code attendu",     key: "codeAttendu",  width: 14  },
  { header: "Code obtenu",      key: "codeObtenu",   width: 13  },
  { header: "Résultat",         key: "resultat",     width: 12  },
  { header: "Durée (ms)",       key: "duree",        width: 12  },
  { header: "Détails réponse",  key: "details",      width: 55  },
];

// ─── Données de test par feuille ──────────────────────────────────────────

const SHEETS = [
  // ════════════════════════════════════════════════════════════════════════
  // 1. AUTH  (AuthTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Auth",
    sourceFile: "AuthTest.php",
    rows: [
      {
        id: "TC-AUTH-001",
        description: "Connexion admin valide → token retourné",
        methode: "POST",
        endpoint: "/login",
        auth: "NON",
        donnees: JSON.stringify({ email: "admin@gmail.com", password: "admin1234" }),
        codeAttendu: 200,
        _check: "token",
      },
      {
        id: "TC-AUTH-002",
        description: "Connexion avec mauvais mot de passe → 401 Unauthorized",
        methode: "POST",
        endpoint: "/login",
        auth: "NON",
        donnees: JSON.stringify({ email: "admin@gmail.com", password: "MauvaisMotDePasse!" }),
        codeAttendu: 401,
        _check: "message",
      },
      {
        id: "TC-AUTH-003",
        description: "Connexion avec email inexistant → 401",
        methode: "POST",
        endpoint: "/login",
        auth: "NON",
        donnees: JSON.stringify({ email: "inconnu@test.com", password: "admin1234" }),
        codeAttendu: 401,
        _check: "message",
      },
      {
        id: "TC-AUTH-004",
        description: "Consulter son profil /me (token valide) → données utilisateur",
        methode: "GET",
        endpoint: "/me",
        auth: "OUI",
        donnees: "",
        codeAttendu: 200,
        _check: "email",
      },
      {
        id: "TC-AUTH-005",
        description: "Consulter /me sans token → 401 Unauthorized",
        methode: "GET",
        endpoint: "/me",
        auth: "NON",
        donnees: "",
        codeAttendu: 401,
        _check: "message",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 2. HOTELS  (HotelApiTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Hotels",
    sourceFile: "HotelApiTest.php",
    rows: [
      {
        id: "TC-HOTEL-001",
        description: "Lister tous les hôtels (public) → tableau d'hôtels",
        methode: "GET",
        endpoint: "/hotels",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
      {
        id: "TC-HOTEL-002",
        description: "Détail hôtel ID=1 (public) → fiche hôtel",
        methode: "GET",
        endpoint: "/hotels/1",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "nom",
      },
      {
        id: "TC-HOTEL-003",
        description: "Détail hôtel inexistant ID=9999 → 404 Not Found",
        methode: "GET",
        endpoint: "/hotels/9999",
        auth: "NON",
        donnees: "",
        codeAttendu: 404,
        _check: "message",
      },
      {
        id: "TC-HOTEL-004",
        description: "Rechercher les hôtels de Tunis (filtre destination)",
        methode: "GET",
        endpoint: "/hotels?destination=Tunis",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 3. CHAMBRES  (ChambreApiTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Chambres",
    sourceFile: "ChambreApiTest.php",
    rows: [
      {
        id: "TC-CHAMBRE-001",
        description: "Lister les chambres de l'hôtel 1 (public) → tableau",
        methode: "GET",
        endpoint: "/hotels/1/chambres",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
      {
        id: "TC-CHAMBRE-002",
        description: "Lister les chambres d'un hôtel inexistant ID=9999 → 404",
        methode: "GET",
        endpoint: "/hotels/9999/chambres",
        auth: "NON",
        donnees: "",
        codeAttendu: 404,
        _check: "message",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 4. FAVORIS  (FavoriApiTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Favoris",
    sourceFile: "FavoriApiTest.php",
    rows: [
      {
        id: "TC-FAV-001",
        description: "Accéder aux favoris sans token → 401 Unauthorized",
        methode: "GET",
        endpoint: "/favoris",
        auth: "NON",
        donnees: "",
        codeAttendu: 401,
        _check: "message",
      },
      {
        id: "TC-FAV-002",
        description: "Lister ses favoris (token valide) → tableau (peut être vide)",
        methode: "GET",
        endpoint: "/favoris",
        auth: "OUI",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
      {
        id: "TC-FAV-003",
        description: "Ajouter/retirer l'hôtel ID=1 des favoris (toggle)",
        methode: "POST",
        endpoint: "/favoris/1",
        auth: "OUI",
        donnees: "",
        codeAttendu: 200,
        _check: "message",
      },
      {
        id: "TC-FAV-004",
        description: "Toggle favori hôtel inexistant ID=9999 → 404",
        methode: "POST",
        endpoint: "/favoris/9999",
        auth: "OUI",
        donnees: "",
        codeAttendu: 404,
        _check: "message",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 5. RÉSERVATIONS  (ReservationApiTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Reservations",
    sourceFile: "ReservationApiTest.php",
    rows: [
      {
        id: "TC-RES-001",
        description: "Créer une réservation sans token → 401 Unauthorized",
        methode: "POST",
        endpoint: "/reservations",
        auth: "NON",
        donnees: JSON.stringify({
          hotel_id: 1,
          chambre_type: "double",
          date_arrivee: "2026-09-01",
          date_depart: "2026-09-05",
          nb_adultes: 2,
          nb_enfants: 0,
        }),
        codeAttendu: 401,
        _check: "message",
      },
      {
        id: "TC-RES-002",
        description: "Créer une réservation avec données manquantes → 422 Unprocessable",
        methode: "POST",
        endpoint: "/reservations",
        auth: "OUI",
        donnees: JSON.stringify({ hotel_id: 1 }),
        codeAttendu: 422,
        _check: "message",
      },
      {
        id: "TC-RES-003",
        description: "Lister ses propres réservations (token valide) → tableau",
        methode: "GET",
        endpoint: "/reservations",
        auth: "OUI",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 6. AVIS  (AvisApiTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Avis",
    sourceFile: "AvisApiTest.php",
    rows: [
      {
        id: "TC-AVIS-001",
        description: "Lister les avis de l'hôtel 1 (public) → {count, avis:[]}",
        methode: "GET",
        endpoint: "/hotels/1/avis",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "count",
      },
      {
        id: "TC-AVIS-002",
        description: "Lister les avis d'un hôtel inexistant → 404",
        methode: "GET",
        endpoint: "/hotels/9999/avis",
        auth: "NON",
        donnees: "",
        codeAttendu: 404,
        _check: "message",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 7. DESTINATIONS  (DestinationTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Destinations",
    sourceFile: "DestinationTest.php",
    rows: [
      {
        id: "TC-DEST-001",
        description: "Lister toutes les destinations (public) → tableau",
        methode: "GET",
        endpoint: "/destinations",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 8. VOYAGES  (VoyageTest.php)
  // ════════════════════════════════════════════════════════════════════════
  {
    name: "Voyages",
    sourceFile: "VoyageTest.php",
    rows: [
      {
        id: "TC-VOY-001",
        description: "Lister tous les voyages (public) → tableau",
        methode: "GET",
        endpoint: "/voyages",
        auth: "NON",
        donnees: "",
        codeAttendu: 200,
        _check: "array",
      },
    ],
  },
];

// ─── Helper style ─────────────────────────────────────────────────────────
function styleHeader(row, color) {
  row.height = 32;
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFF" }, size: 11, name: "Calibri" };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border    = {
      bottom: { style: "medium", color: { argb: "FFFFFF" } },
      right:  { style: "thin",   color: { argb: "AAAAAA" } },
    };
  });
}

function styleDataRow(row, idx) {
  const bg = idx % 2 === 0 ? "F9FAFB" : "FFFFFF";
  row.height = 26;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.alignment = { vertical: "middle", wrapText: false };
    cell.border    = { bottom: { style: "thin", color: { argb: "E0E0E0" } } };
    cell.font      = { name: "Calibri", size: 10 };
  });
  // centrer colonnes fixes
  [3, 5, 7, 8, 9, 10].forEach(col => {
    row.getCell(col).alignment = { vertical: "middle", horizontal: "center" };
  });
  // Méthode en gras
  row.getCell(3).font = { bold: true, size: 10, name: "Calibri" };
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function build() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  📊 GÉNÉRATION : TunisieBooking_Tests.xlsx");
  console.log("  📁 Une feuille par fichier de test PHP");
  console.log("══════════════════════════════════════════════════════════");

  const wb = new ExcelJS.Workbook();
  wb.creator  = "TunisieBooking QA";
  wb.created  = new Date();
  wb.modified = new Date();

  let totalRows = 0;

  for (const sheetDef of SHEETS) {
    const colors = SHEET_COLORS[sheetDef.name] || { header: "333333", tab: "888888" };
    const ws = wb.addWorksheet(sheetDef.name, {
      properties: { tabColor: { argb: colors.tab } },
    });

    // Colonnes
    ws.columns = COLUMNS;

    // Titre de feuille (ligne 1 fusionnée)
    ws.mergeCells(1, 1, 1, COLUMNS.length);
    const titleCell = ws.getCell("A1");
    titleCell.value = `📂 ${sheetDef.name.toUpperCase()}  —  Source : ${sheetDef.sourceFile}`;
    titleCell.font  = { bold: true, size: 13, color: { argb: "FFFFFF" }, name: "Calibri" };
    titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: colors.header } };
    titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(1).height = 34;

    // En-têtes (ligne 2)
    const headerRow = ws.addRow(COLUMNS.map(c => c.header));
    styleHeader(headerRow, colors.header);

    // Données
    sheetDef.rows.forEach((r, idx) => {
      const row = ws.addRow([
        r.id,
        r.description,
        r.methode,
        r.endpoint,
        r.auth,
        r.donnees,
        r.codeAttendu,
        "",          // Code obtenu  → rempli par le runner
        "⏳ En attente",  // Résultat
        "",          // Durée
        "",          // Détails
      ]);
      styleDataRow(row, idx);
      // stocker la clé de vérification dans une cellule cachée (col 12 = colonne L)
      row.getCell(12).value = r._check || "";
      row.getCell(12).font  = { color: { argb: "FFFFFF" }, size: 1 };
      totalRows++;
    });

    // Figer la ligne d'en-tête
    ws.views = [{ state: "frozen", ySplit: 2 }];

    console.log(`  ✅ Feuille "${sheetDef.name}" → ${sheetDef.rows.length} cas de test  (${sheetDef.sourceFile})`);
  }

  await wb.xlsx.writeFile(OUTPUT);

  console.log("──────────────────────────────────────────────────────────");
  console.log(`  💾 Fichier généré : ${OUTPUT}`);
  console.log(`  📊 Total         : ${totalRows} cas de tests`);
  console.log(`  📋 Feuilles      : ${SHEETS.length}`);
  console.log("══════════════════════════════════════════════════════════\n");
}

build().catch(console.error);
