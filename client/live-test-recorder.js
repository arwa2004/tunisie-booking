/**
 * live-test-recorder.js  (v3 - STABLE)
 * ─────────────────────────────────────────────────────────────────────────
 * 🎥 Enregistreur de session en temps réel → Rapport Excel
 *
 * COMMENT ÇA MARCHE :
 *   1. Ce script ouvre un navigateur Chromium sur http://localhost:3000
 *   2. Vous naviguez librement dans l'application
 *   3. Fermez la fenêtre du navigateur → rapport Excel généré automatiquement
 *
 * USAGE :   node client/live-test-recorder.js
 * ─────────────────────────────────────────────────────────────────────────
 */

const { chromium } = require("@playwright/test");
const path         = require("path");
const ExcelJS      = require("exceljs");
const fs           = require("fs");

// ── Configuration ──────────────────────────────────────────────────────────
const APP_URL     = "http://localhost:3000";
const API_URL     = "http://127.0.0.1:8000/api";
const REPORTS_DIR = path.resolve(__dirname, "..", "reports");
const OUTPUT      = path.join(REPORTS_DIR, "Session_Live_Tests.xlsx");
const JSON_BACKUP = path.join(REPORTS_DIR, "_session_backup.json");

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ── Données de session ─────────────────────────────────────────────────────
const SESSION = {
  debut:    new Date(),
  pages:    [],
  actions:  [],
  apiCalls: [],
  erreurs:  [],
};

let pageCounter = 0, actionCounter = 0, apiCounter = 0, errorCounter = 0;

// Sauvegarde JSON incrémentale (synchrone → survit au kill du process)
function saveBackup() {
  try {
    fs.writeFileSync(JSON_BACKUP, JSON.stringify(SESSION, null, 2), "utf8");
  } catch (_) {}
}

// ── Filtres ────────────────────────────────────────────────────────────────
const IGNORE = ["/api/auth/session", "/_next/", "/favicon", "__nextjs", "webpack", "hot-reload"];
function shouldIgnore(url) { return IGNORE.some((p) => url.includes(p)); }

// ── Logging ────────────────────────────────────────────────────────────────
function heure() { return new Date().toLocaleTimeString("fr-FR"); }

function addPage(url, titre, statut) {
  pageCounter++;
  SESSION.pages.push({ num: pageCounter, url, titre: titre || url, statut: statut || "200", heure: heure() });
  saveBackup();
  const icon = statut && parseInt(statut) >= 400 ? "🔴" : "🟢";
  console.log(`  ${icon} [Page #${pageCounter}]  ${titre || url}`);
}

function addAction(type, description, url) {
  actionCounter++;
  SESSION.actions.push({ num: actionCounter, type, description, url, heure: heure() });
  saveBackup();
  console.log(`  🎯 [${type}]  ${description}`);
}

function parseApiFields(reponseTxt, bodyTxt, endpoint) {
  let id = "";
  let nom = "";
  let email = "";
  let role = "";
  let prix = "";
  let message = "";

  // 1. Parser le body envoyé
  let bodyObj = null;
  if (bodyTxt) {
    try { bodyObj = typeof bodyTxt === "string" ? JSON.parse(bodyTxt) : bodyTxt; } catch (_) {}
  }
  if (bodyObj) {
    if (bodyObj.email) email = bodyObj.email;
    if (bodyObj.role) role = bodyObj.role;
    if (bodyObj.nom) nom = bodyObj.nom + (bodyObj.prenom ? " " + bodyObj.prenom : "");
  }

  // 2. Parser la réponse reçue
  let data = null;
  if (reponseTxt) {
    try { data = typeof reponseTxt === "string" ? JSON.parse(reponseTxt) : reponseTxt; } catch (_) {}
  }

  if (data) {
    if (Array.isArray(data)) {
      id = `${data.length} élément(s)`;
      if (data.length > 0 && data[0]) {
        const item = data[0];
        nom = item.nom || item.title || item.type || (item.user ? item.user.nom : "");
        if (item.prix_par_nuit) prix = `${item.prix_par_nuit} DT/nuit`;
        else if (item.prix_total) prix = `${item.prix_total} DT`;
      }
      message = `Tableau JSON (${data.length} résultats)`;
    } else if (typeof data === "object") {
      const u = data.user || data;
      if (u.id) id = String(u.id);
      else if (data.id) id = String(data.id);

      if (u.nom || u.prenom) {
        nom = [u.prenom, u.nom].filter(Boolean).join(" ");
      } else if (data.nom) {
        nom = data.nom;
      }

      if (u.email) email = u.email;
      if (u.role) role = u.role;

      if (data.prix_par_nuit) prix = `${data.prix_par_nuit} DT/nuit`;
      else if (data.prix_total) prix = `${data.prix_total} DT`;
      else if (data.prix) prix = `${data.prix} DT`;

      if (data.message) message = data.message;
      else if (data.errors) message = typeof data.errors === "object" ? JSON.stringify(data.errors) : String(data.errors);
      else if (data.token) message = "Token JWT généré avec succès";
    }
  }

  return { id, nom, email, role, prix, message };
}

