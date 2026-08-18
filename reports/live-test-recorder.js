/**
 * live-test-recorder.js
 * ---------------------------------------------------------------------------
 * 🎥 Outil "Live Test Recorder" - Enregistre vos actions de navigation en
 *    temps réel et génère un rapport Excel.
 *
 * PRINCIPE :
 *   1. Ouvre un navigateur Chromium avec l'application Next.js
 *   2. Intercepte les appels API (requêtes/réponses)
 *   3. Enregistre chaque page visitée, chaque clic, chaque action
 *   4. Quand vous fermez le navigateur → génère un fichier Excel complet
 *
 * USAGE :
 *   1. Démarrer l'application : cd client && npm run dev
 *   2. Lancer ce script : node reports/live-test-recorder.js
 *   3. Naviguer dans l'application (inscription, réservation, admin...)
 *   4. Fermer le navigateur → le fichier Excel sera généré automatiquement
 * ---------------------------------------------------------------------------
 */

const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  APP_URL: "http://localhost:3000",
  API_URL: "http://127.0.0.1:8000/api",
  OUTPUT_XLSX: path.resolve(__dirname, "session-tests-enregistres.xlsx"),
  HEADLESS: false,              // Navigateur visible pour que vous puissiez interagir
  SLOW_MO: 50,                  // Ralentissement (ms) pour visualiser les actions
  RECORD_VIDEO: true,           // Enregistrer la vidéo de la session
};

// ============================================================================
// STRUCTURE DE DONNÉES
// ============================================================================
const session = {
  startTime: new Date().toISOString(),
  pages: [],          // Pages visitées : { url, title, timestamp }
  apiCalls: [],       // Appels API : { method, endpoint, requestBody, responseStatus, responseData, timestamp }
  actions: [],        // Actions utilisateur : { type, description, url, timestamp }
  errors: [],         // Erreurs rencontrées : { message, url, timestamp }
};

// ============================================================================
// FONCTIONS DE LOGGING
// ============================================================================
function logPageVisit(page, url, title) {
  session.pages.push({
    url,
    title: title || "(pas de titre)",
    timestamp: new Date().toISOString(),
  });
  console.log(`📍 Page : ${title || url}`);
}

function logAction(type, description, url) {
  session.actions.push({
    type,
    description,
    url,
    timestamp: new Date().toISOString(),
  });
  console.log(`  🎯 [${type}] ${description}`);
}

function logApiCall(method, endpoint, requestBody, responseStatus, responseData) {
  const entry = {
    method,
    endpoint,
    requestBody: requestBody || "(aucun body)",
    responseStatus,
    responseData:
      typeof responseData === "object"
        ? JSON.stringify(responseData).slice(0, 500)
        : String(responseData).slice(0, 500),
    timestamp: new Date().toISOString(),
  };
  session.apiCalls.push(entry);

  const icon = responseStatus >= 200 && responseStatus < 300 ? "✅" : "❌";
  console.log(`  ${icon} API ${method} ${endpoint} → ${responseStatus}`);
}

function logError(message, url) {
  session.errors.push({
    message,
    url,
    timestamp: new Date().toISOString(),
  });
  console.log(`  🔴 ERREUR : ${message}`);
}

