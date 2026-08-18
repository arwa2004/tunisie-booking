# 🌐 TunisieBooking — Version Microservices Polyglotte
> **Architecture Microservices Conteneurisée (Docker, Nginx Gateway, Keycloak SSO, Eureka)**  
> **Auteur :** Arwa Ben Amar | **Organisme d'accueil :** Spring Travel Services (TunisieBooking)

---

## 📌 Présentation
Cette branche (`microservices`) contient la version **microservices polyglotte, conteneurisée et distribuée** de la plateforme **TunisieBooking**.

L'infrastructure s'appuie sur **7 conteneurs Docker** interconnectés dans un réseau virtuel privé (`tb-network`), combinant :
- **3 Langages Backend distincts :** PHP 8.3 Laravel 11, Java 17 Spring Boot 3, Node.js Express.
- **3 Moteurs de BDD dédiés (Polyglot Persistence) :** MySQL 8.0, H2 Database, MongoDB 6.0.
- **1 Serveur SSO Centralisé :** Keycloak 26 (OAuth2 / OIDC avec jetons JWT).
- **1 API Gateway & Reverse Proxy :** Nginx (Gestion CORS avec réponses Preflight OPTIONS 204).
- **1 Service Registry :** Netflix Eureka (Découverte dynamique des services).

---

## 📐 Schéma & Détail de l'Architecture Microservices

### 1. Vue d'Ensemble de l'Architecture Distribuée
```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                             NAVIGATEUR CLIENT                               │
 │                         Next.js 14 (Port 3000)                              │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Requêtes API REST JSON
                                        │ Header Authorization: Bearer <JWT>
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                API GATEWAY — Nginx Reverse Proxy (Port 8000)                │
 │  • Point d'entrée unique & Routage dynamique (/api/users, /api/hotels...)   │
 │  • Gestion des requêtes Preflight OPTIONS (Réponse HTTP 204 No Content)     │
 │  • Isolation réseau & Masquage des en-têtes CORS internes                   │
 └──────────────┬───────────────────────┬───────────────────────┬──────────────┘
                │                       │                       │
                ▼                       ▼                       ▼
 ┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
 │       user-service        │ │   hotel-service   │ │     booking-service     │
 │  • PHP 8.3 / Laravel 11   │ │ • Java 17 / Spring│ │ • Node.js / Express     │
 │  • Port interne : 8000    │ │ • Port int. : 8000│ │ • Port interne : 8000   │
 │  • Gestion Utilisateurs   │ │ • Catalogue Hôtels│ │ • Réservations & Tarifs │
 └──────────────┬────────────┘ └────────┬──────────┘ └───────────┬─────────────┘
                │                       │                        │
                ▼                       ▼                        ▼
 ┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
 │   MySQL 8.0 (Port 3307)   │ │  H2 DB (Port 8082)│ │  MongoDB 6.0 (27017)    │
 │   Base : user_db          │ │  Base : test.db   │ │  Base : booking_db      │
 └───────────────────────────┘ └───────────────────┘ └─────────────────────────┘

 ┌──────────────────────────────────────┐ ┌────────────────────────────────────┐
 │ KEYCLOAK SSO — Auth Server (Port 8080)│ │ EUREKA SERVER — Registry (Port 8761)│
 │ • Fournisseur d'identité OAuth2 / OIDC│ │ • Découverte dynamique de services │
 └──────────────────────────────────────┘ └────────────────────────────────────┘
```

### 2. Design Patterns & Choix d'Architecture

* **API Gateway Pattern (Nginx - Port 8000) :**
  - Le frontend communique exclusivement avec le port 8000. Nginx se charge de réécrire les URLs et de router les requêtes vers le bon conteneur microservice.
  - Résolution centralisée du **CORS** : Nginx intercepte les requêtes de test `OPTIONS` émises par les navigateurs et renvoie immédiatement un code `204 No Content` avec les en-têtes d'autorisation.

* **Identity Provider & Single Sign-On (Keycloak 26 - Port 8080) :**
  - Aucun microservice ne stocke ni ne manipule de mots de passe. Keycloak authentifie les utilisateurs et délivre un **jeton JWT crypté**.
  - Chaque microservice vérifie la signature cryptographique du jeton de manière autonome, sans nécessiter d'appel à la base de données.

* **Polyglot Persistence & Pattern Snapshot (MongoDB - Port 27017) :**
  - **Profils & Hôtels :** Données relationnelles modifiables stockées dans MySQL (`user-service`) et H2 (`hotel-service`).
  - **Réservations :** Une réservation est une **preuve d'achat immuable**. Le `booking-service` enregistre une photo (*Snapshot*) complète des données de l'hôtel et du tarif payé dans MongoDB. Si l'hôtel augmente ses tarifs plus tard dans la base H2, l'ancienne réservation conserve exactement le montant payé lors de l'achat.

* **Service Discovery (Netflix Eureka - Port 8761) :**
  - Annuaire dynamique où chaque microservice s'enregistre au démarrage pour signaler son état de santé (*UP* / *DOWN*).

---

