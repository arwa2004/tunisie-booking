/**
 * run-excel-data-tests.js
 * ---------------------------------------------------------------------------
 * EXÉCUTEUR UNIQUE DE TESTS PILOTÉS PAR LE FICHIER EXCEL UNIQUE :
 *   reports/Cas_De_Tests_TunisieBooking.xlsx
 * ---------------------------------------------------------------------------
 * 1. Lit le fichier Excel d'entrée (où le testeur peut modifier les données).
 * 2. Récupère un token d'authentification pour les tests protégés.
 * 3. Envoie les requêtes HTTP réelles vers l'API Laravel (http://127.0.0.1:8000/api).
 * 4. Compare les codes de réponse et champs avec les résultats attendus.
 * 5. Met à jour directement le fichier Excel avec :
 *    - Code HTTP Obtenu
 *    - Réponse API Obtenue
 *    - Résultat Final (✅ PASS en Vert / ❌ FAIL en Rouge)
 *    - Temps d'exécution (ms)
 * ---------------------------------------------------------------------------
 * UTILISATION :
 *   node reports/run-excel-data-tests.js
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const axios = require("axios").create({
  baseURL: process.env.API_BASE_URL || "http://127.0.0.1:8000/api",
  timeout: 10000,
  validateStatus: () => true, // Gère tous les codes HTTP sans crasher
  headers: { Accept: "application/json" },
});

const EXCEL_PATH = path.resolve(__dirname, "Cas_De_Tests_TunisieBooking.xlsx");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAuthToken() {
  await sleep(1000);
  const res = await axios.post("/login", {
    email: "admin@gmail.com",
    password: "admin1234",
  });
  if (res.status === 200 && res.data) {
    return res.data.token || res.data.access_token || null;
  }
  return null;
}

async function runDataDrivenTests() {
  console.log("==========================================================");
  console.log(" 🧪 EXÉCUTION DU FICHIER EXCEL UNIQUE DE CAS DE TESTS");
  console.log(` 📍 Cible API : ${axios.defaults.baseURL}`);
  console.log(` 📂 Fichier   : ${EXCEL_PATH}`);
  console.log("==========================================================\n");

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Fichier introuvable : ${EXCEL_PATH}`);
    console.error("👉 Générez-le d'abord : node reports/build-test-cases-excel.js");
    process.exit(1);
  }

  // 1. Authentification initiale
  let authToken = null;
  try {
    authToken = await getAuthToken();
    if (authToken) {
      console.log(`🔑 Token Admin récupéré avec succès : ${authToken.substring(0, 15)}...`);
    } else {
      console.warn("⚠️ Impossible de se connecter en Admin. Les tests authentifiés risquent d'échouer.");
    }
  } catch (err) {
    console.warn(`⚠️ Erreur d'authentification : ${err.message}`);
  }

  // 2. Charger le classeur Excel
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.getWorksheet("Cas_De_Tests");

  if (!sheet) {
    console.error('❌ Feuille "Cas_De_Tests" introuvable dans le fichier Excel.');
    process.exit(1);
  }

  let totalCount = 0;
  let passCount = 0;
  let failCount = 0;

  console.log("\n🚀 Lancement des requêtes réelles depuis le fichier Excel...\n");
  console.log("─".repeat(95));

  const rowsCount = sheet.rowCount;

  for (let rowNumber = 2; rowNumber <= rowsCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);

    const id            = row.getCell(1).value;
    const sourceFile    = row.getCell(2).value;
    const domaine       = row.getCell(3).value;
    const action        = row.getCell(4).value;
    const methode       = String(row.getCell(5).value || "GET").toUpperCase();
    const endpoint      = String(row.getCell(6).value || "").trim();
    const authReqVal    = String(row.getCell(7).value || "").trim().toUpperCase();
    const isAuthReq     = authReqVal === "OUI";
    const payloadRaw    = row.getCell(8).value;
    const statutAttendu = parseInt(row.getCell(9).value, 10);
    const champVerifier = String(row.getCell(10).value || "").trim();

    if (!id || !endpoint) continue;
    totalCount++;

    // Préparer le corps JSON si présent
    let bodyData = null;
    if (payloadRaw) {
      const raw = typeof payloadRaw === "string" ? payloadRaw.trim() : JSON.stringify(payloadRaw);
      if (raw && raw !== "{}") {
        try { bodyData = JSON.parse(raw); } catch { bodyData = null; }
      }
    }

    // Exécuter la requête HTTP réelle
    const startTime = Date.now();
    let statutObtenu = 0;
    let responseData = null;

    try {
      if (methode === "POST" && endpoint === "/login") await sleep(600);

      const response = await axios({
        method: methode,
        url: endpoint,
        data: bodyData && ["POST", "PUT", "PATCH"].includes(methode) ? bodyData : undefined,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(isAuthReq && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      statutObtenu = response.status;
      responseData = response.data;

      // Rafraîchir le token si un login réussit dans le cours du test
      if (endpoint === "/login" && response.status === 200 && response.data) {
        const freshToken = response.data.token || response.data.access_token;
        if (freshToken) authToken = freshToken;
      }
    } catch (err) {
      statutObtenu = err.response ? err.response.status : 0;
      responseData = err.response ? err.response.data : { error: err.message };
    }

    const durationMs = Date.now() - startTime;

    // Évaluation PASS / FAIL
    let isPass = (statutObtenu === statutAttendu);

    if (isPass && champVerifier && responseData && typeof responseData === "object") {
      // Cas spécial : réponse est un tableau direct
      if (Array.isArray(responseData)) {
        if (champVerifier === "array" || champVerifier === "length") {
          // OK : la réponse est bien un tableau (même vide)
        } else if (responseData.length > 0 && !Object.keys(responseData[0] || {}).includes(champVerifier)) {
          isPass = false;
        }
        // Si tableau vide et champVerifier != 'array'/'length' => on laisse PASS (tableau valide)
      } else {
        const flat = responseData;
        const nested = flat.data || flat;
        if (!Object.keys(nested).includes(champVerifier) && !Object.keys(flat).includes(champVerifier)) {
          isPass = false;
        }
      }
    }

    // Console terminal
    const icon = isPass ? "✅ PASS" : "❌ FAIL";
    const authFlag = isAuthReq ? "🔒" : "🌐";
    console.log(
      ` ${icon} ${String(id).padEnd(14)} ${authFlag} ${methode.padEnd(5)} ${endpoint.padEnd(25)} HTTP ${statutObtenu} (attendu ${statutAttendu}) [${durationMs}ms]`
    );

    if (isPass) passCount++;
    else failCount++;

    // Écriture dans le fichier Excel
    const resultText = isPass ? "✅ PASS" : "❌ FAIL";
    const snippet = responseData ? JSON.stringify(responseData).substring(0, 150) : "-";

    const cellStatut   = row.getCell(11);
    const cellReponse  = row.getCell(12);
    const cellResultat = row.getCell(13);
    const cellTemps    = row.getCell(14);

    cellStatut.value   = statutObtenu;
    cellReponse.value  = snippet;
    cellResultat.value = resultText;
    cellTemps.value    = `${durationMs} ms`;

    // Couleurs dans Excel (Vert si PASS, Rouge si FAIL)
    const bgColor = isPass ? "C6EFCE" : "FFC7CE";
    const txtColor = isPass ? "006100" : "9C0006";

    cellResultat.font = { bold: true, color: { argb: txtColor } };
    cellResultat.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cellResultat.alignment = { horizontal: "center", vertical: "middle" };

    row.commit();
  }

  // Sauvegarder directement les résultats dans l'Excel unique
  await workbook.xlsx.writeFile(EXCEL_PATH);

  console.log("─".repeat(95));
  console.log("\n==========================================================");
  console.log(" 📊 RÉSUMÉ FINAL DE L'EXÉCUTION DU FICHIER EXCEL");
  console.log("==========================================================");
  console.log(` 🔘 Total cas de tests exécutés : ${totalCount}`);
  console.log(` ✅ PASS                        : ${passCount}`);
  console.log(` ❌ FAIL                        : ${failCount}`);
  const rate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : 0;
  console.log(` 📈 Taux de succès              : ${rate}%`);
  console.log("-".repeat(58));
  console.log(` 💾 Fichier Excel mis à jour    : ${EXCEL_PATH}`);
  console.log("==========================================================\n");
}

runDataDrivenTests().catch((err) => {
  console.error("❌ Erreur fatale :", err.message);
  process.exit(1);
});
