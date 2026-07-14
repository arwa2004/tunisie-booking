/**
 * generate-excel-report.js
 *
 * Génère un fichier Excel contenant :
 *   - Le CODE SOURCE de chaque test (PHPUnit + Jest)
 *   - Le STATUT d'exécution (Pass/Fail/Error/Skipped) quand un rapport est disponible
 *
 * INSTALLATION (une seule fois, à la racine du projet) :
 *   npm install xlsx xml2js
 *
 * ÉTAPE 1 (optionnelle mais recommandée) — générer les rapports d'exécution :
 *   Dans server/ :  php artisan test --log-junit ../reports/phpunit-report.xml
 *   Dans client/ :  npx jest --json --outputFile=../reports/jest-report.json
 *
 * ÉTAPE 2 — configurer les chemins ci-dessous (CONFIG) si ton arborescence diffère
 *
 * ÉTAPE 3 — lancer :
 *   node generate-excel-report.js
 *
 * Résultat : ./reports/rapport-tests.xlsx
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const xml2js = require('xml2js');

// ---------- CONFIG : adapte ces chemins si besoin ----------
const CONFIG = {
  phpTestsDir: path.join(__dirname, 'server', 'tests'),   // dossier contenant Feature/ et Unit/
  jsTestsDir: path.join(__dirname, 'client'),              // racine à scanner pour les *.test.js etc.
  phpunitXml: path.join(__dirname, 'reports', 'phpunit-report.xml'),
  jestJson: path.join(__dirname, 'reports', 'jest-report.json'),
  outputXlsx: path.join(__dirname, 'reports', 'rapport-tests.xlsx'),
};

// ---------- Utils ----------

function round(num, decimals = 3) {
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
}

function walkDir(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'vendor' || entry.name === '.next') continue;
      walkDir(fullPath, extensions, results);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Extrait un bloc { ... } équilibré à partir de l'index du premier '{'
function extractBalancedBlock(content, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        return content.slice(openBraceIndex, i + 1);
      }
    }
  }
  return content.slice(openBraceIndex); // fallback si mal formé
}

function cleanCode(code, maxLength = 4000) {
  const trimmed = code.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) + '\n/* ... tronqué ... */' : trimmed;
}

// ---------- Extraction du code source : PHPUnit ----------

function extractPhpTests(phpTestsDir) {
  const files = walkDir(phpTestsDir, ['.php']);
  const rows = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Repère les méthodes "public function testXxx(...)" ou "public function xxx(...)" précédées de #[Test] / @test
    const methodRegex = /(?:#\[Test\]\s*[\r\n]+\s*|\/\*\*[\s\S]*?@test[\s\S]*?\*\/\s*[\r\n]+\s*)?public\s+function\s+(test\w+|[a-zA-Z_]\w*)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const isExplicitTest = methodName.startsWith('test') || match[0].includes('#[Test]') || match[0].includes('@test');
      if (!isExplicitTest) continue;

      const openBraceIndex = match.index + match[0].length - 1;
      const block = extractBalancedBlock(content, openBraceIndex);
      const fullSnippet = `public function ${methodName}(...) ${block}`;

      rows.push({
        Framework: 'PHPUnit',
        Fichier: fileName,
        Test: methodName,
        'Code du test': cleanCode(fullSnippet),
      });
    }
  }

  return rows;
}

// ---------- Extraction du code source : Jest ----------

function extractJestTests(jsTestsDir) {
  const files = walkDir(jsTestsDir, ['.test.js', '.test.jsx', '.test.ts', '.test.tsx', '.spec.js', '.spec.jsx', '.spec.ts', '.spec.tsx']);
  const rows = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Repère test('name', ...) / it('name', ...) / it.each(...)('name', ...)
    const testCallRegex = /\b(?:test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*(?:=>)?\s*\{/g;

    let match;
    while ((match = testCallRegex.exec(content)) !== null) {
      // Retire les échappements (\' , \" , \\ etc.) pour que le nom corresponde
      // exactement à celui rapporté par Jest dans jest-report.json
      const testName = match[2].replace(/\\(.)/g, '$1');
      const openBraceIndex = match.index + match[0].length - 1;
      const block = extractBalancedBlock(content, openBraceIndex);
      const fullSnippet = `test('${testName}', ... => ${block})`;

      rows.push({
        Framework: 'Jest',
        Fichier: fileName,
        Test: testName,
        'Code du test': cleanCode(fullSnippet),
      });
    }
  }

  return rows;
}

// ---------- Résultats d'exécution : PHPUnit (JUnit XML) ----------

async function parsePhpUnitResults(xmlPath) {
  const results = {}; // clé: nom du test -> { Statut, Durée, Erreur }

  if (!fs.existsSync(xmlPath)) {
    console.warn(`ℹ️  Pas de rapport PHPUnit trouvé (${xmlPath}) — les statuts seront vides.`);
    return results;
  }

  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  const parser = new xml2js.Parser();
  const parsed = await parser.parseStringPromise(xmlContent);

  function walk(node) {
    if (!node) return;
    const suites = Array.isArray(node) ? node : [node];
    for (const suite of suites) {
      if (suite.testsuite) walk(suite.testsuite);
      if (suite.testcase) {
        const cases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase];
        for (const tc of cases) {
          const attrs = tc.$ || {};
          let status = 'Pass';
          let errorMessage = '';
          if (tc.failure) {
            status = 'Fail';
            const f = Array.isArray(tc.failure) ? tc.failure[0] : tc.failure;
            errorMessage = (f._ || f.$?.message || '').toString().split('\n')[0];
          } else if (tc.error) {
            status = 'Error';
            const e = Array.isArray(tc.error) ? tc.error[0] : tc.error;
            errorMessage = (e._ || e.$?.message || '').toString().split('\n')[0];
          } else if (tc.skipped) {
            status = 'Skipped';
          }
          results[attrs.name] = {
            Statut: status,
            'Durée (s)': attrs.time ? round(parseFloat(attrs.time)) : '',
            'Message erreur': errorMessage,
          };
        }
      }
    }
  }

  const root = parsed.testsuites || parsed.testsuite;
  if (root) walk(root.testsuite || root);

  return results;
}