## 🗺️ Cartographie des Ports & Services Docker

| Composant | Technologie | Port Externe | Accès / Rôle |
|---|---|---|---|
| **Frontend** | Next.js 14 / TypeScript | `3000` | `http://localhost:3000` |
| **API Gateway** | Nginx Reverse Proxy | **`8000`** | **Seul port API appelé par le Frontend** |
| **Keycloak SSO** | OAuth2 / OIDC | `8080` | `http://localhost:8080` (Console Admin) |
| **Eureka Server** | Netflix Service Registry | `8761` | `http://localhost:8761` (Tableau de santé) |
| **Config Server** | Node.js Config | `8888` | `http://localhost:8888` (Configurations) |
| **user-service** | PHP 8.3 / Laravel 11 | *Interne 8000* | Base **MySQL 8.0** (`localhost:3307`) |
| **hotel-service** | Java 17 / Spring Boot 3 | *Interne 8000* | Base **H2 Database** (`localhost:8082`) |
| **booking-service** | Node.js / Express | *Interne 8000* | Base **MongoDB 6.0** (`localhost:27017`) |

---

## 🛠️ Prérequis
Assurez-vous d'avoir installé sur votre machine :
- **Docker Desktop** avec **Docker Compose**
- **Node.js** `>= 18.x` et **npm** (pour exécuter la suite de tests automatisés)

---

## 🚀 Démarrage Rapide en 1 Commande avec Docker

### 1. Cloner le Dépôt & Basculer sur la Branche
```bash
git clone https://github.com/arwa2004/tunisie-booking.git
cd tunisie-booking
git checkout microservices
```

### 2. Lancer l'Infrastructure Complète (7 Conteneurs)
```bash
# Lancer tous les microservices et bases de données en arrière-plan
docker compose up --build -d
```

*Note : Attendre environ 30 secondes que Keycloak et Eureka initialisent leurs connexions.*

---

### 3. Importer le Realm Keycloak (Authentification SSO)

Si c'est le premier lancement, importez la configuration du Realm Keycloak `tunisie-booking` :

- **Sous Windows PowerShell :**
  ```powershell
  .\import-realm.ps1
  ```
- **Sous Linux / macOS / Git Bash :**
  ```bash
  chmod +x import-realm.sh
  ./import-realm.sh
  ```

L'application Web est prête et accessible sur **`http://localhost:3000`** 🌐

---

## 🧪 Exécution de la Suite de Tests Automatisés

Le projet contient un script d'automatisation complet (`run_tests.js`) qui exécute l'intégralité de la Pyramide des Tests :

### 🚀 Exécuter Tous les Tests Automatisés en 1 Commande :
```bash
node run_tests.js
```

Ce script valide automatiquement :
1. **Smoke Tests (Santé des microservices)** : Vérification des endpoints `/health` et des 3 BDD.
2. **Tests CORS Preflight Nginx** : Envoie une requête cURL `OPTIONS` et vérifie la réponse `HTTP 204 No Content`.
3. **Tests de Charge API** : Envoie un trafic soutenu pour mesurer le débit (jusqu'à **427 req/s** avec 0% d'erreur).
4. **Tests de Résilience Docker** : Arrête `tb_booking_service` (`docker stop`), vérifie le statut `DOWN` sur Eureka et l'isolation du service Hôtel, puis relance le conteneur (`docker start`).

---

### 🟢 Exécuter les Tests par Niveau (Individuellement)

#### 1. Tests Unitaires & Intégration Backend (Jest)
```bash
# Tests unitaires du calcul de prix
cd services/booking-service
npm test

# Tests du catalogue hôtelier
cd services/hotel-service
npm test
```

#### 2. Tests End-to-End Navigateur (Playwright Chromium)
```bash
cd client

# Exécuter les 21 scénarios E2E
npx playwright test

# Afficher le rapport HTML interactif
npx playwright show-report
```

#### 3. Test E2E Temps Réel & Enregistreur Excel
Lance un navigateur interactif en temps réel et génère automatiquement le rapport Excel :
```bash
cd client
node live-test-recorder.js
```
*Le rapport Excel sera généré dans `reports/Session_Live_Tests.xlsx` ou `Rapport_Tests_E2E_Microservices.xlsx`.*

---

## 🔐 Identifiants de Connexion Keycloak

| Application | URL | Identifiants |
|---|---|---|
| **Console Admin Keycloak** | `http://localhost:8080` | `admin` / `admin` |
| **Tableau de santé Eureka** | `http://localhost:8761` | Accès libre |
| **Console H2 Database** | `http://localhost:8082` | JDBC URL: `jdbc:h2:tcp://h2-db:1521/test.db` |
| **Compte Client Démo** | `http://localhost:3000/login` | `arwa@tunisiebooking.tn` / `password123` |
| **Compte Admin Démo** | `http://localhost:3000/login` | `admin@tunisiebooking.tn` / `password123` |

---

## 🛠️ Arrêt de l'Infrastructure
```bash
# Arrêter et supprimer tous les conteneurs
docker compose down
```
