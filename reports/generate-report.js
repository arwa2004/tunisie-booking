/**
 * generate-report.js
 * ---------------------------------------------------------------------------
 * Génère reports/rapport-tests.xlsx avec, pour chaque domaine :
 *
 *   - Feuilles "DB vs API"  (Hôtels, Chambres, Pensions)
 *     -> Données réelles issues de server/get-db-details.php (vérité DB)
 *        comparées à ce que l'API renvoie vraiment (GET /hotels, etc.)
 *
 *   - Feuilles "Tests unitaires" (une par fichier tests/Unit/*.php)
 *     -> Chaque méthode de test est extraite (inputs + valeur attendue)
 *        et croisée avec le VRAI résultat PHPUnit (JUnit XML), donc
 *        aucun statut n'est inventé : PASS/FAIL vient de PHPUnit lui-même.
 *
 * ---------------------------------------------------------------------------
 * CONFIGURATION — adapte ces chemins/URL à ton projet avant de lancer
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const axios = require("axios");
const ExcelJS = require("exceljs");
const { XMLParser } = require("fast-xml-parser");

const CONFIG = {
  // Racine du backend Laravel (contient artisan, vendor/, tests/)
  SERVER_DIR: path.resolve(__dirname, "../server"),

  // Script PHP qui interroge la vraie DB (déjà existant, fonctionne bien)
  GET_DB_DETAILS_SCRIPT: "get-db-details.php",

  // Base URL de l'API à tester (override possible: API_BASE_URL=... node generate-report.js)
  API_BASE_URL: process.env.API_BASE_URL || "http://127.0.0.1:8000/api",

  // Dossiers de tests unitaires PHP à parser
  UNIT_TEST_DIR: "tests/Unit",

  // Fichier de sortie
  OUTPUT_XLSX: path.resolve(__dirname, "rapport-tests.xlsx"),

  // Fichier JUnit XML temporaire généré par PHPUnit
  JUNIT_XML: path.resolve(__dirname, "junit-report.xml"),
};

// ============================================================================
// 1. Récupération des données réelles de la DB (via ton script PHP existant)
// ============================================================================

function getDbData() {
  const cmd = `php ${CONFIG.GET_DB_DETAILS_SCRIPT}`;
  const output = execSync(cmd, { cwd: CONFIG.SERVER_DIR, encoding: "utf-8" });
  return JSON.parse(output);
}

// ============================================================================
// 2. Exécution de PHPUnit + parsing du résultat JUnit réel (pas de triche)
// ============================================================================

function runPhpUnitAndGetResults() {
  // Sur Windows, "vendor/bin/phpunit" (script shell) ne s'exécute pas
  // directement — composer génère vendor/bin/phpunit.bat à la place.
  const isWin = process.platform === "win32";
  const phpunitBin = isWin
    ? path.join("vendor", "bin", "phpunit.bat")
    : path.join("vendor", "bin", "phpunit");

  const phpunitPath = path.join(CONFIG.SERVER_DIR, phpunitBin);
  if (!fs.existsSync(phpunitPath)) {
    console.warn(`⚠️  PHPUnit introuvable à ${phpunitPath} — vérifie que 'composer install' a bien été fait dans server/.`);
    return {};
  }

  try {
    execSync(
      `"${phpunitPath}" --log-junit "${CONFIG.JUNIT_XML}"`,
      { cwd: CONFIG.SERVER_DIR, stdio: "pipe" }
    );
  } catch (e) {
    // PHPUnit sort avec un code d'erreur si des tests échouent : normal.
    // Mais si le fichier JUnit n'existe pas non plus, on affiche la vraie erreur.
    if (!fs.existsSync(CONFIG.JUNIT_XML)) {
      console.error("❌ PHPUnit n'a pas pu s'exécuter :");
      console.error(e.stdout?.toString() || "");
      console.error(e.stderr?.toString() || e.message);
    }
  }

  if (!fs.existsSync(CONFIG.JUNIT_XML)) {
    console.warn("⚠️  Aucun fichier JUnit généré — vérifie CONFIG.SERVER_DIR / phpunit.");
    return {};
  }

  const xml = fs.readFileSync(CONFIG.JUNIT_XML, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);

  // Résultat indexé par "ClassName::methodName" -> { statut, duree, message }
  const results = {};

  const testsuites = parsed.testsuites?.testsuite;
  const suiteList = Array.isArray(testsuites) ? testsuites : [testsuites].filter(Boolean);

  function walkSuite(suite) {
    if (!suite) return;
    const innerSuites = suite.testsuite
      ? Array.isArray(suite.testsuite) ? suite.testsuite : [suite.testsuite]
      : [];
    innerSuites.forEach(walkSuite);

    const cases = suite.testcase
      ? Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase]
      : [];

    cases.forEach((tc) => {
      const className = tc["@_class"] || tc["@_classname"] || "";
      const name = tc["@_name"] || "";
      const key = `${className}::${name}`;
      let statut = "Pass";
      let message = "";
      if (tc.failure) {
        statut = "Fail";
        message = (tc.failure["#text"] || tc.failure["@_message"] || "").toString().slice(0, 200);
      } else if (tc.error) {
        statut = "Erreur";
        message = (tc.error["#text"] || tc.error["@_message"] || "").toString().slice(0, 200);
      } else if (tc.skipped !== undefined) {
        statut = "Skipped";
      }
      results[key] = {
        statut,
        duree: parseFloat(tc["@_time"] || 0),
        message,
      };
    });
  }

  suiteList.forEach(walkSuite);
  return results;
}

// ============================================================================
// 3. Parsing des fichiers tests/Unit/*.php — extraction inputs + attendu
//    (regex volontairement simple : adapté au style de test utilisé ici,
//     à savoir makeXxx([...]) + assertEquals/assertTrue/assertFalse/assertContains/assertCount)
// ============================================================================

function parseUnitTestFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const className = path.basename(filePath, ".php");

  // Découpe grossière par méthode public function test_xxx(): void { ... }
  const methodRegex = /public function (test_\w+)\s*\([^)]*\)\s*:\s*void\s*\{([\s\S]*?)\n    \}/g;

  const tests = [];
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    const [, methodName, body] = m;

    // Valeur(s) attendue(s) : première assertion pertinente du corps
    let attendu = "";
    const assertEquals = body.match(/assertEquals\(\s*([^,]+),/);
    const assertTrue = body.match(/assertTrue\(/);
    const assertFalse = body.match(/assertFalse\(/);
    const assertContains = body.match(/assertContains\(\s*([^,]+),/);
    const assertCount = body.match(/assertCount\(\s*([^,]+),/);

    if (assertEquals) attendu = `= ${assertEquals[1].trim()}`;
    else if (assertContains) attendu = `contient ${assertContains[1].trim()}`;
    else if (assertCount) attendu = `count = ${assertCount[1].trim()}`;
    else if (assertTrue) attendu = "= true";
    else if (assertFalse) attendu = "= false";

    // Inputs : contenu du premier tableau passé à make*([ ... ])
    const inputMatch = body.match(/make\w+\(\s*(\[[\s\S]*?\])\s*\)/);
    const inputsRaw = inputMatch ? inputMatch[1].replace(/\s+/g, " ").trim() : "";
    const inputsObj = parseKeyValuePairs(inputsRaw);

    tests.push({
      className,
      methodName,
      inputsRaw,
      inputsObj,
      attendu,
      description: methodName.replace(/^test_/, "").replace(/_/g, " "),
    });
  }
  return tests;
}

/** Transforme "['date_arrivee' => '2025-08-01', 'ages_enfants' => [1, 5, 14]]"
 *  en { date_arrivee: "2025-08-01", ages_enfants: "[1, 5, 14]" } */
