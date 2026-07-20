/**
 * verifier-donnees-excel.js
 * Lit le fichier Excel "reports/rapport-tests.xlsx", valide chaque ligne par rapport à la base de données réelle (via get-db-hotels.php),
 * et met à jour la colonne "Statut" directement dans l'Excel.
 * Usage: node reports/verifier-donnees-excel.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const XLS_PATH = path.join(__dirname, 'rapport-tests.xlsx');
const CSV_PATH = path.join(__dirname, 'rapport-tests.csv');
const PHP_HELPER = path.join(__dirname, '..', 'server', 'get-db-hotels.php');

// ─── 1. Créer le template Excel initial s'il n'existe pas ─────────────────────
function createInitialTemplate() {
  console.log('📝 Création du template Excel initial...');
  const templateRows = [
    {
      'ID': 'T-01',
      'Nom Hôtel': 'El Mouradi El Menzah',
      'Région': 'Hammamet',
      'Description': 'Yasmine Hammamet, cet hôtel propose un hébergement confortable',
      'Résultat Attendu': 'Doit correspondre exactement en base',
      'Statut': 'A tester'
    },
    {
      'ID': 'T-02',
      'Nom Hôtel': 'The Orangers Garden Villa & Bungalows',
      'Région': 'Hammamet',
      'Description': 'entouré de jardins d\'orangers avec un accès direct à une plage privée',
      'Résultat Attendu': 'Doit correspondre exactement en base',
      'Statut': 'A tester'
    },
    {
      'ID': 'T-03',
      'Nom Hôtel': 'Hasdrubal Prestige Thalassa & Spa Djerba',
      'Région': 'Djerba',
      'Description': 'Sidi Mehrez, réputé pour son centre de thalassothérapie',
      'Résultat Attendu': 'Doit correspondre exactement en base',
      'Statut': 'A tester'
    },
    {
      'ID': 'T-04',
      'Nom Hôtel': 'Djerba Plaza Thalasso & Spa',
      'Région': 'Djerba',
      'Description': 'architecture traditionnelle djerbienne et confort moderne',
      'Résultat Attendu': 'Doit correspondre exactement en base',
      'Statut': 'A tester'
    },
    {
      'ID': 'T-05',
      'Nom Hôtel': 'Mövenpick Resort & Marine Spa Sousse',
      'Région': 'Sousse',
      'Description': 'centre de Sousse, avec une plage de sable fin privée',
      'Résultat Attendu': 'Doit correspondre exactement en base',
      'Statut': 'A tester'
    }
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 10 }, { wch: 38 }, { wch: 15 },
    { wch: 60 }, { wch: 35 }, { wch: 15 }
  ];
  xlsx.utils.book_append_sheet(wb, ws, 'Tests Données');
  xlsx.writeFile(wb, XLS_PATH);
}

if (!fs.existsSync(XLS_PATH)) {
  createInitialTemplate();
}

// ─── 2. Charger les données du fichier Excel ──────────────────────────────────
console.log('📖 Lecture du fichier Excel...');
const workbook = xlsx.readFile(XLS_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const excelData = xlsx.utils.sheet_to_json(worksheet);

// ─── 3. Récupérer les données réelles de la BDD (Railway) ──────────────────────
console.log('📥 Récupération des données réelles de la base...');
let dbHotels = [];
try {
  const jsonOut = execSync(`php "${PHP_HELPER}"`, { encoding: 'utf-8' });
  dbHotels = JSON.parse(jsonOut);
  if (dbHotels.error) {
    console.error('❌ Erreur de base de données:', dbHotels.error);
    process.exit(1);
  }
  console.log(`   ${dbHotels.length} hôtels récupérés de la base.`);
} catch (e) {
  console.error('❌ Impossible de lancer le helper PHP:', e.message);
  process.exit(1);
}

// ─── 4. Comparer les lignes de l'Excel avec la BDD ──────────────────────────────
console.log('🔍 Validation des cas de tests définis dans l\'Excel...');
const updatedRows = excelData.map(row => {
  const hotelNom = row['Nom Hôtel'] || '';
  const expectedRegion = row['Région'] || '';
  const expectedDesc = row['Description'] || '';

  // Trouver l'hôtel dans la BDD
  const dbHotel = dbHotels.find(h => h.nom.trim().toLowerCase() === hotelNom.trim().toLowerCase());

  if (!dbHotel) {
    row['Statut'] = 'FAIL (Hôtel introuvable)';
    return row;
  }

  // Vérifier la région (Destination) et la description (sous-chaîne)
  const regionMatch = dbHotel.region.trim().toLowerCase() === expectedRegion.trim().toLowerCase();
  const descMatch   = dbHotel.description.toLowerCase().includes(expectedDesc.trim().toLowerCase());

  if (regionMatch && descMatch) {
    row['Statut'] = 'PASS';
  } else {
    let details = [];
    if (!regionMatch) details.push(`Région attendue: "${expectedRegion}" vs réelle: "${dbHotel.region}"`);
    if (!descMatch) details.push('La description ne correspond pas');
    row['Statut'] = `FAIL (${details.join(', ')})`;
  }

  return row;
});

// ─── 5. Enregistrer les résultats mis à jour ──────────────────────────────────
console.log('💾 Enregistrement des résultats...');
const newWs = xlsx.utils.json_to_sheet(updatedRows);
newWs['!cols'] = [
  { wch: 10 }, { wch: 38 }, { wch: 15 },
  { wch: 60 }, { wch: 35 }, { wch: 15 }
];

const newWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWb, newWs, sheetName);

try {
  xlsx.writeFile(newWb, XLS_PATH);
  console.log(`✅ Fichier Excel mis à jour : ${XLS_PATH}`);
} catch (e) {
  if (e.code === 'EBUSY') {
    console.error('❌ Erreur : Le fichier Excel est ouvert et verrouillé. Fermez-le et relancez.');
  } else {
    console.error('❌ Erreur d\'écriture Excel :', e.message);
  }
}

// Mettre à jour également le CSV
try {
  const csvContent = xlsx.utils.sheet_to_csv(newWs);
  fs.writeFileSync(CSV_PATH, csvContent, 'utf-8');
  console.log(`✅ Fichier CSV mis à jour : ${CSV_PATH}`);
} catch (e) {
  console.error('❌ Erreur d\'écriture CSV :', e.message);
}
