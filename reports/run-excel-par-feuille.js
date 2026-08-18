/**
 * run-excel-par-feuille.js
 * ──────────────────────────────────────────────────────────────────────────
 * Lit chaque feuille de "TunisieBooking_Tests.xlsx",
 * exécute les appels API réels, et écrit les résultats dans le même fichier.
 *
 * Colonnes Excel :
 *   1  ID            2  Description    3  Méthode       4  Endpoint
 *   5  Auth requise  6  Données JSON   7  Code attendu  8  Code obtenu (écrit)
 *   9  Résultat      10 Durée (ms)     11 Détails       12 _check (caché)
 *
 * Lancer : node reports/run-excel-par-feuille.js
 * ──────────────────────────────────────────────────────────────────────────
 */

const path    = require("path");
const http    = require("http");
const ExcelJS = require("exceljs");

const EXCEL_FILE = path.resolve(__dirname, "TunisieBooking_Tests.xlsx");
const API_BASE   = "http://127.0.0.1:8000/api";
const ADMIN_EMAIL    = "admin@gmail.com";
const ADMIN_PASSWORD = "admin1234";

// ─── HTTP Helper ──────────────────────────────────────────────────────────
function apiCall(method, endpoint, body = null, token = null) {
  return new Promise((resolve) => {
    const url     = new URL(API_BASE + endpoint);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method:   method.toUpperCase(),
      headers:  {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        ...(token       ? { Authorization: `Bearer ${token}` }     : {}),
        ...(payload     ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const t0  = Date.now();
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data: json, raw: data, duration: Date.now() - t0 });
      });
    });

    req.on("error", (e) =>
      resolve({ status: 0, data: null, raw: e.message, duration: Date.now() - t0 })
    );

    if (payload) req.write(payload);
    req.end();
  });
}

let cachedAdminToken = null;

// ── Obtenir un token admin (avec mise en cache mémoire) ────────────────────
async function getAdminToken(forceRefresh = false) {
  if (cachedAdminToken && !forceRefresh) {
    return cachedAdminToken;
  }
  const r = await apiCall("POST", "/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (r.status === 200 && r.data && r.data.token) {
    cachedAdminToken = r.data.token;
    console.log(`  🔑 Token admin obtenu : ${String(r.data.token).substring(0, 18)}...`);
    return cachedAdminToken;
  }
  throw new Error(`Impossible d'obtenir le token admin (HTTP ${r.status})`);
}

// ─── Vérification du champ de réponse ────────────────────────────────────
function verifyResponse(data, check) {
  if (!check) return true;
  if (check === "array")  return Array.isArray(data);
  if (check === "length") return Array.isArray(data);
  if (!data || typeof data !== "object") return false;
  if (Array.isArray(data)) {
    // tableau non-vide → vérifier clé dans premier élément
    return data.length === 0 || Object.keys(data[0] || {}).includes(check);
  }
  // objet → chercher la clé (plat ou dans .data)
  return Object.keys(data).includes(check) ||
         Object.keys(data.data || {}).includes(check);
}

// ─── Couleur résultat ─────────────────────────────────────────────────────
const COLOR_PASS    = "C6EFCE"; // vert clair
const COLOR_FAIL    = "FFC7CE"; // rouge clair
const COLOR_PENDING = "FFEB9C"; // jaune

