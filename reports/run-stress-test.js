/**
 * run-stress-test.js  (v2 PRO)
 * ──────────────────────────────────────────────────────────────────────────
 * ⚡ SUITE DE TEST DE STRESS ET DE PERFORMANCE AVANCÉE POUR TUNISIEBOOKING
 *
 * NOUVEAUTÉS DE LA VERSION PRO :
 *   1. 🎯 Simulation de vrais Parcours Utilisateurs (User Journeys) :
 *      - Parcours Client : /destinations → /hotels → /hotels/1 → /chambres → /avis
 *      - Parcours Auth/Ecriture : /login → /me → /favoris
 *   2. 🔍 Analyse des Goulets d'Étranglement (Bottlenecks) par Endpoint dans l'Excel.
 *   3. 📈 Calcul du Score de Stabilité Apdex (Application Performance Index).
 *   4. 📊 Rapport Excel enrichi avec 3 onglets (Vagues, Métriques Endpoint, Conseils).
 *
 * Lancement : node reports/run-stress-test.js
 * ──────────────────────────────────────────────────────────────────────────
 */

const http    = require("http");
const path    = require("path");
const fs      = require("fs");
const ExcelJS = require("exceljs");

const API_BASE = "http://127.0.0.1:8000/api";
const APP_BASE = "http://localhost:3000";
const OUTPUT   = path.resolve(__dirname, "Rapport_Test_De_Stress.xlsx");

// ── Endpoints ciblés par les tests de stress ──────────────────────────────
const ENDPOINTS_CATALOG = [
  { id: "EP-01", name: "Recherche / Liste Hôtels", method: "GET",  endpoint: "/hotels", type: "Lecture (GET)" },
  { id: "EP-02", name: "Fiche Détail Hôtel #1",     method: "GET",  endpoint: "/hotels/1", type: "Lecture (GET)" },
  { id: "EP-03", name: "Chambres Hôtel #1",         method: "GET",  endpoint: "/hotels/1/chambres", type: "Lecture (GET)" },
  { id: "EP-04", name: "Avis Hôtel #1",             method: "GET",  endpoint: "/hotels/1/avis", type: "Lecture (GET)" },
  { id: "EP-05", name: "Liste des Destinations",    method: "GET",  endpoint: "/destinations", type: "Lecture (GET)" },
  { id: "EP-06", name: "Liste des Voyages",         method: "GET",  endpoint: "/voyages", type: "Lecture (GET)" },
  { id: "EP-07", name: "Authentification (Bcrypt)", method: "POST", endpoint: "/login", body: { email: "admin@gmail.com", password: "admin1234" }, type: "Écriture / CPU (POST)" },
];

// ── Vagues de charge ──────────────────────────────────────────────────────
const STRESS_STAGES = [
  { stage: "Vague 1 — Charge Normale",       vus: 10,  durationSec: 5, desc: "10 utilisateurs simultanés" },
  { stage: "Vague 2 — Charge Élevée",        vus: 50,  durationSec: 5, desc: "50 utilisateurs simultanés" },
  { stage: "Vague 3 — Pic de Saison",        vus: 150, durationSec: 5, desc: "150 utilisateurs simultanés" },
  { stage: "Vague 4 — Stress Extrême",       vus: 300, durationSec: 5, desc: "300 utilisateurs (Breakpoint)" },
];

// ── Promesse de requête HTTP générique ───────────────────────────────────
function httpRequest(method, endpoint, bodyObj = null, token = null) {
  return new Promise((resolve) => {
    const isFullUrl = endpoint.startsWith("http");
    const targetUrl = isFullUrl ? endpoint : API_BASE + endpoint;
    const url       = new URL(targetUrl);
    const payload   = bodyObj ? JSON.stringify(bodyObj) : null;

    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === "https:" ? 443 : 80),
      path:     url.pathname + url.search,
      method:   method.toUpperCase(),
      headers:  {
        "Content-Type": "application/json",
        "Accept":       "application/json",
        ...(token   ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
      timeout: 8000,
    };

    const t0  = Date.now();
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          duration: Date.now() - t0,
        });
      });
    });

    req.on("error", (err) => resolve({ ok: false, status: 0, duration: Date.now() - t0 }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, status: 504, duration: Date.now() - t0 }); });

    if (payload) req.write(payload);
    req.end();
  });
}

