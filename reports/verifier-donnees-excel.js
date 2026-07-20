/**
 * verifier-donnees-excel.js
 * Script complet qui :
 * 1. Lance les tests PHPUnit locaux pour mettre à jour le fichier XML de rapport (phpunit-report.xml).
 * 2. Extrait dynamiquement tous les cas de tests existant dans les fichiers de code (server/tests/Feature & Unit) avec leurs descriptions et assertions attendues.
 * 3. Valide les onglets de données fonctionnelles (Fiche Hôtels, Calculs Tarifs, Stocks Chambres) en direct sur la base de données.
 * 4. Met à jour et formate l'ensemble dans "reports/rapport-tests.xlsx" (multi-onglets).
 * Usage: node reports/verifier-donnees-excel.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const XLS_PATH = path.join(__dirname, 'rapport-tests.xlsx');
const CSV_PATH = path.join(__dirname, 'rapport-tests.csv');
const PHP_HELPER = path.join(__dirname, '..', 'server', 'get-db-details.php');
const PHP_TESTS_DIR = path.join(__dirname, '..', 'server', 'tests');
const PHPUNIT_XML = path.join(__dirname, 'phpunit-report.xml');

// ─── 1. Exécuter les tests locaux pour obtenir le XML à jour ──────────────────
console.log('🚀 Exécution de PHPUnit pour mettre à jour les statuts de tests...');
try {
  execSync(
    `php artisan test --log-junit "${PHPUNIT_XML}" --env=testing`,
    { cwd: path.join(__dirname, '..', 'server'), stdio: 'pipe' }
  );
  console.log('   Rapport de tests XML mis à jour.');
} catch (e) {
  // PHPUnit retourne un code d'erreur si un test échoue, on continue quand même pour exporter l'erreur
  console.log('   Certains tests ont échoué, les détails seront rapportés.');
}

// ─── 2. Parser le XML de rapports PHPUnit ─────────────────────────────────────
const testResultsMap = new Map();
if (fs.existsSync(PHPUNIT_XML)) {
  const xmlContent = fs.readFileSync(PHPUNIT_XML, 'utf-8');
  const tcRegex = /<testcase([^>]*)>([\s\S]*?)<\/testcase>|<testcase([^\/]*?)\/>/g;
  let m;
  while ((m = tcRegex.exec(xmlContent)) !== null) {
    const attrs  = m[1] || m[3];
    const inner  = m[2] || '';
    const name   = (attrs.match(/name="([^"]*)"/) || [])[1] || '';
    const time   = parseFloat((attrs.match(/time="([^"]*)"/) || [])[1] || 0).toFixed(3);
    const failed = /<failure|<error/.test(inner);
    const msg    = failed
      ? (inner.match(/<(?:failure|error)[^>]*>([\s\S]*?)<\/(?:failure|error)>/) || [])[1]?.trim().slice(0, 150) || ''
      : '';
    testResultsMap.set(name, { statut: failed ? 'FAIL' : 'PASS', time, msg });
  }
}

// ─── 3. Extraire dynamiquement les tests depuis le code source ───────────────
console.log('📖 Extraction des cas de tests depuis les fichiers de code...');
function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.name.endsWith('Test.php')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractTestsFromFiles() {
  const files = walkDir(PHP_TESTS_DIR);
  const extractedTests = [];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Regex pour capturer les méthodes de test
    const methodRegex = /public\s+function\s+(test_[a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{([\s\S]*?)\}/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const body = match[2];

      // Formater un titre lisible à partir du nom de la méthode
      const humanTitle = methodName
        .replace(/^test_/, '')
        .replace(/_/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());

      // Analyser sommairement le résultat attendu
      let expected = 'Exécution correcte';
      if (body.includes('assertStatus(200)')) expected = 'Retourne HTTP 200 (OK)';
      else if (body.includes('assertStatus(201)')) expected = 'Retourne HTTP 201 (Créé)';
      else if (body.includes('assertStatus(401)')) expected = 'Retourne HTTP 401 (Non authentifié)';
      else if (body.includes('assertStatus(403)')) expected = 'Retourne HTTP 403 (Interdit)';
      else if (body.includes('assertStatus(422)')) expected = 'Retourne HTTP 422 (Erreur validation)';
      else if (body.includes('assertStatus(404)')) expected = 'Retourne HTTP 404 (Introuvable)';
      else if (body.includes('assertDatabaseHas')) expected = 'Données écrites en base de données';
      else if (body.includes('assertDatabaseMissing')) expected = 'Données supprimées ou absentes';

      const runResult = testResultsMap.get(methodName) || { statut: 'Non exécuté', time: '—', msg: '' };

      extractedTests.push({
        'ID': `AUT-${extractedTests.length + 1}`,
        'Fichier / Module': fileName,
        'Titre du Test': humanTitle,
        'Code d\'Assertion': methodName,
        'Résultat Attendu': expected,
        'Statut': runResult.statut,
        'Durée (s)': runResult.time,
        'Détail Erreur': runResult.msg
      });
    }
  }
  return extractedTests;
}

const extractedCodeTests = extractTestsFromFiles();
console.log(`   ${extractedCodeTests.length} cas de tests extraits du code.`);

// ─── 4. Récupérer les données réelles de la base (Railway) pour la validation 
console.log('📥 Récupération des données d\'hôtels de la base...');
let dbHotels = [];
try {
  const jsonOut = execSync(`php "${PHP_HELPER}"`, { encoding: 'utf-8' });
  dbHotels = JSON.parse(jsonOut);
  if (dbHotels.error) {
    console.error('❌ Erreur de base de données:', dbHotels.error);
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Impossible de charger les détails de la base (Railway) :', e.message);
  process.exit(1);
}

// ─── 5. Initialiser les onglets de données fonctionnelles si besoin ──────────
function getSheetData(workbook, sheetName, defaultRows) {
  if (workbook.Sheets[sheetName]) {
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
  return defaultRows;
}

let workbook;
if (fs.existsSync(XLS_PATH)) {
  workbook = xlsx.readFile(XLS_PATH);
} else {
  workbook = xlsx.utils.book_new();
}

const defaultSheet1 = [
  { 'ID': 'T-01', 'Nom Hôtel': 'El Mouradi El Menzah', 'Région': 'Hammamet', 'Description': 'Yasmine Hammamet, cet hôtel propose un hébergement confortable', 'Statut': 'A tester' },
  { 'ID': 'T-02', 'Nom Hôtel': 'The Orangers Garden Villa & Bungalows', 'Région': 'Hammamet', 'Description': 'entouré de jardins d\'orangers avec un accès direct à une plage privée', 'Statut': 'A tester' },
  { 'ID': 'T-03', 'Nom Hôtel': 'Hasdrubal Prestige Thalassa & Spa Djerba', 'Région': 'Djerba', 'Description': 'Sidi Mehrez, réputé pour son centre de thalassothérapie', 'Statut': 'A tester' },
  { 'ID': 'T-04', 'Nom Hôtel': 'Djerba Plaza Thalasso & Spa', 'Région': 'Djerba', 'Description': 'architecture traditionnelle djerbienne et confort moderne', 'Statut': 'A tester' },
  { 'ID': 'T-05', 'Nom Hôtel': 'Mövenpick Resort & Marine Spa Sousse', 'Région': 'Sousse', 'Description': 'centre de Sousse, avec une plage de sable fin privée', 'Statut': 'A tester' }
];

const defaultSheet2 = [
  { 'ID': 'C-01', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Single Standard', 'Pension': 'Petit Déjeuner', 'Nuits': 1, 'Ages Enfants': '', 'Prix Attendu': 96, 'Statut': 'A tester', 'Prix Réel': '' },
  { 'ID': 'C-02', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Single Standard', 'Pension': 'Demi Pension', 'Nuits': 3, 'Ages Enfants': '', 'Prix Attendu': 408, 'Statut': 'A tester', 'Prix Réel': '' },
  { 'ID': 'C-03', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Double Standard', 'Pension': 'All Inclusive', 'Nuits': 2, 'Ages Enfants': '14', 'Prix Attendu': 540, 'Statut': 'A tester', 'Prix Réel': '' },
  { 'ID': 'C-04', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Double Standard', 'Pension': 'Petit Déjeuner', 'Nuits': 2, 'Ages Enfants': '8', 'Prix Attendu': 300, 'Statut': 'A tester', 'Prix Réel': '' },
  { 'ID': 'C-05', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Double Standard', 'Pension': 'Petit Déjeuner', 'Nuits': 2, 'Ages Enfants': '1', 'Prix Attendu': 240, 'Statut': 'A tester', 'Prix Réel': '' }
];

const defaultSheet3 = [
  { 'ID': 'Q-01', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Single Standard', 'Quantité Attendue': 8, 'Statut': 'A tester', 'Quantité Réelle': '' },
  { 'ID': 'Q-02', 'Nom Hôtel': 'El Mouradi El Menzah', 'Chambre': 'Chambre Single Vue Piscine', 'Quantité Attendue': 5, 'Statut': 'A tester', 'Quantité Réelle': '' },
  { 'ID': 'Q-03', 'Nom Hôtel': 'The Orangers Garden Villa & Bungalows', 'Chambre': 'Chambre Double Standard', 'Quantité Attendue': 12, 'Statut': 'A tester', 'Quantité Réelle': '' }
];

// ─── 6. Exécuter la validation des fiches fonctionnelles ──────────────────────
console.log('🔍 Validation des Hôtels, Tarifs et Stocks...');

// Onglet 1
const sheet1Rows = getSheetData(workbook, 'Fiche Hôtels', defaultSheet1).map(row => {
  const hotelNom = (row['Nom Hôtel'] || '').trim();
  const expectedRegion = (row['Région'] || '').trim();
  const expectedDesc = (row['Description'] || '').trim();
  const dbHotel = dbHotels.find(h => h.nom.toLowerCase() === hotelNom.toLowerCase());
  if (!dbHotel) { row['Statut'] = 'FAIL (Introuvable)'; return row; }
  const regionMatch = dbHotel.region.toLowerCase() === expectedRegion.toLowerCase();
  const descMatch = dbHotel.description.toLowerCase().includes(expectedDesc.toLowerCase());
  row['Statut'] = (regionMatch && descMatch) ? 'PASS' : 'FAIL';
  return row;
});

// Onglet 2
const sheet2Rows = getSheetData(workbook, 'Calculs Tarifs', defaultSheet2).map(row => {
  const hotelNom = (row['Nom Hôtel'] || '').trim();
  const chambreNom = (row['Chambre'] || '').trim();
  const pensionNom = (row['Pension'] || '').trim();
  const nuits = parseInt(row['Nuits'] || 0);
  const agesStr = String(row['Ages Enfants'] || '').trim();
  const expectedPrix = parseFloat(row['Prix Attendu'] || 0);

  const dbHotel = dbHotels.find(h => h.nom.toLowerCase() === hotelNom.toLowerCase());
  if (!dbHotel) { row['Statut'] = 'FAIL (Hôtel introuvable)'; return row; }
  const dbChambre = dbHotel.chambres.find(c => c.nom.toLowerCase() === chambreNom.toLowerCase());
  if (!dbChambre) { row['Statut'] = 'FAIL (Chambre introuvable)'; return row; }
  const dbPension = dbChambre.pensions.find(p => p.nom.toLowerCase() === pensionNom.toLowerCase());
  if (!dbPension) { row['Statut'] = 'FAIL (Pension introuvable)'; return row; }

  let supplementEnfants = 0;
  if (agesStr) {
    agesStr.split(',').map(a => parseInt(a.trim())).forEach(age => {
      if (age >= 12) supplementEnfants += 50;
      else if (age >= 2) supplementEnfants += 30;
    });
  }

  const prixReel = (dbChambre.prix_base_nuit + dbPension.supplement_prix + supplementEnfants) * nuits;
  row['Prix Réel'] = prixReel;
  row['Statut'] = Math.abs(prixReel - expectedPrix) < 0.01 ? 'PASS' : `FAIL (${prixReel} DT)`;
  return row;
});

// Onglet 3
const sheet3Rows = getSheetData(workbook, 'Stocks Chambres', defaultSheet3).map(row => {
  const hotelNom = (row['Nom Hôtel'] || '').trim();
  const chambreNom = (row['Chambre'] || '').trim();
  const expectedQty = parseInt(row['Quantité Attendue'] || 0);

  const dbHotel = dbHotels.find(h => h.nom.toLowerCase() === hotelNom.toLowerCase());
  if (!dbHotel) { row['Statut'] = 'FAIL (Hôtel introuvable)'; return row; }
  const dbChambre = dbHotel.chambres.find(c => c.nom.toLowerCase() === chambreNom.toLowerCase());
  if (!dbChambre) { row['Statut'] = 'FAIL (Chambre introuvable)'; return row; }

  row['Quantité Réelle'] = dbChambre.quantite;
  row['Statut'] = dbChambre.quantite === expectedQty ? 'PASS' : `FAIL (${dbChambre.quantite})`;
  return row;
});

// ─── 7. Enregistrer toutes les feuilles dans le fichier Excel ─────────────────
const newWb = xlsx.utils.book_new();

// Ajouter l'onglet des tests automatiques extraits du code
const wsAut = xlsx.utils.json_to_sheet(extractedCodeTests);
wsAut['!cols'] = [
  { wch: 8 }, { wch: 24 }, { wch: 45 },
  { wch: 55 }, { wch: 45 }, { wch: 10 },
  { wch: 12 }, { wch: 40 }
];
xlsx.utils.book_append_sheet(newWb, wsAut, 'Tests Automatiques PHPUnit');

// Ajouter les onglets fonctionnels
const ws1 = xlsx.utils.json_to_sheet(sheet1Rows);
ws1['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 15 }, { wch: 60 }, { wch: 15 }];
xlsx.utils.book_append_sheet(newWb, ws1, 'Fiche Hôtels');

const ws2 = xlsx.utils.json_to_sheet(sheet2Rows);
ws2['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
xlsx.utils.book_append_sheet(newWb, ws2, 'Calculs Tarifs');

const ws3 = xlsx.utils.json_to_sheet(sheet3Rows);
ws3['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
xlsx.utils.book_append_sheet(newWb, ws3, 'Stocks Chambres');

try {
  xlsx.writeFile(newWb, XLS_PATH);
  console.log(`\n🎉 Rapport Excel synchronisé avec succès : ${XLS_PATH}`);
} catch (e) {
  if (e.code === 'EBUSY') {
    console.error('\n❌ Erreur : Le fichier Excel est ouvert. Fermez-le et relancez.');
  } else {
    console.error('\n❌ Erreur d\'écriture Excel :', e.message);
  }
}

// Mettre à jour également le CSV pour le premier onglet
try {
  const csvContent = xlsx.utils.sheet_to_csv(wsAut);
  fs.writeFileSync(CSV_PATH, csvContent, 'utf-8');
  console.log(`✅ Fichier CSV mis à jour : ${CSV_PATH}`);
} catch (e) {
  console.error('❌ Erreur d\'écriture CSV :', e.message);
}
