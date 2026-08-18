# 🚀 Guide & Résumé de la Mise en Place de Playwright E2E — TunisieBooking

---

## 1. Concept & Objectif

**Playwright** est un framework moderne de test **End-to-End (E2E)** développé par Microsoft. 
Dans votre projet, il pilote automatiquement un vrai navigateur (Chrome / Chromium) pour vérifier que toutes les fonctionnalités frontend et backend s'enchaînent correctement, du point de vue de l'utilisateur final.

---

## 2. Architecture des Fichiers dans `client/`

L'infrastructure de test E2E est entièrement intégrée dans le dossier frontend `client/` :

```text
client/
├── playwright.config.ts        # Configuration globale de Playwright
└── e2e/                        # Dossier contenant tous les scénarios E2E
    ├── admin.spec.ts           # Tests de sécurité & administration (3 tests)
    ├── auth.spec.ts            # Tests du parcours authentification (6 tests)
    ├── hotels.spec.ts          # Tests d'accueil, recherche & affichage (5 tests)
    └── reservation.spec.ts     # Tests du parcours de réservation (3 tests)
```

---

## 3. Étapes d'Installation & de Configuration

### Étape A — Configuration du Runner (`playwright.config.ts`)
Nous avons configuré Playwright pour orchestrer automatiquement le serveur Next.js :

* **Serveur de Dev Automatique (`webServer`)** : 
  Playwright lance automatiquement `npm run dev` (sur `http://localhost:3000`) si le serveur n'est pas déjà démarré, et le réutilise s'il est actif (`reuseExistingServer: true`).
* **Stabilité (1 Worker)** : 
  Exécution séquentielle des tests (1 seul worker à la fois) afin d'éviter les conflits d'accès simultanés et les surcharges mémoire.
* **Captures et Vidéos en cas d'échec** : 
  Génération automatique de captures d'écran et de vidéos dès qu'un test échoue pour faciliter le débogage.

### Étape B — Optimisation de l'Environnement Dev
Pour garantir la fluidité des tests sans interruption ni plantage mémoire :
* **Désactivation de Sentry en Mode Dev** (`next.config.ts` & `src/instrumentation.ts`) : 
  Sentry n'est activé qu'en `production`, éliminant les fuites de mémoire lors du rechargement de Turbopack.

---

## 4. Stratégie d'Isolation des Sessions (`beforeEach`)

Un défi classique en E2E est la réutilisation indésirable de la session (ex: le token JWT stocké dans le `localStorage` par un test d'inscription qui pollue le test suivant).

**La solution mise en place** :
Avant chaque test, nous exécutons un script d'initialisation du navigateur pour vider la mémoire locale :

```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

---

## 5. Détail des 4 Fichiers de Tests (`e2e/*.spec.ts`)

| Fichier Spec | Cas de Tests Couverts | Nombre de Tests |
|---|---|:---:|
| `auth.spec.ts` | • Inscription d'un nouveau compte<br>• Validation du mot de passe trop court<br>• Connexion avec identifiants valides<br>• Message d'erreur sur mauvais identifiants<br>• Liens de redirection Login/Register | **6 tests** |
| `hotels.spec.ts` | • Structure de l'Accueil (Titre, Navbar, Footer, Sections)<br>• Liens vers la liste complète des hôtels<br>• Chargement de la page `/hotels`<br>• Navigation vers la fiche détaillée d'un hôtel<br>• Présence du composant `SearchBoxAdvanced` | **5 tests** |
| `reservation.spec.ts` | • Affichage dynamique des chambres sur la fiche hôtel<br>• Présence des champs de sélection de dates<br>• Sécurité : redirection vers `/login` en cas de clic sur "Réserver" sans authentification | **3 tests** |
| `admin.spec.ts` | • Redirection forcée de `/admin` vers `/login` si non connecté<br>• Protection des sous-routes admin (`/admin/hotels`, `/admin/destinations`, etc.)<br>• Protection de la page `/profil` | **3 tests** |

---

## 6. Comment Lancer et Utiliser les Tests

### 1. Mode Ligne de Commande (CI / Terminal)
Lance tous les tests rapidement dans le terminal et génère un rapport HTML :
```bash
cd client
npx playwright test
```
*Pour ouvrir le rapport HTML après exécution :* `npx playwright show-report`

### 2. Mode Interface Graphique Interactive (UI Mode)
Ouvre le panneau de contrôle visuel interactif :
```bash
cd client
npx playwright test --ui
```
Ce mode permet de :
- Lancer les tests un par un ou tous ensemble avec le bouton **Play** ▶️.
- Revoir la vidéo pas à pas de chaque clic.
- Tester vos sélecteurs CSS/XPath en direct avec l'outil **Locator**.

---

## 📊 Bilan Synthétique
* **Total des scénarios E2E** : **17 tests**
* **Taux de réussite** : **100% PASS (17/17)**
* **Temps d'exécution total** : ~1 min 30 s