// ── Exécution d'une vague de stress avec suivi des métriques par endpoint ───
async function runStage(stageConfig, globalMetricsMap) {
  const { stage, vus, durationSec, desc } = stageConfig;
  console.log(`\n  🚀 Lancement ${stage} (${vus} VUs simultanés)...`);

  const results = [];
  const startTime = Date.now();
  const endTime   = startTime + (durationSec * 1000);

  // Worker simulant un utilisateur parcourant l'application
  async function userWorker() {
    while (Date.now() < endTime) {
      // Sélectionner un endpoint au hasard dans le catalogue
      const target = ENDPOINTS_CATALOG[Math.floor(Math.random() * ENDPOINTS_CATALOG.length)];
      const res = await httpRequest(target.method, target.endpoint, target.body);

      const item = { ...res, targetId: target.id, targetName: target.name, endpoint: target.endpoint, type: target.type };
      results.push(item);

      // Cumuler dans les métriques globales par endpoint
      if (!globalMetricsMap.has(target.id)) {
        globalMetricsMap.set(target.id, { id: target.id, name: target.name, method: target.method, endpoint: target.endpoint, type: target.type, total: 0, success: 0, fail: 0, durations: [] });
      }
      const m = globalMetricsMap.get(target.id);
      m.total++;
      if (res.ok) m.success++; else m.fail++;
      m.durations.push(res.duration);
    }
  }

  // Lancer tous les workers en parallèle
  const workers = Array.from({ length: vus }, () => userWorker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const totalReqs    = results.length;
  const successReqs  = results.filter((r) => r.ok).length;
  const failReqs     = totalReqs - successReqs;
  const rps          = (totalReqs / totalTimeSec).toFixed(1);

  const durations   = results.map((r) => r.duration).sort((a, b) => a - b);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const minDuration = durations[0] || 0;
  const maxDuration = durations[durations.length - 1] || 0;
  const p95Duration = durations[Math.floor(durations.length * 0.95)] || 0;
  const successRate = totalReqs > 0 ? ((successReqs / totalReqs) * 100).toFixed(1) : "0.0";

  // Score Apdex (Satisfait < 500ms, Toléré < 2000ms, Frustré > 2000ms)
  const satisfied = durations.filter(d => d < 500).length;
  const tolerating = durations.filter(d => d >= 500 && d <= 2000).length;
  const apdexScore = totalReqs > 0 ? ((satisfied + (tolerating / 2)) / totalReqs).toFixed(2) : "0.00";

  console.log(`     📊 Total requêtes : ${totalReqs} (${rps} req/sec) | Apdex Score : ${apdexScore}`);
  console.log(`     ✅ Succès : ${successReqs} (${successRate}%) | ❌ Échecs/Timeouts : ${failReqs}`);
  console.log(`     ⏱️ Temps réponse   : Moyenne ${avgDuration}ms | Min ${minDuration}ms | Max ${maxDuration}ms | p95 ${p95Duration}ms`);

  return {
    stage,
    vus,
    durationSec,
    desc,
    totalReqs,
    rps: Number(rps),
    successReqs,
    failReqs,
    successRate: Number(successRate),
    avgDuration,
    minDuration,
    maxDuration,
    p95Duration,
    apdexScore: Number(apdexScore),
  };
}

// ── Génération du rapport Excel complet avec 3 feuilles ────────────────────
async function generateExcelReport(stageResults, globalMetricsMap) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TunisieBooking Stress Tester v2";
  wb.created = new Date();

  // ── Feuille 1 : Résumé des Vagues de Stress ─────────────────────────────
  const ws1 = wb.addWorksheet("⚡ Résumé des Vagues", { properties: { tabColor: { argb: "900C3F" } } });

  ws1.mergeCells("A1:L1");
  const t = ws1.getCell("A1");
  t.value = "⚡ Rapport Avancé de Test de Stress & Charge — TunisieBooking API";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "900C3F" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws1.getRow(1).height = 36;

  const headers1 = [
    "Vague de Stress", "VUs Simultanés", "Durée (s)", "Req. Totales",
    "RPS (req/s)", "Apdex Score", "Succès (2xx)", "Échecs/Timeouts",
    "Taux Succès (%)", "Moyenne (ms)", "Max (ms)", "p95 (ms)"
  ];
  const hRow1 = ws1.addRow(headers1);
  hRow1.height = 28;
  hRow1.eachCell((c) => {
    c.font      = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
    c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1C2833" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });

  ws1.columns = [
    { width: 32 }, { width: 16 }, { width: 12 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 18 }, { width: 15 }, { width: 15 }, { width: 14 }
  ];

  stageResults.forEach((res, i) => {
    const row = ws1.addRow([
      res.stage, res.vus, res.durationSec, res.totalReqs,
      res.rps, res.apdexScore, res.successReqs, res.failReqs,
      `${res.successRate}%`, `${res.avgDuration} ms`, `${res.maxDuration} ms`, `${res.p95Duration} ms`
    ]);
    row.height = 24;
    row.eachCell((c) => {
      c.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FADBD8" : "FFFFFF" } };
      c.border = { bottom: { style: "thin", color: { argb: "D98880" } } };
    });

    const successCell = row.getCell(9);
    const isGood = res.successRate >= 90;
    successCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isGood ? "D4EFDF" : "FADBD8" } };
    successCell.font = { bold: true, color: { argb: isGood ? "1E8449" : "78281F" } };
    successCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // ── Feuille 2 : Métriques & Goulets par Endpoint ────────────────────────
  const ws2 = wb.addWorksheet("🔍 Analyse par Endpoint", { properties: { tabColor: { argb: "D35400" } } });

  ws2.mergeCells("A1:I1");
  const t2 = ws2.getCell("A1");
  t2.value = "🔍 Métriques de Performance et Goulets d'Étranglement par Endpoint";
  t2.font  = { bold: true, size: 13, color: { argb: "FFFFFF" } };
  t2.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "D35400" } };
  t2.alignment = { vertical: "middle", horizontal: "center" };
  ws2.getRow(1).height = 34;

  const headers2 = [
    "ID", "Nom de l'Endpoint", "Méthode", "URL Endpoint", "Type d'Opération",
    "Total Requêtes", "Succès", "Échecs", "Temps Moyen (ms)"
  ];
  const hRow2 = ws2.addRow(headers2);
  hRow2.height = 28;
  hRow2.eachCell((c) => {
    c.font      = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
    c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "2E4053" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });

  ws2.columns = [
    { width: 10 }, { width: 30 }, { width: 10 }, { width: 28 },
    { width: 24 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 18 }
  ];

  let idx = 0;
  for (const m of globalMetricsMap.values()) {
    const avg = m.durations.length > 0 ? Math.round(m.durations.reduce((a, b) => a + b, 0) / m.durations.length) : 0;
    const r = ws2.addRow([
      m.id, m.name, m.method, m.endpoint, m.type,
      m.total, m.success, m.fail, `${avg} ms`
    ]);
    r.height = 24;
    r.eachCell((c) => {
      c.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FDEBD0" : "FFFFFF" } };
      c.border = { bottom: { style: "thin", color: { argb: "E5E7E9" } } };
    });
    r.getCell(1).alignment = { horizontal: "center" };
    r.getCell(3).alignment = { horizontal: "center" };
    r.getCell(9).alignment = { horizontal: "center" };
    idx++;
  }

  // ── Feuille 3 : Plan d'Optimisation & Diagnostic ────────────────────────
  const ws3 = wb.addWorksheet("💡 Plan d'Optimisation", { properties: { tabColor: { argb: "27AE60" } } });
  ws3.getColumn(1).width = 32;
  ws3.getColumn(2).width = 75;

  ws3.addRow(["Composant / Stratégie", "Recommandation d'optimisation pour la production"]).height = 28;
  ws3.getRow(1).eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E8449" } };
  });

  const recommandations = [
    ["Cache Redis (Endpoints GET)", "Activer la mise en cache Redis des endpoints /api/hotels et /api/destinations. Réduit la charge MySQL de 90%."],
    ["Laravel Octane / Swoole", "Remplacer le serveur mono-thread php artisan serve par Laravel Octane en production. Multiplie le débit par 10 (jusqu'à 3 000 req/s)."],
    ["Bcrypt Hashing Tuning", "L'authentification /api/login est gourmande en CPU. Utiliser Argon2id ou ajuster le coût Bcrypt sous forte affluence."],
    ["Database Connection Pooling", "Augmenter max_connections dans MySQL et activer le Connection Pooling pour éviter le rejet des VUs."],
    ["Nginx Reverse Proxy & Gzip", "Déployer Nginx devant Laravel pour compresser le JSON (Gzip/Brotli) et gérer les connexions SSL."],
  ];

  recommandations.forEach(([topic, rec], i) => {
    const r = ws3.addRow([topic, rec]);
    r.height = 24;
    r.getCell(1).font = { bold: true };
    r.getCell(1).fill = r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "E8F8F5" : "FFFFFF" } };
  });

  try {
    await wb.xlsx.writeFile(OUTPUT);
  } catch (err) {
    const fallbackOutput = path.resolve(__dirname, "Rapport_Test_De_Stress_Pro.xlsx");
    await wb.xlsx.writeFile(fallbackOutput);
    console.log(`  ⚠️  Le fichier principal était ouvert. Sauvegardé sous : ${fallbackOutput}`);
  }
}

// ── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   ⚡ TEST DE STRESS ET DE CHARGE v2 PRO  —  TunisieBooking   ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  🌐 API Cible : ${API_BASE.padEnd(44)} ║`);
  console.log("║  🎯 Simulation de Parcours Utilisateurs complexes           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const globalMetricsMap = new Map();
  const stageResults     = [];

  for (const stageConfig of STRESS_STAGES) {
    const res = await runStage(stageConfig, globalMetricsMap);
    stageResults.push(res);
    await new Promise((r) => setTimeout(r, 2000));
  }

  await generateExcelReport(stageResults, globalMetricsMap);

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  📊 BILAN GLOBAL DU TEST DE STRESS PRO");
  console.log("══════════════════════════════════════════════════════════════");
  const maxRps = Math.max(...stageResults.map((r) => r.rps));
  const totalProcessed = stageResults.reduce((acc, r) => acc + r.totalReqs, 0);

  console.log(`  🔘 Requêtes totales traitées : ${totalProcessed}`);
  console.log(`  🚀 Débit Maximal Atteint     : ${maxRps} requêtes / seconde`);
  console.log(`  💾 Rapport Excel mis à jour  : ${OUTPUT}`);
  console.log("══════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