// ============================================================================
// GÉNÉRATION DU FICHIER EXCEL
// ============================================================================
function generateExcel() {
  const workbook = xlsx.utils.book_new();
  const now = new Date().toLocaleString("fr-FR");

  // --- Feuille 1 : Résumé de la session ---
  const resumeData = [
    { Info: "Session de test", Valeur: now },
    { Info: "Durée", Valeur: "" },
    { Info: "Pages visitées", Valeur: session.pages.length },
    { Info: "Appels API", Valeur: session.apiCalls.length },
    { Info: "Actions utilisateur", Valeur: session.actions.length },
    { Info: "Erreurs", Valeur: session.errors.length },
  ];
  const wsResume = xlsx.utils.json_to_sheet(resumeData);
  xlsx.utils.book_append_sheet(workbook, wsResume, "Résumé");

  // --- Feuille 2 : Pages visitées ---
  if (session.pages.length > 0) {
    const pagesData = session.pages.map((p, i) => ({
      "#": i + 1,
      URL: p.url,
      Titre: p.title,
      Heure: new Date(p.timestamp).toLocaleTimeString("fr-FR"),
    }));
    const wsPages = xlsx.utils.json_to_sheet(pagesData);
    wsPages["!cols"] = [{ wch: 4 }, { wch: 60 }, { wch: 40 }, { wch: 12 }];
    xlsx.utils.book_append_sheet(workbook, wsPages, "Pages visitées");
  }

  // --- Feuille 3 : Actions utilisateur ---
  if (session.actions.length > 0) {
    const actionsData = session.actions.map((a, i) => ({
      "#": i + 1,
      Type: a.type,
      Description: a.description,
      URL: a.url,
      Heure: new Date(a.timestamp).toLocaleTimeString("fr-FR"),
    }));
    const wsActions = xlsx.utils.json_to_sheet(actionsData);
    wsActions["!cols"] = [{ wch: 4 }, { wch: 20 }, { wch: 60 }, { wch: 50 }, { wch: 12 }];
    xlsx.utils.book_append_sheet(workbook, wsActions, "Actions");
  }

  // --- Feuille 4 : Appels API ---
  if (session.apiCalls.length > 0) {
    const apiData = session.apiCalls.map((a, i) => ({
      "#": i + 1,
      Méthode: a.method,
      Endpoint: a.endpoint,
      "Body requête": a.requestBody,
      "Statut réponse": a.responseStatus,
      "Données réponse": a.responseData,
      Heure: new Date(a.timestamp).toLocaleTimeString("fr-FR"),
    }));
    const wsApi = xlsx.utils.json_to_sheet(apiData);
    wsApi["!cols"] = [
      { wch: 4 }, { wch: 8 }, { wch: 50 }, { wch: 40 },
      { wch: 14 }, { wch: 60 }, { wch: 12 },
    ];
    xlsx.utils.book_append_sheet(workbook, wsApi, "Appels API");
  }

  // --- Feuille 5 : Erreurs ---
  if (session.errors.length > 0) {
    const errorsData = session.errors.map((e, i) => ({
      "#": i + 1,
      Erreur: e.message,
      URL: e.url,
      Heure: new Date(e.timestamp).toLocaleTimeString("fr-FR"),
    }));
    const wsErrors = xlsx.utils.json_to_sheet(errorsData);
    wsErrors["!cols"] = [{ wch: 4 }, { wch: 80 }, { wch: 50 }, { wch: 12 }];
    xlsx.utils.book_append_sheet(workbook, wsErrors, "Erreurs");
  }

  // --- Feuille 6 : Scénarios détectés automatiquement ---
  const scenarios = detectScenarios();
  if (scenarios.length > 0) {
    const scenariosData = scenarios.map((s, i) => ({
      "#": i + 1,
      Scénario: s.name,
      Statut: s.statut,
      Détail: s.detail,
      Pages: s.pages.join(" → "),
    }));
    const wsScenarios = xlsx.utils.json_to_sheet(scenariosData);
    wsScenarios["!cols"] = [
      { wch: 4 }, { wch: 35 }, { wch: 14 }, { wch: 60 }, { wch: 80 },
    ];
    xlsx.utils.book_append_sheet(workbook, wsScenarios, "Scénarios détectés");
  }

  xlsx.writeFile(workbook, CONFIG.OUTPUT_XLSX);
  console.log("\n✅ Fichier Excel généré : " + CONFIG.OUTPUT_XLSX);
  console.log(`   Pages visitées : ${session.pages.length}`);
  console.log(`   Actions : ${session.actions.length}`);
  console.log(`   Appels API : ${session.apiCalls.length}`);
  if (session.errors.length > 0) {
    console.log(`   ⚠️  Erreurs détectées : ${session.errors.length}`);
  }
}