function parseKeyValuePairs(phpArrayStr) {
  const obj = {};
  if (!phpArrayStr) return obj;
  const regex = /'(\w+)'\s*=>\s*(\[[^\]]*\]|'[^']*'|"[^"]*"|[^,\]]+)/g;
  let m;
  while ((m = regex.exec(phpArrayStr)) !== null) {
    const key = m[1];
    let value = m[2].trim();
    // Retire les guillemets simples/doubles autour d'une valeur scalaire
    if (/^'.*'$/.test(value) || /^".*"$/.test(value)) {
      value = value.slice(1, -1);
    }
    obj[key] = value;
  }
  return obj;
}

function parseAllUnitTests() {
  const dir = path.join(CONFIG.SERVER_DIR, CONFIG.UNIT_TEST_DIR);
  if (!fs.existsSync(dir)) return {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith("Test.php"));

  const byClass = {};
  files.forEach((f) => {
    const tests = parseUnitTestFile(path.join(dir, f));
    if (tests.length) byClass[tests[0].className] = tests;
  });
  return byClass;
}

// ============================================================================
// 4. Comparaison DB vs API pour Hôtels / Chambres / Pensions
// ============================================================================

async function fetchJson(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return { ok: true, data: res.data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function buildHotelsRows(dbHotels) {
  const apiRes = await fetchJson(`${CONFIG.API_BASE_URL}/hotels`);
  const rows = [];

  dbHotels.forEach((hotel, i) => {
    let statut = "API injoignable";
    let resultatAttendu = `${hotel.chambres.length} chambre(s), prix > 0`;

    if (apiRes.ok) {
      const apiHotel = Array.isArray(apiRes.data)
        ? apiRes.data.find((h) => h.nom === hotel.nom)
        : null;
      if (!apiHotel) {
        statut = "MISMATCH (absent de l'API)";
      } else {
        const nomOk = apiHotel.nom === hotel.nom;
        const regionOk = (apiHotel.region ?? apiHotel.destination?.nom ?? "") === hotel.region;
        statut = nomOk && regionOk ? "MATCH" : "MISMATCH";
      }
    }

    rows.push({
      id: i + 1,
      nom: hotel.nom,
      region: hotel.region,
      description: hotel.description,
      resultatAttendu,
      statut,
    });
  });

  return rows;
}

async function buildChambresRows(dbHotels) {
  const rows = [];
  let id = 1;
  for (const hotel of dbHotels) {
    for (const chambre of hotel.chambres) {
      let statut = "Non vérifié (pas d'API dédiée sans ID hôtel)";
      rows.push({
        id: id++,
        nom: chambre.nom,
        hotel: hotel.nom,
        prixNuit: chambre.prix_base_nuit,
        quantite: chambre.quantite,
        resultatAttendu: `Prix > 0 et quantité >= 0`,
        statut:
          chambre.prix_base_nuit > 0 && chambre.quantite >= 0
            ? "Cohérent (DB)"
            : "INCOHÉRENT",
      });
    }
  }
  return rows;
}

async function buildPensionsRows(dbHotels) {
  const apiRes = await fetchJson(`${CONFIG.API_BASE_URL}/pensions`);
  const rows = [];
  let id = 1;
  for (const hotel of dbHotels) {
    for (const chambre of hotel.chambres) {
      for (const pension of chambre.pensions) {
        let statut = "API injoignable";
        if (apiRes.ok && Array.isArray(apiRes.data)) {
          const found = apiRes.data.find((p) => p.nom === pension.nom);
          statut = found ? "MATCH (existe dans l'API)" : "MISMATCH";
        }
        rows.push({
          id: id++,
          nom: pension.nom,
          chambre: chambre.nom,
          hotel: hotel.nom,
          supplement: pension.supplement_prix,
          resultatAttendu: "Supplément >= 0",
          statut: pension.supplement_prix >= 0 ? statut : "INCOHÉRENT (supplément négatif)",
        });
      }
    }
  }
  return rows;
}

// ============================================================================
// 5. Construction du classeur Excel
// ============================================================================

function styleHeader(sheet) {
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A1A2E" },
  };
  sheet.columns.forEach((col) => (col.width = Math.max(col.width || 10, 18)));
}

function colorStatutCell(cell, statut) {
  const s = (statut || "").toLowerCase();
  const isPass = s.includes("pass") || s.includes("match") || s.startsWith("coh");
  const isFail =
    s.includes("fail") || s.includes("mismatch") || s.includes("incohérent") || s.includes("erreur");
  if (isPass) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9F2D9" } };
  } else if (isFail) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9D6D5" } };
  } else {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
  }
}

