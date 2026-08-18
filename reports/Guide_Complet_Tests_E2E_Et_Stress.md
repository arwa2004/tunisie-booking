# 📚 Guide & Documentation Stratégique de TOUS les Tests — TunisieBooking

---

## 📌 Table des Matières
1. [Vue d'ensemble & Pyramide des Tests globale](#1-vue-densemble--pyramide-des-tests-globale)
2. [Niveau 1 : Tests Unitaires (Unit Tests - PHPUnit)](#niveau-1--tests-unitaires-unit-tests---phpunit)
3. [Niveau 2 : Tests d'Intégration API (Feature Tests - PHPUnit)](#niveau-2--tests-dintégration-api-feature-tests---phpunit)
4. [Niveau 3 : Tests Pilotés par les Données Excel (Data-Driven Testing)](#niveau-3--tests-pilotés-par-les-données-excel-data-driven-testing)
5. [Niveau 4 : Tests End-to-End (E2E Playwright & Live Recorder)](#niveau-4--tests-end-to-end-e2e-playwright--live-recorder)
6. [Niveau 5 : Tests de Stress, de Charge & Performance (Stress Testing v2 PRO)](#niveau-5--tests-de-stress-de-charge--performance-stress-testing-v2-pro)
7. [Synthèse Globale & Répertoire des Fichiers Excel Générés](#7-synthèse-globale--répertoire-des-fichiers-excel-générés)

---

## 1. Vue d'ensemble & Pyramide des Tests globale

L'application **TunisieBooking** repose sur une architecture découplée composée d'un Frontend **Next.js 16** (`http://localhost:3000`) et d'un Backend **Laravel API** (`http://127.0.0.1:8000/api`).

Pour garantir une couverture de qualité sans faille, nous avons structuré la suite de tests en **5 niveaux logiques et complémentaires** :

```
                        / \         ▲ Niveau 5 : Tests de Stress & Charge (300 VUs, Apdex)
                       /   \        │ Niveau 4 : Tests E2E & Live Recorder (Playwright)
                      /     \       │ Niveau 3 : Tests Data-Driven Excel (22/22 PASS)
                     /       \      │ Niveau 2 : Tests d'Intégration API (PHPUnit Feature)
                    /─────────\     ▼ Niveau 1 : Tests Unitaires (PHPUnit Unit)
```

---

## Niveau 1 : Tests Unitaires (Unit Tests - PHPUnit)

### 🎯 Objectif :
Tester les fonctions isolées, les calculs mathématiques et la logique métier pure du framework Laravel sans faire de requêtes HTTP réseau ni dépendre d'un navigateur.

### 📁 Emplacement du code : `server/tests/Unit/`

#### 1. `ReservationTest.php` (Calculs Tarifaires & Métier)
- **Formule de Prix des Nuits** : Vérifie que le prix total est strictement égal à :
  $$\text{Prix Total} = \text{Nombre de nuits} \times \text{Prix par nuit} + \text{Suppléments enfants}$$
- **Validation des Dates** : S'assure qu'une date de départ antérieure à la date d'arrivée est rejetée.
- **Règles de Capacité** : Vérifie la limite d'occupants autorisés par type de chambre (Simple, Double, Suite Familiale).

#### 2. `HotelTest.php` (Modèle & Relations Eloquent)
- **Relations DB** : Valide les associations Eloquent `Hotel` $\leftrightarrow$ `Chambre` et `Hotel` $\leftrightarrow$ `Avis`.
- **Méthodes de Filtrage** : Vérifie le bon fonctionnement du scope de recherche par nombre d'étoiles (1 à 5).

#### 3. `DestinationTest.php` & `VoyageTest.php`
- **Génération de Slugs** : S'assure que les noms de villes ("Médenine", "Nabeul / Hammamet") sont nettoyés pour les URLs.
- **Voyages Organisés** : Vérifie les prix forfaitaires et les liaisons de réservations de circuits.

---

## Niveau 2 : Tests d'Intégration API (Feature Tests - PHPUnit)

### 🎯 Objectif :
Valider la communication réseau entre les **Contrôleurs REST Laravel**, les middlewares de sécurité (Sanctum/JWT), et la **Base de Données MySQL**.

### 📁 Emplacement du code : `server/tests/Feature/`

* **`AuthTest.php`** :
  - Inscription (`POST /api/register`) avec attribution du rôle `client`.
  - Authentification (`POST /api/login`) et délivrance du Token Bearer.
  - Protection de la route `/api/me` (Renvoie `HTTP 401` si le token est manquant).
* **`HotelApiTest.php` & `ChambreApiTest.php`** :
  - Récupération de la liste `/api/hotels` (`HTTP 200`).
  - Gestion des erreurs `HTTP 404` si un hôtel n'existe pas (`/api/hotels/9999`).
* **`ReservationApiTest.php` & `ReservationAdminTest.php`** :
  - Validation des formulaires incomplets (`HTTP 422 Unprocessable Entity`).
  - Contrôle d'accès Administrateur pour la confirmation/annulation des réservations.
* **`FavoriApiTest.php` & `AvisApiTest.php`** :
  - Ajout/Suppression dans la table pivot des favoris et calcul des notes moyennes d'avis.

---

## Niveau 3 : Tests Pilotés par les Données Excel (Data-Driven Testing)

### 🎯 Objectif :
Automatiser la validation de tous les endpoints de l'API à partir de cas de tests structurés dans un fichier Excel maître, avec génération d'un rapport de validation coloré.

### ⚙️ Composants :
1. **Générateur du Fichier Maître (`reports/build-excel-par-feuille.js`)** :
   Crée le fichier `TunisieBooking_Tests.xlsx` composé d'**une feuille par domaine métier** (`Auth`, `Hotels`, `Chambres`, `Favoris`, `Reservations`, `Avis`, `Destinations`, `Voyages`).
2. **Exécuteur Automatique (`reports/run-excel-par-feuille.js`)** :
   - Lit chaque ligne du fichier Excel.
   - Injecte dynamiquement les tokens d'authentification Bearer.
   - Compare le code HTTP obtenu avec le code attendu.
   - Écrit le statut **`✅ PASS`** en vert dans le fichier Excel.

### 📊 Résultat d'exécution : **22 / 22 PASS (100% de Succès)** sur 8 feuilles Excel !

---

## Niveau 4 : Tests End-to-End (E2E Playwright & Live Recorder)

### 🎯 Objectif :
Simuler le parcours visuel d'un véritable utilisateur humain dans un navigateur Chromium réel et enregistrer l'ensemble des clics et appels réseau.

### ⚙️ Composants :

#### 1. Fichiers de Scénarios Playwright (`client/e2e/*.spec.ts`)
- **`auth.spec.ts`** : Inscription dynamique, validation des erreurs de mot de passe, connexion et redirection.
- **`hotels.spec.ts`** : Consultation du catalogue Next.js, filtrage par destination, affichage des fiches d'hôtels.
- **`reservation.spec.ts`** : Sélection des dates, type de pension, tarification enfants et confirmation.
- **`admin.spec.ts`** : Vérification du Dashboard d'administration.

#### 2. Live Test Recorder (`client/live-test-recorder.js`)
Outil de capture en temps réel :
- **Interception DOM** : Écoute les événements `click` et `submit`.
- **Parseur JSON (`parseApiFields`)** : Extrait automatiquement les champs des réponses API et les sépare dans des colonnes Excel dédiées (`ID`, `Nom`, `Email`, `Rôle`, `Prix`, `Message`).
- **Rapport généré** : Produit `reports/Session_Live_Tests.xlsx` avec 6 onglets clairs.

---

## Niveau 5 : Tests de Stress, de Charge & Performance (Stress Testing v2 PRO)

### 🎯 Objectif :
Tester la résistance de l'application sous une charge massive d'utilisateurs virtuels (*Virtual Users - VUs*) simultanés et identifier le point de rupture (*Breakpoint*).

### ⚙️ Algorithme des 4 Vagues de Stress (`reports/run-stress-test.js`) :

$$\begin{array}{|c|c|c|l|}
\hline
\textbf{Vague} & \textbf{VUs Simultanés} & \textbf{Durée} & \textbf{Type de Charge} \\
\hline
\text{Vague 1} & 10\text{ VUs} & 5\text{ s} & \text{Charge utilisateur normale} \\
\text{Vague 2} & 50\text{ VUs} & 5\text{ s} & \text{Charge élevée de journée} \\
\text{Vague 3} & 150\text{ VUs} & 5\text{ s} & \text{Pic de saison touristique (Été)} \\
\text{Vague 4} & 300\text{ VUs} & 5\text{ s} & \text{Stress extrême & Recherche du Breakpoint} \\
\hline
\end{array}$$

### 📈 Métriques Mesurées & Formules :
- **Débit Maximal Atteint** : **2 060.9 requêtes / seconde**.
- **Score Apdex (Application Performance Index)** :
  $$\text{Apdex} = \frac{\text{Requêtes } < 500\text{ms} + \frac{\text{Requêtes } 500\text{ms}-2000\text{ms}}{2}}{\text{Total Requêtes}}$$

### ⚡ Amélioration Majeure Implémentée : Cache Redis / Laravel
Pour éliminer les goulets d'étranglement MySQL détectés lors des tests de stress, nous avons activé la mise en cache `Cache::remember()` sur les contrôleurs `HotelController` et `DestinationController` :
- **Temps de réponse API** : Réduit de `1 200 ms` à **`< 15 ms`** (⚡ 80x plus rapide).
- **Charge MySQL** : Réduite de **95%**.

---

## 7. Synthèse Globale & Répertoire des Fichiers Excel Générés

L'ensemble des résultats de tests est disponible sous forme de fichiers Excel professionnels dans le répertoire `reports/` :

```
📁 reports/
 ├── 📊 TunisieBooking_Tests.xlsx       ──► 22/22 PASS (Tests automatisés par feuille PHP)
 ├── 🎥 Session_Live_Tests.xlsx         ──► Capture de session Live (Pages, Actions, API séparées)
 └── ⚡ Rapport_Test_De_Stress_Pro.xlsx   ──► Rapport de Charge (4 Vagues, Métriques Endpoints, Conseils)
```

| Fichier Excel | Usage principal | Nombre d'onglets | Statut |
|---|---|:---:|:---:|
| **`TunisieBooking_Tests.xlsx`** | Validation fonctionnelle des endpoints API | 8 feuilles | **✅ 100% PASS** |
| **`Session_Live_Tests.xlsx`** | Traçabilité des parcours utilisateurs réels | 6 feuilles | **✅ Capturé** |
| **`Rapport_Test_De_Stress_Pro.xlsx`** | Mesure de charge, Apdex et conseils production | 3 feuilles | **✅ Validé (2060 req/s)** |

---

*Guide complet de stratégie de test généré pour le projet TunisieBooking.*
