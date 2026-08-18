# 📊 Documentation Complète : Intégration et Logique de Sentry dans TunisieBooking

---

## 1. Qu'est-ce que Sentry et quelle est sa logique ?

**Sentry** est une plateforme d'**observabilité** et de **monitoring d'erreurs en temps réel** destinée aux applications web modernes. 

Contrairement aux outils de test automatisés comme **PHPUnit** ou **Playwright** qui s'exécutent en phase de développement/test :
- **Sentry intervient après le déploiement**, lorsque l'application est en ligne et utilisée par de vrais clients.
- Si un utilisateur rencontre un problème (un bouton qui plante, un appel API qui échoue, un bug d'affichage JavaScript), Sentry capture automatiquement l'exception et l'envoie sur votre tableau de bord cloud.

### 🧠 Les 3 Piliers de la Logique Sentry :

1. **Crash Reporting (Capture d'Exceptions)** : Enregistre le message d'erreur, la stack trace exacte et le fichier concerné.
2. **Breadcrumbs (Fil d'Ariane)** : Retrace la séquence d'actions effectuées par l'utilisateur juste avant le bug (ex: *Page d'accueil $\rightarrow$ Clic sur Hôtel 1 $\rightarrow$ Clic sur Réserver $\rightarrow$ CRASH*).
3. **Session Replay & Performance** : Permet de revoir visuellement ce que l'utilisateur faisait et de mesurer les temps de chargement de l'API et des composants React.

---

## 2. Architecture de l'Intégration Sentry dans `client/`

Sentry est directement intégré à l'application **Next.js 16** via le SDK officiel `@sentry/nextjs`.

```text
client/
├── next.config.ts                     # Wrapper global withSentryConfig
├── sentry.client.config.ts            # Configuration navigateur (Client-side)
├── sentry.server.config.ts            # Configuration serveur (Server-side / SSR)
├── sentry.edge.config.ts              # Configuration Edge Runtime / Middleware
├── .env.sentry-build-plugin           # Variables d'authentification Build Sentry
└── src/
    ├── instrumentation.ts             # Hook global Next.js (serveur)
    ├── instrumentation-client.ts      # Hook global Next.js (client)
    └── app/sentry-example-page/       # Page de test pré-intégrée
```

---

## 3. Détail des Fichiers et de la Configuration dans le Code

### 🅰️ 1. Wrapper de Build Next.js (`client/next.config.ts`)
Ce fichier enveloppe la configuration globale de Next.js pour injecter le plugin de build Sentry (upload automatique des *Source Maps*).

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

// Sentry n'est enveloppé QU'EN PRODUCTION (pour éviter les conflits Turbopack en dev)
export default process.env.NODE_ENV === "production"
  ? withSentryConfig(nextConfig, {
      org: "tunisie-booking",
      project: "javascript-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
```
> 💡 **Raison de la condition `NODE_ENV === "production"`** : En mode développement (`npm run dev`), Turbopack effectue des recompilations très fréquentes. Activer Sentry en dev causait des surcharges mémoire. Le filtrer sur la production garantit une vitesse de dev maximale.

---

### 🅱️ 2. Configuration Navigateur (`sentry.client.config.ts` & `src/instrumentation-client.ts`)
S'exécute dans le navigateur de l'utilisateur dès le chargement d'une page HTML/React.

* **DSN configuré** : `https://69fc91f954834765884bce7a9f873ebe@o4511668502265856.ingest.de.sentry.io/4511668536803408`
* **Features activées** :
  - `tracesSampleRate: 1` : Capture 100% des traces de performance.
  - `replaysOnErrorSampleRate: 1.0` : Enregistre une vidéo Replay de 100% des sessions où une erreur survient.
  - `integrations: [Sentry.replayIntegration()]` : Active le module Replay visuel.

---

### 🅲 3. Configuration Côté Serveur (`sentry.server.config.ts`)
S'exécute lorsque Next.js effectue du rendu côté serveur (SSR) ou exécute des Server Actions / API Routes.

```typescript
import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://69fc91f954834765884bce7a9f873ebe@o4511668502265856.ingest.de.sentry.io/4511668536803408",
    tracesSampleRate: 1,
    enableLogs: true,
  });
}
```

---

### 🅳 4. Hooks d'Instrumentation Next.js (`src/instrumentation.ts`)
Next.js utilise ce hook système pour capturer les erreurs globales non gérées du serveur et router les exceptions.

```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError =
  process.env.NODE_ENV === "production" ? Sentry.captureRequestError : () => {};
```

---

### 🅴 5. Page de Test Dédiée (`src/app/sentry-example-page/page.tsx`)
Une page minimale créée spécialement pour valider l'envoi d'exceptions vers Sentry :

```typescript
"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  useEffect(() => {
    const err = new Error("Sentry frontend test: sentry-example-page");
    Sentry.captureException(err);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Sentry example</h1>
      <p>If Sentry is working, an event should appear in your Sentry project.</p>
    </main>
  );
}
```

---

## 4. Procédure pour Tester et Valider Sentry

Pour tester Sentry dans les conditions réelles :

1. **Créer le Build de Production** :
   ```bash
   cd client
   npm run build
   npm run start
   ```
2. **Déclencher le Test** :
   Ouvrez votre navigateur sur : `http://localhost:3000/sentry-example-page`
3. **Consulter votre Dashboard Sentry** :
   - Allez sur **[sentry.io](https://sentry.io)**.
   - Ouvrez l'organisation **`tunisie-booking`** et le projet **`javascript-nextjs`**.
   - L'événement apparaît instantanément avec la stack trace complète !

---

## 📊 Récapitulatif Global de la Qualité du Projet

| Module de Test | Outil | Rôle | Statut actuel |
|---|---|---|:---:|
| **Tests Unitaires** | PHPUnit | Logique Backend Laravel | **78/78 PASS (100%)** |
| **Tests Data-Driven** | Node.js + ExcelJS | Validation API réelles | **14/14 PASS (100%)** |
| **Tests End-to-End** | Playwright | Parcours Utilisateur complet | **17/17 PASS (100%)** |
| **Observabilité Prod** | Sentry | Capture des erreurs en direct | **Opérationnel (Prod)** |