// ---------- Résultats d'exécution : Jest (JSON) ----------

function parseJestResults(jsonPath) {
  const results = {}; // clé: nom du test -> { Statut, Durée, Erreur }

  if (!fs.existsSync(jsonPath)) {
    console.warn(`ℹ️  Pas de rapport Jest trouvé (${jsonPath}) — les statuts seront vides.`);
    return results;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  for (const suiteResult of data.testResults || []) {
    for (const test of suiteResult.assertionResults || []) {
      let status = 'Pass';
      if (test.status === 'failed') status = 'Fail';
      else if (test.status === 'pending' || test.status === 'skipped' || test.status === 'todo') status = 'Skipped';

      const errorMessage = (test.failureMessages && test.failureMessages[0])
        ? test.failureMessages[0].split('\n')[0]
        : '';

      results[test.title] = {
        Statut: status,
        'Durée (s)': test.duration ? round(test.duration / 1000) : '',
        'Message erreur': errorMessage,
      };
    }
  }

  return results;
}

// ---------- Fusion + génération du fichier Excel ----------

function mergeResults(sourceRows, resultsMap) {
  return sourceRows.map((row) => {
    const match = resultsMap[row.Test];
    return {
      Framework: row.Framework,
      Fichier: row.Fichier,
      Test: row.Test,
      Statut: match ? match.Statut : 'Non exécuté',
      'Durée (s)': match ? match['Durée (s)'] : '',
      'Message erreur': match ? match['Message erreur'] : '',
      'Code du test': row['Code du test'],
    };
  });
}

(async () => {
  console.log('📊 Extraction du code source des tests...\n');

  const phpSourceRows = extractPhpTests(CONFIG.phpTestsDir);
  console.log(`✔ PHPUnit : ${phpSourceRows.length} test(s) trouvé(s) dans le code source`);

  const jestSourceRows = extractJestTests(CONFIG.jsTestsDir);
  console.log(`✔ Jest    : ${jestSourceRows.length} test(s) trouvé(s) dans le code source`);

  console.log('\n📥 Lecture des rapports d\'exécution (si présents)...');
  const phpResults = await parsePhpUnitResults(CONFIG.phpunitXml);
  const jestResults = parseJestResults(CONFIG.jestJson);

  const allRows = [
    ...mergeResults(phpSourceRows, phpResults),
    ...mergeResults(jestSourceRows, jestResults),
  ];

  if (allRows.length === 0) {
    console.error('\n❌ Aucun test trouvé. Vérifie les chemins CONFIG.phpTestsDir et CONFIG.jsTestsDir en haut du script.');
    process.exit(1);
  }

  const workbook = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(allRows);

  // Largeurs de colonnes raisonnables
  ws['!cols'] = [
    { wch: 10 }, // Framework
    { wch: 25 }, // Fichier
    { wch: 30 }, // Test
    { wch: 14 }, // Statut
    { wch: 10 }, // Durée
    { wch: 40 }, // Message erreur
    { wch: 80 }, // Code du test
  ];

  xlsx.utils.book_append_sheet(workbook, ws, 'Tests');
  
  // 1. Écriture du CSV (Idéal pour l'intégration Power Query car il n'est pas bloqué par Excel)
  const csvPath = CONFIG.outputXlsx.replace('.xlsx', '.csv');
  try {
    const csvContent = xlsx.utils.sheet_to_csv(ws);
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`✔ CSV généré avec succès : ${csvPath}`);
  } catch (err) {
    console.error(`❌ Impossible d'écrire le fichier CSV : ${err.message}`);
  }

  // 2. Écriture du XLSX
  try {
    xlsx.writeFile(workbook, CONFIG.outputXlsx);
    console.log(`✔ Excel généré avec succès : ${CONFIG.outputXlsx}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`\n⚠️  Le fichier Excel "${path.basename(CONFIG.outputXlsx)}" est actuellement ouvert et verrouillé.`);
      console.warn(`👉 Veuillez fermer Excel puis relancer le script pour mettre à jour le fichier Excel directement.`);
      console.warn(`💡 Note : Le fichier CSV a quand même été mis à jour et peut être actualisé dans Excel.`);
    } else {
      console.error(`❌ Erreur lors de l'écriture Excel : ${err.message}`);
    }
  }
})();