function addApiCall(methode, endpoint, body, code, reponse) {
  if (shouldIgnore(endpoint)) return;
  apiCounter++;
  const statut = code >= 200 && code < 300 ? "✅ OK" : code >= 400 ? "⚠️ Erreur client" : code >= 500 ? "❌ Erreur serveur" : "ℹ️";
  SESSION.apiCalls.push({ num: apiCounter, methode, endpoint, body: body || "", codeHTTP: code, statut, reponse: reponse || "", heure: heure() });
  saveBackup();
  const icon = code >= 200 && code < 300 ? "✅" : "❌";
  console.log(`  ${icon} API  ${methode.padEnd(5)} ${endpoint.padEnd(40)} → ${code}`);
}

function addError(message, url) {
  if (shouldIgnore(message) || shouldIgnore(url || "")) return;
  if (SESSION.erreurs.find((e) => e.message === message)) return;
  errorCounter++;
  SESSION.erreurs.push({ num: errorCounter, message, url: url || "", heure: heure() });
  saveBackup();
  console.log(`  🔴 ERREUR  ${message.slice(0, 100)}`);
}

// ── Scénarios détectés ─────────────────────────────────────────────────────
function detecterScenarios() {
  const urls = SESSION.pages.map((p) => p.url);
  const apis = SESSION.apiCalls;
  const list = [];

  const loginApi = apis.find((a) => a.methode === "POST" && a.endpoint.includes("/login"));
  if (urls.some((u) => u.includes("/login"))) {
    list.push({ scenario: "🔐 Connexion", statut: loginApi ? (loginApi.codeHTTP === 200 ? "✅ PASS" : "❌ FAIL") : "🔄 Visité", detail: loginApi ? `POST /login → HTTP ${loginApi.codeHTTP}` : "Page visitée", pagesURL: urls.filter((u) => u.includes("/login")).join(", ") });
  }
  const regApi = apis.find((a) => a.methode === "POST" && a.endpoint.includes("/register"));
  if (urls.some((u) => u.includes("/register"))) {
    list.push({ scenario: "📝 Inscription", statut: regApi ? (regApi.codeHTTP <= 201 ? "✅ PASS" : "❌ FAIL") : "🔄 Visité", detail: regApi ? `POST /register → HTTP ${regApi.codeHTTP}` : "Page visitée", pagesURL: urls.filter((u) => u.includes("/register")).join(", ") });
  }
  const hotelsApi = apis.find((a) => a.methode === "GET" && a.endpoint === "/hotels");
  if (urls.some((u) => u.includes("/hotels"))) {
    list.push({ scenario: "🏨 Liste hôtels", statut: hotelsApi ? "✅ PASS" : "🔄 Visité", detail: hotelsApi ? `GET /hotels → HTTP ${hotelsApi.codeHTTP}` : "Page visitée", pagesURL: urls.filter((u) => u.includes("/hotels")).join(", ") });
  }
  const hotelDetail = apis.find((a) => a.methode === "GET" && /\/hotels\/\d+$/.test(a.endpoint));
  if (hotelDetail) {
    list.push({ scenario: "🏩 Détail hôtel", statut: hotelDetail.codeHTTP === 200 ? "✅ PASS" : "❌ FAIL", detail: `GET ${hotelDetail.endpoint} → HTTP ${hotelDetail.codeHTTP}`, pagesURL: urls.filter((u) => u.match(/\/hotels\/\d+/)).join(", ") });
  }
  const resApi = apis.find((a) => a.methode === "POST" && a.endpoint.includes("/reservations"));
  if (resApi || urls.some((u) => u.includes("/reservations"))) {
    list.push({ scenario: "📅 Réservation", statut: resApi ? ([200,201].includes(resApi.codeHTTP) ? "✅ PASS" : `❌ FAIL (${resApi.codeHTTP})`) : "🔄 Visité", detail: resApi ? `POST /reservations → HTTP ${resApi.codeHTTP}` : "Page visitée", pagesURL: urls.filter((u) => u.includes("/reservations")).join(", ") });
  }
  const favApi = apis.find((a) => a.endpoint.includes("/favoris") && !a.endpoint.includes("/ids"));
  if (favApi) {
    list.push({ scenario: "❤️ Favoris", statut: favApi.codeHTTP === 200 ? "✅ PASS" : "❌ FAIL", detail: `${favApi.methode} ${favApi.endpoint} → HTTP ${favApi.codeHTTP}`, pagesURL: "" });
  }
  const meApi = apis.find((a) => a.endpoint === "/me");
  if (urls.some((u) => u.includes("/profil")) || meApi) {
    list.push({ scenario: "👤 Profil", statut: meApi ? (meApi.codeHTTP === 200 ? "✅ PASS" : "❌ FAIL") : "🔄 Visité", detail: meApi ? `GET /me → HTTP ${meApi.codeHTTP}` : "Page visitée", pagesURL: urls.filter((u) => u.includes("/profil")).join(", ") });
  }
  if (urls.some((u) => u.includes("/admin"))) {
    list.push({ scenario: "⚙️ Administration", statut: "🔄 Visité", detail: "Dashboard admin", pagesURL: urls.filter((u) => u.includes("/admin")).join(", ") });
  }
  const pages404 = SESSION.pages.filter((p) => parseInt(p.statut) >= 400);
  if (pages404.length > 0) {
    list.push({ scenario: `🔴 Pages en erreur (${pages404.length})`, statut: "❌ BUG DÉTECTÉ", detail: pages404.map((p) => `${p.statut} → ${p.url}`).join(" | "), pagesURL: pages404.map((p) => p.url).join(", ") });
  }
  return list;
}