// ─── Main ─────────────────────────────────────────────────────────────────
async function run() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  🧪 EXÉCUTION DES TESTS — TunisieBooking_Tests.xlsx");
  console.log(`  🌐 API : ${API_BASE}`);
  console.log("══════════════════════════════════════════════════════════════\n");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_FILE);

  // Token admin (réutilisé pour tous les tests Auth=OUI)
  const adminToken = await getAdminToken();
  console.log();

  let totalPass = 0, totalFail = 0;

  for (const ws of wb.worksheets) {
    const sheetName = ws.name;
    console.log(`\n  ┌─ 📋 Feuille : ${sheetName} ${"─".repeat(Math.max(0, 44 - sheetName.length))}`);

    let sheetPass = 0, sheetFail = 0;

    // Ligne 1 = titre de la feuille, Ligne 2 = en-têtes → données à partir de ligne 3
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 2) return; // sauter titre + en-têtes
    });

    // Collecter les lignes de données
    const dataRows = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 2) return;
      const id     = String(row.getCell(1).value || "").trim();
      if (!id || id.startsWith("ID")) return;
      dataRows.push({ row, rowNumber });
    });

    // Exécuter en séquence pour éviter d'écraser le token
    for (const { row } of dataRows) {
      const id          = String(row.getCell(1).value  || "").trim();
      const description = String(row.getCell(2).value  || "").trim();
      const methode     = String(row.getCell(3).value  || "GET").trim().toUpperCase();
      const endpoint    = String(row.getCell(4).value  || "").trim();
      const authReq     = String(row.getCell(5).value  || "NON").trim().toUpperCase();
      const donneesStr  = String(row.getCell(6).value  || "").trim();
      const codeAttendu = Number(row.getCell(7).value  || 200);
      const check       = String(row.getCell(12).value || "").trim();

      if (!endpoint) continue;

      // Parser les données JSON
      let body = null;
      if (donneesStr) {
        try { body = JSON.parse(donneesStr); } catch (_) {}
      }

      let token = authReq === "OUI" ? await getAdminToken() : null;

      // Appel API réel
      let result = await apiCall(methode, endpoint, body, token);

      // Si la route exigeait l'auth et qu'on a obtenu un 401 inattendu (attendu 200) -> rafraîchir le token et réessayer
      if (authReq === "OUI" && result.status === 401 && codeAttendu === 200) {
        token = await getAdminToken(true);
        result = await apiCall(methode, endpoint, body, token);
      }

      // Évaluation
      const codeMatch  = result.status === codeAttendu;
      const fieldMatch = verifyResponse(result.data, check);
      const isPass     = codeMatch && fieldMatch;

      // Résumé console
      const icon   = isPass ? "✅ PASS" : "❌ FAIL";
      const authIco = authReq === "OUI" ? "🔒" : "🌐";
      console.log(
        `  │  ${icon}  ${id.padEnd(15)} ${authIco} ${methode.padEnd(5)} ${endpoint.padEnd(32)} HTTP ${result.status} (attendu ${codeAttendu}) [${result.duration}ms]`
      );
      if (!isPass && !codeMatch) {
        console.log(`  │         ⚠  Code HTTP : obtenu ${result.status} ≠ attendu ${codeAttendu}`);
      }
      if (!isPass && !fieldMatch) {
        console.log(`  │         ⚠  Champ "${check}" absent de la réponse`);
      }

      // Résumé de la réponse (tronqué)
      let details = "";
      if (result.data) {
        const s = JSON.stringify(result.data);
        details = s.length > 160 ? s.substring(0, 160) + "…" : s;
      } else {
        details = result.raw ? result.raw.substring(0, 160) : "";
      }

      // Écriture dans Excel
      const bgColor = isPass ? COLOR_PASS : COLOR_FAIL;

      // Col 8 : Code obtenu
      const c8 = row.getCell(8);
      c8.value = result.status;
      c8.alignment = { vertical: "middle", horizontal: "center" };

      // Col 9 : Résultat
      const c9 = row.getCell(9);
      c9.value = isPass ? "✅ PASS" : "❌ FAIL";
      c9.font  = { bold: true, color: { argb: isPass ? "276221" : "9C0006" } };
      c9.alignment = { vertical: "middle", horizontal: "center" };

      // Col 10 : Durée
      const c10 = row.getCell(10);
      c10.value = result.duration;
      c10.alignment = { vertical: "middle", horizontal: "center" };

      // Col 11 : Détails
      const c11 = row.getCell(11);
      c11.value = details;
      c11.alignment = { vertical: "middle", wrapText: false };
      c11.font = { size: 9 };

      // Colorer colonnes 7–11
      for (let col = 7; col <= 11; col++) {
        row.getCell(col).fill = {
          type: "pattern", pattern: "solid", fgColor: { argb: bgColor },
        };
      }

      if (isPass) { sheetPass++; totalPass++; }
      else        { sheetFail++; totalFail++; }
    }

    console.log(
      `  └─ ${sheetName} : ✅ ${sheetPass} PASS  ❌ ${sheetFail} FAIL  ` +
      `— Taux : ${sheetPass + sheetFail > 0 ? Math.round(sheetPass / (sheetPass + sheetFail) * 100) : 0}%`
    );
  }

  // Sauvegarder
  await wb.xlsx.writeFile(EXCEL_FILE);

  const total = totalPass + totalFail;
  const pct   = total > 0 ? ((totalPass / total) * 100).toFixed(1) : "0.0";

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  📊 RÉSUMÉ GLOBAL");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  🔘 Total tests    : ${total}`);
  console.log(`  ✅ PASS           : ${totalPass}`);
  console.log(`  ❌ FAIL           : ${totalFail}`);
  console.log(`  📈 Taux de succès : ${pct}%`);
  console.log(`  💾 Fichier mis à jour : ${EXCEL_FILE}`);
  console.log("══════════════════════════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("\n🚨 ERREUR FATALE :", err.message);
  console.error("Vérifiez que le serveur Laravel tourne sur http://127.0.0.1:8000\n");
  process.exit(1);
});
