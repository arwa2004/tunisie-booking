/**
 * run-tests-from-excel.js
 *
 * Lit le fichier Excel maitre (plan-de-test-maitre.xlsx),
 * execute php artisan test pour chaque methode de test,
 * puis remplit la colonne Statut_Technique avec les resultats.
 *
 * Usage : node reports/run-tests-from-excel.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const xlsx = require("xlsx");

const EXCEL_PATH = path.resolve(__dirname, "plan-de-test-maitre.xlsx");
const SERVER_DIR = path.resolve(__dirname, "../server");
const JUNIT_OUT = path.resolve(__dirname, "phpunit-report.xml");

// --- Parse JUnit XML ---
function parseJunitXml(xmlPath) {
  var results = {}; // "ClassName::methodName" -> { status, time }
  if (!fs.existsSync(xmlPath)) return results;

  var xml = fs.readFileSync(xmlPath, "utf-8");

  // Simple parser without dependencies
  var testcaseRegex = /<testcase[\s\S]*?name="([^"]+)"[\s\S]*?class="([^"]+)"[\s\S]*?time="([^"]+)"[\s\S]*?>/g;
  var m;
  while ((m = testcaseRegex.exec(xml)) !== null) {
    var name = m[1];
    var className = m[2];
    var time = m[3];
    var key = className + "::" + name;

    // Check if there's a failure/error child
    var startIdx = m.index + m[0].length;
    var endIdx = xml.indexOf("</testcase>", startIdx);
    var inner = xml.substring(startIdx, endIdx);

    var status = "OK";
    if (inner.indexOf("<failure") > -1) status = "KO";
    else if (inner.indexOf("<error") > -1) status = "KO";

    results[key] = { status: status, time: parseFloat(time || 0) };
  }

  // Fallback: try another XML format
  if (Object.keys(results).length === 0) {
    var testcaseRegex2 = /<testcase[\s\S]*?name="([^"]+)"[\s\S]*?classname="([^"]+)"[\s\S]*?time="([^"]+)"[\s\S]*?>/g;
    while ((m = testcaseRegex2.exec(xml)) !== null) {
      var name = m[1];
      var className = m[2];
      var time = m[3];
      var key = className + "::" + name;

      var startIdx = m.index + m[0].length;
      var endIdx = xml.indexOf("</testcase>", startIdx);
      var inner = xml.substring(startIdx, endIdx);

      var status = "OK";
      if (inner.indexOf("<failure") > -1) status = "KO";
      else if (inner.indexOf("<error") > -1) status = "KO";

      results[key] = { status: status, time: parseFloat(time || 0) };
    }
  }

  return results;
}

// --- Main ---
function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("Fichier Excel introuvable : " + EXCEL_PATH);
    console.error("Lancez d'abord : node reports/generate-master-excel.js");
    process.exit(1);
  }

  console.log("=== EXECUTION DES TESTS PHPUNIT ===");
  console.log("");

  // 1. Run php artisan test
  console.log("Lancement de php artisan test...");
  try {
    execSync(
      'php artisan test --log-junit="' + JUNIT_OUT + '"',
      { cwd: SERVER_DIR, stdio: "pipe", timeout: 120000 }
    );
  } catch (e) {
    // PHPUnit exits with error code if tests fail - that's normal
    if (!fs.existsSync(JUNIT_OUT)) {
      console.error("Erreur: PHPUnit n'a pas genere de rapport JUnit.");
      console.error(e.stdout ? e.stdout.toString() : "");
      console.error(e.stderr ? e.stderr.toString() : e.message);
      process.exit(1);
    }
  }
  console.log("Tests termines. Parsing du rapport JUnit...");

  // 2. Parse JUnit results
  var junitResults = parseJunitXml(JUNIT_OUT);
  console.log("Tests trouves dans le rapport : " + Object.keys(junitResults).length);

  // 3. Read Excel
  var workbook = xlsx.readFile(EXCEL_PATH);
  var ws = workbook.Sheets["Plan de Test"];
  if (!ws) {
    console.error("Onglet 'Plan de Test' introuvable dans l'Excel.");
    return;
  }

  var json = xlsx.utils.sheet_to_json(ws, { header: 1 });
  if (json.length < 2) {
    console.error("Pas assez de lignes dans l'Excel.");
    return;
  }

  var headers = json[0];
  var methodeCol = -1;
  var statutTechCol = -1;
  var fichierCol = -1;

  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === "Methode") methodeCol = i;
    if (headers[i] === "Statut_Technique") statutTechCol = i;
    if (headers[i] === "Fichier") fichierCol = i;
  }

  if (methodeCol === -1 || statutTechCol === -1) {
    console.error("Colonnes 'Methode' ou 'Statut_Technique' introuvables.");
    return;
  }

  // 4. Match and fill results
  var matched = 0;
  var notFound = 0;
  var totalOk = 0;
  var totalKo = 0;

  for (var r = 1; r < json.length; r++) {
    var row = json[r];
    var methodName = row[methodeCol] || "";
    var fileName = row[fichierCol] || "";

    if (!methodName) continue;

    // Try to match: className::methodName
    // fileName is like "AuthTest.php", className is like "Tests\\Feature\\AuthTest"
    // But we can also look for just the method name
    var found = false;
    for (var key in junitResults) {
      if (key.indexOf("::" + methodName) > -1 || key === methodName) {
        row[statutTechCol] = junitResults[key].status;
        if (junitResults[key].status === "OK") totalOk++;
        else totalKo++;
        matched++;
        found = true;
        break;
      }
    }

    if (!found) {
      // Try exact match on method name only
      for (var key in junitResults) {
        var parts = key.split("::");
        var methodPart = parts[parts.length - 1];
        if (methodPart === methodName) {
          row[statutTechCol] = junitResults[key].status;
          if (junitResults[key].status === "OK") totalOk++;
          else totalKo++;
          matched++;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      notFound++;
    }
  }

  console.log("");
  console.log("=== RESULTATS ===");
  console.log("Tests matches : " + matched);
  console.log("  OK : " + totalOk);
  console.log("  KO : " + totalKo);
  console.log("Non trouves dans JUnit : " + notFound);

  // 5. Write back to Excel
  xlsx.utils.sheet_add_aoa(ws, json, { origin: "A1" });
  xlsx.writeFile(workbook, EXCEL_PATH);

  console.log("");
  console.log("Fichier mis a jour : " + EXCEL_PATH);
  console.log("Colonne 'Statut_Technique' remplie avec les resultats des tests.");
}

main();