// ── Génération Excel ───────────────────────────────────────────────────────
async function genererExcel() {
  console.log("  📊 Écriture du fichier Excel...");
  const wb = new ExcelJS.Workbook();
  wb.creator = "TunisieBooking Live Test Recorder";
  wb.created = new Date();

  const fin    = new Date();
  const durSec = Math.round((fin - SESSION.debut) / 1000);
  const duree  = `${Math.floor(durSec / 60)}m ${durSec % 60}s`;
  const scens  = detecterScenarios();

  function headerRow(ws, color) {
    const r = ws.getRow(ws.rowCount);
    r.height = 28;
    r.eachCell((c) => {
      c.font      = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
      c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      c.alignment = { vertical: "middle", horizontal: "center" };
    });
  }
  function dataRow(ws, idx) {
    const r = ws.getRow(ws.rowCount);
    r.height = 22;
    r.eachCell({ includeEmpty: true }, (c) => {
      if (!c.fill?.fgColor?.argb || c.fill.fgColor.argb === "FFFFFF") {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "F5F7FF" : "FFFFFF" } };
      }
      c.border = { bottom: { style: "thin", color: { argb: "E0E0E0" } } };
    });
  }

  // ── 1. Résumé ────────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet("📋 Résumé", { properties: { tabColor: { argb: "16213E" } } });
  ws1.getColumn(1).width = 38; ws1.getColumn(2).width = 55;
  ws1.mergeCells("A1:B1");
  const t = ws1.getCell("A1");
  t.value = "🎥 Rapport Session — TunisieBooking Live Test Recorder";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "16213E" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws1.getRow(1).height = 36;

  const info = [
    ["📅 Date",               SESSION.debut.toLocaleDateString("fr-FR")],
    ["⏰ Début",              SESSION.debut.toLocaleTimeString("fr-FR")],
    ["⏰ Fin",                fin.toLocaleTimeString("fr-FR")],
    ["⏱️ Durée",              duree],
    ["",""],
    ["🌐 Pages visitées",     SESSION.pages.length],
    ["🎯 Actions enregistrées", SESSION.actions.length],
    ["📡 Appels API",         SESSION.apiCalls.length],
    ["✅ API succès (2xx)",    SESSION.apiCalls.filter((a) => a.codeHTTP >= 200 && a.codeHTTP < 300).length],
    ["⚠️ API erreurs (4xx)",   SESSION.apiCalls.filter((a) => a.codeHTTP >= 400 && a.codeHTTP < 500).length],
    ["❌ API erreurs (5xx)",   SESSION.apiCalls.filter((a) => a.codeHTTP >= 500).length],
    ["🔴 Erreurs JS/Page",    SESSION.erreurs.length],
    ["🔍 Scénarios détectés", scens.length],
  ];
  info.forEach(([label, val], i) => {
    const r = ws1.addRow([label, val]);
    r.height = 24;
    r.getCell(1).font = { bold: !!label, size: 11 };
    r.getCell(2).font = { size: 11 };
    const bg = i % 2 === 0 ? "EEF2FF" : "FFFFFF";
    r.getCell(1).fill = r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  });

  // ── 2. Scénarios ─────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet("🔍 Scénarios", { properties: { tabColor: { argb: "1B4332" } } });
  ws2.addRow(["#", "Scénario", "Statut", "Détail", "Pages URL"]);
  ws2.columns = [{ width: 5 }, { width: 32 }, { width: 20 }, { width: 65 }, { width: 60 }];
  headerRow(ws2, "1B4332");
  scens.forEach((s, i) => {
    ws2.addRow([i+1, s.scenario, s.statut, s.detail, s.pagesURL]);
    dataRow(ws2, i);
    const bg = s.statut.includes("PASS") ? "C6EFCE" : s.statut.includes("FAIL") || s.statut.includes("BUG") ? "FFC7CE" : "FFEB9C";
    ws2.getRow(ws2.rowCount).getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    ws2.getRow(ws2.rowCount).getCell(3).font = { bold: true, size: 10 };
    ws2.getRow(ws2.rowCount).getCell(3).alignment = { horizontal: "center", vertical: "middle" };
  });

  // ── 3. Pages visitées ─────────────────────────────────────────────────
  const ws3 = wb.addWorksheet("🌐 Pages visitées", { properties: { tabColor: { argb: "457B9D" } } });
  ws3.addRow(["#", "Titre de la page", "URL", "Statut HTTP", "Heure"]);
  ws3.columns = [{ width: 5 }, { width: 42 }, { width: 60 }, { width: 13 }, { width: 12 }];
  headerRow(ws3, "457B9D");
  SESSION.pages.forEach((p, i) => {
    ws3.addRow([p.num, p.titre, p.url, p.statut, p.heure]);
    dataRow(ws3, i);
    if (parseInt(p.statut) >= 400) {
      const r = ws3.getRow(ws3.rowCount);
      r.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7CE" } };
      r.getCell(4).font = { bold: true, color: { argb: "9C0006" } };
    }
    ws3.getRow(ws3.rowCount).getCell(4).alignment = { horizontal: "center" };
  });

  // ── 4. Actions ────────────────────────────────────────────────────────
  const ws4 = wb.addWorksheet("🎯 Actions", { properties: { tabColor: { argb: "9B59B6" } } });
  ws4.addRow(["#", "Type", "Description", "URL", "Heure"]);
  ws4.columns = [{ width: 5 }, { width: 14 }, { width: 78 }, { width: 55 }, { width: 12 }];
  headerRow(ws4, "9B59B6");
  SESSION.actions.forEach((a, i) => {
    ws4.addRow([a.num, a.type, a.description, a.url, a.heure]);
    dataRow(ws4, i);
    ws4.getRow(ws4.rowCount).getCell(2).alignment = { horizontal: "center" };
  });

  // ── 5. Appels API ─────────────────────────────────────────────────────
  const ws5 = wb.addWorksheet("📡 Appels API", { properties: { tabColor: { argb: "E67E22" } } });
  ws5.addRow([
    "#", "Méthode", "Endpoint", "Code HTTP", "Statut",
    "ID", "Nom / Titre", "Email", "Rôle", "Prix / Montant", "Message / Détails",
    "Body envoyé (JSON)", "Réponse JSON complète", "Heure"
  ]);
  ws5.columns = [
    { width: 5 },  // #
    { width: 10 }, // Méthode
    { width: 30 }, // Endpoint
    { width: 12 }, // Code HTTP
    { width: 15 }, // Statut
    { width: 10 }, // ID
    { width: 25 }, // Nom / Titre
    { width: 28 }, // Email
    { width: 12 }, // Rôle
    { width: 16 }, // Prix / Montant
    { width: 35 }, // Message / Détails
    { width: 35 }, // Body envoyé (JSON)
    { width: 50 }, // Réponse JSON complète
    { width: 12 }  // Heure
  ];
  headerRow(ws5, "E67E22");

  SESSION.apiCalls.forEach((a, i) => {
    const fields = parseApiFields(a.reponse, a.body, a.endpoint);
    ws5.addRow([
      a.num, a.methode, a.endpoint, a.codeHTTP, a.statut,
      fields.id, fields.nom, fields.email, fields.role, fields.prix, fields.message,
      a.body, a.reponse, a.heure
    ]);
    dataRow(ws5, i);

    const r = ws5.getRow(ws5.rowCount);

    // Style de la ligne
    const bg = a.codeHTTP >= 200 && a.codeHTTP < 300 ? "C6EFCE" : a.codeHTTP >= 400 ? "FFC7CE" : "FFEB9C";
    r.getCell(4).fill = r.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    r.getCell(2).font = { bold: true, size: 10 };
    r.getCell(4).alignment = r.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

    // Alignements spécifiques pour une lisibilité parfaite
    r.getCell(6).alignment = { horizontal: "center", vertical: "middle" }; // ID
    r.getCell(9).alignment = { horizontal: "center", vertical: "middle" }; // Rôle
    r.getCell(10).alignment = { horizontal: "center", vertical: "middle" }; // Prix

    // Activation du retour à la ligne pour le JSON brut complet sans tronquer
    r.getCell(12).alignment = { wrapText: true, vertical: "middle" };
    r.getCell(13).alignment = { wrapText: true, vertical: "middle" };
  });

  // ── 6. Erreurs ────────────────────────────────────────────────────────
  if (SESSION.erreurs.length > 0) {
    const ws6 = wb.addWorksheet("🔴 Erreurs", { properties: { tabColor: { argb: "C0392B" } } });
    ws6.addRow(["#", "Message d'erreur", "URL", "Heure"]);
    ws6.columns = [{ width: 5 }, { width: 80 }, { width: 55 }, { width: 12 }];
    headerRow(ws6, "C0392B");
    SESSION.erreurs.forEach((e, i) => {
      ws6.addRow([e.num, e.message, e.url, e.heure]);
      dataRow(ws6, i);
      ws6.getRow(ws6.rowCount).eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7CE" } };
      });
    });
  }

  await wb.xlsx.writeFile(OUTPUT);
  // Supprimer le backup JSON une fois l'Excel généré
  try { fs.unlinkSync(JSON_BACKUP); } catch (_) {}
  return scens.length;
}

// ── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   🎥 LIVE TEST RECORDER  —  TunisieBooking              ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  🟢 Naviguez librement dans l'application               ║");
  console.log("║  🟢 Chaque action/appel API est enregistré              ║");
  console.log("║  🔴 FERMEZ LA FENÊTRE du navigateur pour terminer       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // ── SUPPRIMER LES HANDLERS PLAYWRIGHT (ils font process.exit avant nous) ─
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");

  const browser = await chromium.launch({
    headless: false,
    slowMo:   30,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  // ── Intercepter les appels API Laravel ───────────────────────────────
  await page.route("**/*", async (route) => {
    const req    = route.request();
    const url    = req.url();
    const method = req.method();

    if (url.startsWith(API_URL)) {
      const endpoint = url.replace(API_URL, "").split("?")[0] || "/";
      let body = "";
      try { body = req.postData() || ""; } catch (_) {}
      const response = await route.fetch();
      const code     = response.status();
      let reponse    = "";
      try {
        reponse = await response.text();
      } catch (_) {}
      addApiCall(method, endpoint, body, code, reponse);
      await route.fulfill({ response });
      return;
    }
    await route.continue();
  });

  // ── Capturer les pages ────────────────────────────────────────────────
  page.on("framenavigated", async (frame) => {
    if (frame !== page.mainFrame()) return;
    const url = frame.url();
    if (!url.startsWith("http://localhost:3000")) return;
    await new Promise((r) => setTimeout(r, 500));
    let titre  = url;
    try { titre = await page.title(); } catch (_) {}
    const statut = titre.includes("404") || titre.includes("could not be found") ? "404" : "200";
    addPage(url, titre, statut);
  });

  // ── Capturer les erreurs ──────────────────────────────────────────────
  page.on("pageerror", (err) => addError(err.message, page.url()));

  // ── Injecter listener clics/formulaires ──────────────────────────────
  await page.addInitScript(() => {
    document.addEventListener("click", (e) => {
      const el   = e.target;
      const text = (el.textContent || el.value || el.alt || "").trim().slice(0, 80);
      const tag  = el.tagName || "EL";
      const href = el.href || el.closest?.("a")?.href || "";
      const btn  = (el.type === "submit" || el.tagName === "BUTTON") ? "[BTN]" : "";
      if (!text && !href) return;
      console.log(`__CLICK__ ${btn}${tag} "${text}" ${href ? "→ " + href : ""}`);
    }, true);

    document.addEventListener("submit", (e) => {
      const form = e.target;
      const fd   = new FormData(form);
      const data = {};
      for (const [k, v] of fd.entries()) {
        data[k] = k.toLowerCase().includes("password") ? "••••••••" : String(v).slice(0, 60);
      }
      console.log(`__FORM__ Soumission → ${form.action || "(SPA)"} | ${JSON.stringify(data)}`);
    }, true);
  });

  page.on("console", (msg) => {
    const txt = msg.text();
    if (txt.startsWith("__CLICK__")) addAction("Clic", txt.replace("__CLICK__ ", ""), page.url());
    else if (txt.startsWith("__FORM__")) addAction("Formulaire", txt.replace("__FORM__ ", ""), page.url());
  });

  // ── Ouvrir l'application ──────────────────────────────────────────────
  console.log(`  🌐 Ouverture de ${APP_URL}...\n`);
  try {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (e) {
    console.error(`  ❌ Impossible d'ouvrir ${APP_URL} — vérifiez que "npm run dev" est lancé\n`);
    await browser.close();
    process.exit(1);
  }

  addAction("Navigation", `Application ouverte sur ${APP_URL}`, APP_URL);
  console.log("\n  ─────────────────────────────────────────────────────────");
  console.log("  🎮 Naviguez dans l'application. Les logs apparaissent ici.");
  console.log("  🔴 FERMEZ LA FENÊTRE du navigateur pour générer le rapport.");
  console.log("  ─────────────────────────────────────────────────────────\n");

  // ── Attendre la fermeture du navigateur (UNE SEULE méthode fiable) ───
  await new Promise((resolve) => {
    browser.on("disconnected", resolve);
  });

  // ── Générer le rapport ────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   📊 SESSION TERMINÉE — Génération du rapport...        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const nbScens = await genererExcel();

  const fin    = new Date();
  const durSec = Math.round((fin - SESSION.debut) / 1000);

  console.log("  ┌─────────────────────────────────────────────────────");
  console.log(`  │  ⏱️  Durée           : ${Math.floor(durSec / 60)}m ${durSec % 60}s`);
  console.log(`  │  🌐  Pages visitées  : ${SESSION.pages.length}`);
  console.log(`  │  🎯  Actions         : ${SESSION.actions.length}`);
  console.log(`  │  📡  Appels API      : ${SESSION.apiCalls.length}`);
  console.log(`  │  🔍  Scénarios       : ${nbScens}`);
  if (SESSION.erreurs.length > 0)
    console.log(`  │  🔴  Erreurs         : ${SESSION.erreurs.length}`);
  console.log("  ├─────────────────────────────────────────────────────");
  console.log(`  │  💾  Rapport Excel   : ${OUTPUT}`);
  console.log("  └─────────────────────────────────────────────────────\n");
}

main().catch(async (err) => {
  if (SESSION.pages.length > 0 || SESSION.apiCalls.length > 0) {
    console.log("\n  ⚠️  Erreur — génération du rapport quand même...");
    try { await genererExcel(); console.log(`  💾  ${OUTPUT}`); } catch (_) {}
  }
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
