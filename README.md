# 🏨 TunisieBooking — Version Monolithique
> **Plateforme de Réservation Hôtelière (Laravel 11 + Next.js 14 + MySQL 8.0)**  
> **Auteur :** Arwa Ben Amar | **Organisme :** Spring Travel Services (TunisieBooking)

---

## 📌 Présentation
Cette branche (`main` / `monolithic`) contient la version **monolithique en deux tiers** de la plateforme **TunisieBooking**.  
L'application associe un backend **Laravel 11 (API REST)** sécurisé par **Sanctum**, un frontend **Next.js 14 (App Router / TypeScript)** et une base de données relationnelle **MySQL 8.0**.

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
| **Client** | *(Créer via `/register` ou utiliser données seed)* | *(Choisi à l'inscription)* |

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

## 📁 Architecture du Projet Monolithique

```
stage20252026/
├── server/                     # Backend Laravel 11 (API REST)
│   ├── app/Http/Controllers/   # Contrôleurs API & Auth
│   ├── app/Models/             # 11 Modèles Eloquent
│   ├── database/migrations/    # 22 Migrations SQL
│   ├── database/seeders/       # Seeders de données
│   └── tests/                  # Tests PHPUnit (Unit & Feature)
│
├── client/                     # Frontend Next.js 14 (App Router)
│   ├── src/app/                # Pages (Hotels, Reservations, Admin, Profil)
│   ├── src/components/         # Composants UI React
│   └── e2e/                    # Tests E2E Playwright
│
└── reports/                    # Scripts & Rapports de test Excel
```