# 🏨 TunisieBooking — Version Monolithique
> **Plateforme de Réservation Hôtelière en Tunisie (Laravel 11 + Next.js 14 + MySQL 8.0)**  
> **Auteur :** Arwa Ben Amar | **Organisme d'accueil :** Spring Travel Services (TunisieBooking)

---

## 📌 Présentation
Cette branche (`main` / `monolithic`) contient la version **monolithique en deux tiers (MVC / API REST)** de la plateforme **TunisieBooking**.  
L'application associe un backend **Laravel 11 (API REST)** sécurisé par **Sanctum**, un frontend **Next.js 14 (App Router / TypeScript)** et une base de données relationnelle **MySQL 8.0**.

---

## 📐 Schéma & Détail de l'Architecture Monolithique

### 1. Vue d'Ensemble de l'Architecture
```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            NAVIGATEUR CLIENT                            │
 │                        (Utilisateur Web / Mobile)                       │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTP / HTTPS (JSON)
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   COUCHE FRONTEND — Next.js 14 (Port 3000)               │
 │  • App Router (React Server Components) & TypeScript strict             │
 │  • NextAuth.js (Gestion de la session côté client)                      │
 │  • Tailwind CSS (Interface utilisateur responsive)                      │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ Requêtes API REST JSON
                                      │ Authorization: Bearer <Token_Sanctum>
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   COUCHE BACKEND — Laravel 11 (Port 8000)                │
 │  • Architecture MVC & Contrôleurs API REST                              │
 │  • Laravel Sanctum (Authentification par jetons JWT / Bearer Tokens)    │
 │  • Middlewares de Sécurité (EnsureUserIsAdmin, Throttle Rate Limiting) │
 │  • Eloquent ORM (Mappage objet-relationnel & Validations métier)       │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ Requêtes SQL / PDO
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                 BASE DE DONNÉES RELATIONNELLE — MySQL 8.0               │
 │  • Nom : tunisie_booking (Port 3306)                                   │
 │  • 22 Migrations SQL · 11 Tables Métier                                │
 │  • Clés étrangères & Contraintes d'intégrité référentielle               │
 └─────────────────────────────────────────────────────────────────────────┘
```

### 2. Découpage en Couches Logicielles

* **Couche Présentation (Frontend Next.js 14 - Port 3000) :**
  - Interfaces utilisateurs SSR (Server-Side Rendering) et CSR (Client-Side Rendering) pour la recherche d'hôtels, la réservation et le dashboard admin.
  - Interception des requêtes avec jetons Bearer stockés via NextAuth.js.

* **Couche Métier & API REST (Backend Laravel 11 - Port 8000) :**
  - **Gestion des formulaires & Validations :** Validation stricte des données entrantes (422 Unprocessable Entity en cas d'erreur).
  - **Calcul tarifaire dynamique :** Calcul automatique selon la durée du séjour, la pension sélectionnée et la tranche d'âge des enfants (<2 ans gratuit, 2-11 ans +30 DT/nuit, >=12 ans +50 DT/nuit).
  - **Gestion des rôles :** Ségrégation stricte entre les rôles `client` et `admin` via le middleware `EnsureUserIsAdmin`.

* **Couche d'Accès aux Données (MySQL 8.0 - Port 3306) :**
  - **11 Tables Métier :** `users`, `destinations`, `hotels`, `chambres`, `pensions`, `reservations`, `avis`, `favoris`, `voyages`, `services`, `hotel_photos`.

---

## 🛠️ Prérequis Système
Assurez-vous d'avoir installé sur votre machine :
- **PHP** `>= 8.2` avec extensions PDO, OpenSSL, Mbstring
- **Composer** `>= 2.5`
- **Node.js** `>= 18.x` et **npm**
- **MySQL Server** `>= 8.0` (via XAMPP, WampServer ou MySQL standalone)

---

## 🚀 Guide d'Installation & Démarrage Rapide

### 1. Cloner le Projet
```bash
git clone https://github.com/arwa2004/tunisie-booking.git
cd tunisie-booking
git checkout monolithic
```

---

### 2. Configuration & Démarrage du Backend (Laravel 11)

```bash
# Entrer dans le dossier backend
cd server

# Installer les dépendances PHP
composer install

# Configurer l'environnement
cp .env.example .env

# Générer la clé d'application
php artisan key:generate
```

Éditer le fichier `server/.env` pour configurer la connexion à votre base MySQL :
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tunisie_booking
DB_USERNAME=root
DB_PASSWORD=
```

Exécuter les migrations et alimenter la base de données avec les données de démonstration :
```bash
php artisan migrate:fresh --seed
```

Lancer le serveur backend Laravel (écoutant sur le port **8000**) :
```bash
php artisan serve --port=8000
```

---

### 3. Configuration & Démarrage du Frontend (Next.js 14)

Dans un nouveau terminal :
```bash
# Entrer dans le dossier frontend
cd client

# Installer les dépendances Node.js
npm install

# Lancer le serveur de développement Next.js
npm run dev
```

L'application Web est désormais accessible à l'adresse : **`http://localhost:3000`** 🌐

---

## 🔐 Identifiants de Démonstration

| Rôle | Adresse E-mail | Mot de passe |
|---|---|---|
| **Administrateur** | `admin@gmail.com` | `admin1234` |
| **Client Démo** | `client@gmail.com` | `client1234` |

---

## 🧪 Exécution des Tests Automatisés

### A. Tests Unitaires & Feature Backend (PHPUnit)
Exécute la suite complète de 64 tests (calculs de prix, réservations, routes API) sur une base SQLite en mémoire :
```bash
cd server
php artisan test
```

### B. Tests End-to-End Navigateur (Playwright)
Simule la navigation réelle d'un utilisateur dans un navigateur Chromium :
```bash
cd client

# Lancer les tests E2E en arrière-plan
npx playwright test

# Lancer avec interface visuelle (navigateur visible)
npx playwright test --headed

# Consulter le rapport HTML interactif
npx playwright show-report
```

### C. Tests de Charge & Performance
Simule des montées de charge progressives (10 ➔ 300 VUs) :
```bash
node reports/run-stress-test.js
```
*Le rapport Excel sera automatiquement généré dans `reports/Rapport_Test_De_Stress.xlsx`.*

---

## 📁 Arborescence du Projet Monolithique

```
stage20252026/
├── server/                     # Backend Laravel 11 (API REST)
│   ├── app/Http/Controllers/   # 12 Contrôleurs API & Auth
│   ├── app/Models/             # 11 Modèles Eloquent
│   ├── database/migrations/    # 22 Migrations SQL
│   ├── database/seeders/       # Seeders de données de test
│   └── tests/                  # 64 Tests PHPUnit (Unit & Feature)
│
├── client/                     # Frontend Next.js 14 (App Router)
│   ├── src/app/                # Pages (Hotels, Reservations, Admin, Profil)
│   ├── src/components/         # 10 Composants UI React réutilisables
│   └── e2e/                    # Tests E2E Playwright Chromium
│
└── reports/                    # Scripts & Rapports de test Excel
```