// ============================================================================
// DÉTECTION AUTOMATIQUE DE SCÉNARIOS
// ============================================================================
function detectScenarios() {
  const scenarios = [];
  const urls = session.pages.map((p) => p.url);
  const apiEndpoints = session.apiCalls.map((a) => a.endpoint);

  // Vérifier Connexion
  if (urls.some((u) => u.includes("/login"))) {
    const loginApi = session.apiCalls.find((a) => a.endpoint === "/login");
    scenarios.push({
      name: "🔐 Connexion",
      statut: loginApi?.responseStatus === 200 || apiEndpoints.some((e) => e.includes("login")) ? "✅ Testé" : "🔄 Navigué",
      detail: loginApi
        ? `POST /login → ${loginApi.responseStatus}`
        : "Page visitée mais peut-être pas soumise",
      pages: urls.filter((u) => u.includes("/login")),
    });
  }

  // Vérifier Inscription
  if (urls.some((u) => u.includes("/register"))) {
    scenarios.push({
      name: "📝 Inscription",
      statut: "🔄 Navigué",
      detail: "Page d'inscription visitée",
      pages: urls.filter((u) => u.includes("/register")),
    });
  }

  // Vérifier Réservation
  if (
    apiEndpoints.some((e) => e.includes("/reservations")) &&
    session.apiCalls.some((a) => a.method === "POST" && a.endpoint.includes("reservations"))
  ) {
    const resApi = session.apiCalls.find(
      (a) => a.method === "POST" && a.endpoint.includes("reservations")
    );
    scenarios.push({
      name: "🏨 Réservation",
      statut: resApi?.responseStatus === 201 ? "✅ Testé" : "❌ Erreur",
      detail: resApi
        ? `POST /reservations → ${resApi.responseStatus}`
        : "Appel API de réservation détecté",
      pages: urls.filter((u) => u.includes("/hotels/") || u.includes("/reservations")),
    });
  }

  // Vérifier Hotêls
  if (apiEndpoints.some((e) => e.includes("/hotels"))) {
    scenarios.push({
      name: "🏢 Consultation hôtels",
      statut: "✅ Testé",
      detail: `API /hotels accessible (${session.apiCalls.filter((a) => a.endpoint.includes("/hotels")).length} appels)`,
      pages: urls.filter((u) => u.includes("/hotels")),
    });
  }

  // Vérifier Profil
  if (urls.some((u) => u.includes("/profil")) || apiEndpoints.some((e) => e.includes("/me"))) {
    scenarios.push({
      name: "👤 Profil",
      statut: "✅ Testé",
      detail: "Page profil ou API /me consultée",
      pages: urls.filter((u) => u.includes("/profil")),
    });
  }

  // Vérifier Admin
  if (urls.some((u) => u.includes("/admin"))) {
    scenarios.push({
      name: "⚙️ Administration",
      statut: "🔄 Navigué",
      detail: "Dashboard admin visité",
      pages: urls.filter((u) => u.includes("/admin")),
    });
  }

  // Vérifier les erreurs
  const errorApis = session.apiCalls.filter((a) => a.responseStatus >= 400);
  for (const err of errorApis) {
    scenarios.push({
      name: `❌ Erreur ${err.responseStatus}`,
      statut: "❌ Erreur",
      detail: `${err.method} ${err.endpoint} → ${err.responseStatus}`,
      pages: [],
    });
  }

  return scenarios;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================
async function main() {
  console.log("🎥 LIVE TEST RECORDER - TunisieBooking");
  console.log("=".repeat(50));
  console.log(`📡 Application : ${CONFIG.APP_URL}`);
  console.log(`📡 API : ${CONFIG.API_URL}`);
  console.log(`📁 Excel : ${CONFIG.OUTPUT_XLSX}`);
  console.log("=".repeat(50));
  console.log("\n🟢 Le navigateur va s'ouvrir. Naviguez dans l'application.");
  console.log("🟢 Chaque action sera enregistrée automatiquement.");
  console.log("🟢 Fermez le navigateur quand vous avez terminé.\n");

  const browser = await chromium.launch({
    headless: CONFIG.HEADLESS,
    slowMo: CONFIG.SLOW_MO,
  });

  const contextOptions = {};
  if (CONFIG.RECORD_VIDEO) {
    contextOptions.recordVideo = {
      dir: path.resolve(__dirname, "../test-results/videos"),
      size: { width: 1280, height: 720 },
    };
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // --- Intercepter les appels API ---
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const endpoint = url.replace(CONFIG.API_URL, "").split("?")[0];

    let requestBody = null;
    if (request.postData()) {
      try {
        requestBody = JSON.parse(request.postData());
        requestBody = JSON.stringify(requestBody);
      } catch {
        requestBody = request.postData();
      }
    }

    // Continuer la requête
    const response = await route.fetch();
    const responseStatus = response.status();
    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      try {
        responseData = await response.text();
      } catch {
        responseData = "(binaire ou vide)";
      }
    }

    logApiCall(method, endpoint, requestBody, responseStatus, responseData);
  });

  // --- Capturer les navigations ---
  page.on("load", async () => {
    const url = page.url();
    const title = await page.title();
    logPageVisit(page, url, title);
  });

  // --- Capturer les clics ---
  page.on("click", async (event) => {
    // On ne peut pas capturer les clics directs facilement avec Playwright,
    // on utilise plutôt un script injecté dans la page
  });

  // --- Capturer les erreurs console ---
  page.on("pageerror", (error) => {
    logError(error.message, page.url());
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      logError(msg.text(), page.url());
    }
  });

  // --- Injecter un script qui écoute les clics utilisateur ---
  await page.addInitScript(() => {
    // Intercepter les clics sur les liens et boutons
    document.addEventListener("click", (e) => {
      const target = e.target;
      const tag = target.tagName || "";
      const text = target.textContent?.trim()?.slice(0, 100) || "";
      const id = target.id || "";
      const className = target.className?.toString()?.slice(0, 50) || "";
      const href = target.href || target.closest("a")?.href || "";
      const action = target.closest("form")?.action || "";

      const data = {
        type: "click",
        tag,
        text,
        id,
        className,
        href: href.slice(0, 200),
        formAction: action.slice(0, 200),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Envoyer via console.log spécial
      console.log("__LIVE_RECORDER__" + JSON.stringify(data));
    });

    // Intercepter les soumissions de formulaire
    document.addEventListener("submit", (e) => {
      const form = e.target;
      const formData = new FormData(form);
      const inputs = {};
      for (const [key, value] of formData.entries()) {
        inputs[key] = value.toString().slice(0, 100);
      }

      const data = {
        type: "form_submit",
        action: form.action || "",
        inputs: JSON.stringify(inputs),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      console.log("__LIVE_RECORDER__" + JSON.stringify(data));
    });
  });

  // --- Écouter les logs injectés ---
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.startsWith("__LIVE_RECORDER__")) {
      try {
        const data = JSON.parse(text.replace("__LIVE_RECORDER__", ""));
        if (data.type === "click") {
          let description = `Clic sur ${data.tag}`;
          if (data.text) description += ` "${data.text}"`;
          if (data.href) description += ` → ${data.href.slice(0, 80)}`;
          logAction("Clic", description, data.url);
        } else if (data.type === "form_submit") {
          logAction(
            "Formulaire",
            `Soumission de formulaire → ${data.action.slice(0, 80)} (${data.inputs.slice(0, 100)})`,
            data.url
          );
        }
      } catch {
        // Ignorer si le parsing échoue
      }
    }
  });

  // --- Ouvrir l'application ---
  await page.goto(CONFIG.APP_URL, { waitUntil: "networkidle" });
  logPageVisit(page, CONFIG.APP_URL, await page.title());
  logAction("Navigation", "Ouverture de l'application", CONFIG.APP_URL);

  console.log("\n🟢 Navigateur ouvert. Vous pouvez maintenant interagir avec l'application.");
  console.log("🟢 Toutes vos actions sont enregistrées.");
  console.log("🟢 Fermez simplement la fenêtre du navigateur quand vous avez fini.\n");

  // --- Attendre que l'utilisateur ferme le navigateur ---
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (context.pages().length === 0 || context.pages().every((p) => p.isClosed())) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
  });

  // --- Fermer et générer le rapport ---
  await context.close();
  await browser.close();

  console.log("\n📊 Génération du rapport Excel...");
  generateExcel();
  console.log("\n✨ Session terminée ! Fichier Excel prêt.");
  console.log("   📁 " + CONFIG.OUTPUT_XLSX);
}

main().catch((err) => {
  console.error("❌ Erreur fatale :", err);
  process.exit(1);
});