async function main() {
  console.log("1/4 — Lecture des données réelles de la DB...");
  const dbHotels = getDbData();

  console.log("2/4 — Exécution de PHPUnit (résultats réels)...");
  const phpunitResults = runPhpUnitAndGetResults();

  console.log("3/4 — Parsing des fichiers tests/Unit/*.php...");
  const unitTestsByClass = parseAllUnitTests();

  console.log("4/4 — Comparaison DB vs API + génération Excel...");
  const [hotelsRows, chambresRows, pensionsRows] = await Promise.all([
    buildHotelsRows(dbHotels),
    buildChambresRows(dbHotels),
    buildPensionsRows(dbHotels),
  ]);

  const workbook = new ExcelJS.Workbook();

  // --- Feuille Hôtels ---
  const shHotels = workbook.addWorksheet("Hôtels");
  shHotels.columns = [
    { header: "ID", key: "id" },
    { header: "Nom Hôtel", key: "nom" },
    { header: "Région", key: "region" },
    { header: "Description", key: "description" },
    { header: "Résultat Attendu", key: "resultatAttendu" },
    { header: "Statut", key: "statut" },
  ];
  hotelsRows.forEach((r) => shHotels.addRow(r));
  shHotels.eachRow((row, i) => i > 1 && colorStatutCell(row.getCell(6), row.getCell(6).value));
  styleHeader(shHotels);

  // --- Feuille Chambres ---
  const shChambres = workbook.addWorksheet("Chambres");
  shChambres.columns = [
    { header: "ID", key: "id" },
    { header: "Chambre", key: "nom" },
    { header: "Hôtel", key: "hotel" },
    { header: "Prix / Nuit", key: "prixNuit" },
    { header: "Quantité", key: "quantite" },
    { header: "Résultat Attendu", key: "resultatAttendu" },
    { header: "Statut", key: "statut" },
  ];
  chambresRows.forEach((r) => shChambres.addRow(r));
  shChambres.eachRow((row, i) => i > 1 && colorStatutCell(row.getCell(7), row.getCell(7).value));
  styleHeader(shChambres);

  // --- Feuille Pensions ---
  const shPensions = workbook.addWorksheet("Pensions");
  shPensions.columns = [
    { header: "ID", key: "id" },
    { header: "Pension", key: "nom" },
    { header: "Chambre", key: "chambre" },
    { header: "Hôtel", key: "hotel" },
    { header: "Supplément (DT)", key: "supplement" },
    { header: "Résultat Attendu", key: "resultatAttendu" },
    { header: "Statut", key: "statut" },
  ];
  pensionsRows.forEach((r) => shPensions.addRow(r));
  shPensions.eachRow((row, i) => i > 1 && colorStatutCell(row.getCell(7), row.getCell(7).value));
  styleHeader(shPensions);

  // --- Une feuille par classe de test unitaire (Reservation, Hotel, Voyage, Destination...) ---
  Object.entries(unitTestsByClass).forEach(([className, tests]) => {
    const sheetName = className.replace("Test", "").slice(0, 28) || className;
    const sh = workbook.addWorksheet(sheetName);

    // Union ordonnée de toutes les clés d'inputs rencontrées dans cette classe de test
    const inputKeys = [];
    tests.forEach((t) => {
      Object.keys(t.inputsObj).forEach((k) => {
        if (!inputKeys.includes(k)) inputKeys.push(k);
      });
    });

    const baseColumns = [
      { header: "ID", key: "id" },
      { header: "Test", key: "description" },
    ];
    const inputColumns = inputKeys.map((k) => ({ header: k, key: `input_${k}` }));
    const tailColumns = [
      { header: "Résultat Attendu", key: "attendu" },
      { header: "Statut (PHPUnit réel)", key: "statut" },
      { header: "Durée (s)", key: "duree" },
      { header: "Message erreur", key: "message" },
    ];
    sh.columns = [...baseColumns, ...inputColumns, ...tailColumns];

    tests.forEach((t, i) => {
      const key = `Tests\\Unit\\${className}::${t.methodName}`;
      const real = phpunitResults[key] || phpunitResults[`${className}::${t.methodName}`];

      const row = {
        id: i + 1,
        description: t.description,
        attendu: t.attendu,
        statut: real ? real.statut : "Non trouvé dans JUnit",
        duree: real ? real.duree : "",
        message: real ? real.message : "",
      };
      inputKeys.forEach((k) => {
        row[`input_${k}`] = t.inputsObj[k] ?? "";
      });
      sh.addRow(row);
    });

    const statutColIndex = baseColumns.length + inputColumns.length + 2; // +2 = Résultat Attendu puis Statut
    sh.eachRow((row, i) => i > 1 && colorStatutCell(row.getCell(statutColIndex), row.getCell(statutColIndex).value));
    styleHeader(sh);
  });

  await workbook.xlsx.writeFile(CONFIG.OUTPUT_XLSX);
  console.log(`✅ Rapport généré : ${CONFIG.OUTPUT_XLSX}`);
}

main().catch((e) => {
  console.error("❌ Erreur:", e);
  process.exit(1);
});