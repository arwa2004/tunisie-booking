# 📘 Rapport Complet du Projet — TunisieBooking
## Plateforme de Réservation Hôtelière en Tunisie

> **Stagiaire** : Arwa Ben Amar  
> **Période** : Juin – Juillet 2026  
> **Encadrement** : Stage de développement web full-stack  
> **Dépôt** : `arwa2004/tunisie-booking`

---

## 📋 Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Architecture Technique Globale](#2-architecture-technique-globale)
3. [Technologies & Dépendances](#3-technologies--dépendances)
4. [Modèle de Données (Base de Données)](#4-modèle-de-données-base-de-données)
5. [Backend — API Laravel](#5-backend--api-laravel)
6. [Frontend — Application Next.js](#6-frontend--application-nextjs)
7. [Sécurité](#7-sécurité)
8. [Monitoring — Sentry](#8-monitoring--sentry)
9. [Tests](#9-tests)
10. [Données de Démonstration (Seeders)](#10-données-de-démonstration-seeders)
11. [Structure des Fichiers du Projet](#11-structure-des-fichiers-du-projet)
12. [Bilan & Compétences Acquises](#12-bilan--compétences-acquises)

---

## 1. Présentation du Projet

### 1.1 Contexte

TunisieBooking est une **plateforme web complète de réservation hôtelière** développée dans le cadre d'un stage de fin d'études. Le projet simule une vraie solution commerciale permettant aux utilisateurs tunisiens et étrangers de :

- Rechercher et comparer des hôtels par destination en Tunisie
- Réserver une chambre avec choix du type de pension
- Gérer leurs réservations et leurs favoris
- Laisser des avis et des notes
- Explorer des voyages à l'étranger

### 1.2 Objectifs pédagogiques

| Objectif | Technologie mise en œuvre |
|----------|--------------------------|
| Développer une API REST complète | Laravel 11 + Sanctum |
| Créer une interface utilisateur moderne | Next.js 14 + TypeScript |
| Gérer l'authentification sécurisée | JWT via Laravel Sanctum |
| Écrire des tests automatisés | PHPUnit + Playwright |
| Monitorer une application en production | Sentry |
| Tester les performances | Tests de stress (Node.js) |

### 1.3 Fonctionnalités principales

```
🏨 Gestion des Hôtels          → CRUD complet (admin), consultation publique
🛏️  Gestion des Chambres        → Types, capacités, tarification dynamique
📍 Destinations Touristiques   → 5 destinations tunisiennes
✈️  Voyages à l'Étranger        → Paris, Dubai, Istanbul, Rome
📅 Système de Réservation       → Avec calcul automatique du prix
⭐ Avis & Notations             → Notes multi-critères (1–10)
❤️  Favoris                     → Liste personnelle par utilisateur
👤 Gestion du Profil           → Photo de profil, mot de passe
🔐 Authentification            → Email/Mot de passe + OAuth Google
🛠️  Panel Admin                 → Dashboard avec statistiques en temps réel
```

---

## 2. Architecture Technique Globale

### 2.1 Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEUR                        │
│                   (Navigateur Web)                      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│           FRONTEND  —  Next.js 14  (port 3000)          │
│   • App Router (React Server Components)                │
│   • TypeScript strict                                   │
│   • NextAuth.js (gestion session côté client)           │
│   • Tailwind CSS (styles)                               │
│   • Playwright (tests E2E)                              │
│   • Jest + Testing Library (tests unitaires React)      │
│   • Sentry (monitoring erreurs front)                   │
└───────────────────────┬─────────────────────────────────┘
                        │ Requêtes JSON (fetch API)
                        │ Authorization: Bearer <token>
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND  —  Laravel 11 (port 8000)         │
│   • Architecture MVC                                    │
│   • API REST JSON uniquement                            │
│   • Laravel Sanctum (tokens API)                        │
│   • Laravel Socialite (OAuth Google)                    │
│   • Middleware Admin (protection des routes)            │
│   • Throttle (rate limiting)                            │
│   • Sentry (monitoring erreurs back)                    │
└───────────────────────┬─────────────────────────────────┘
                        │ Eloquent ORM
                        ▼
┌─────────────────────────────────────────────────────────┐
│               BASE DE DONNÉES — MySQL                   │
│   Nom : tunisie_booking                                 │
│   22 migrations · 11 tables métier                      │
│   Clés étrangères + index                               │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Brevo SMTP     │  ← Envoi d'emails
              │  (emails reset) │    (réinitialisation mdp)
              └─────────────────┘
```

### 2.2 Flux d'une requête type

```
1. Utilisateur clique "Réserver" sur l'interface
2. Next.js envoie POST /api/reservations avec Bearer Token
3. Laravel vérifie le token Sanctum → identifie l'utilisateur
4. Le Middleware valide les données (422 si invalides)
5. Le Controller vérifie les règles métier :
   ├── La chambre appartient bien à cet hôtel ?
   ├── La capacité est suffisante ?
   └── Il reste des chambres disponibles ?
6. Le Modèle Reservation calcule le prix automatiquement
7. Laravel crée la réservation en base MySQL
8. Réponse JSON 201 + données de la réservation
9. Next.js affiche la confirmation à l'utilisateur
```

---

## 3. Technologies & Dépendances

### 3.1 Backend (Laravel)

| Package | Version | Rôle |
|---------|---------|------|
| `laravel/framework` | ^11.0 | Framework PHP principal |
| `laravel/sanctum` | ^4.0 | Authentification par tokens API |
| `laravel/socialite` | ^5.28 | Connexion OAuth (Google) |
| `laravel/breeze` | ^2.4 | Scaffolding auth (dev) |
| `sentry/sentry-laravel` | ^4.26 | Monitoring & suivi d'erreurs |
| `mongodb/laravel-mongodb` | * | Support MongoDB (optionnel) |
| `phpunit/phpunit` | ^10.5 | Tests automatisés |
| `fakerphp/faker` | ^1.23 | Données fictives pour les tests |
| `PHP` | ^8.2 | Langage serveur |

### 3.2 Frontend (Next.js)

| Package | Version | Rôle |
|---------|---------|------|
| `next` | 16.2.9 | Framework React SSR/SSG |
| `react` | 19.2.4 | Bibliothèque UI |
| `next-auth` | ^4.24.14 | Gestion session utilisateur côté client |
| `@sentry/nextjs` | ^10.63.0 | Monitoring & suivi d'erreurs front |
| `react-datepicker` | ^9.1.0 | Sélecteur de dates (réservation) |
| `@playwright/test` | ^1.62.0 | Tests End-to-End automatisés |
| `jest` | ^30.4.2 | Tests unitaires React |
| `@testing-library/react` | ^16.3.2 | Utilitaires de test React |
| `tailwindcss` | ^4 | Framework CSS utilitaire |
| `typescript` | ^5 | Typage statique |
| `xlsx` | ^0.18.5 | Génération rapports Excel |

### 3.3 Environnement de développement

| Outil | Usage |
|-------|-------|
| MySQL 8 | Base de données principale |
| SQLite (in-memory) | Base de données tests PHPUnit |
| Brevo SMTP | Service d'envoi d'emails |
| Node.js | Runtime pour scripts de test stress |
| ExcelJS | Génération des rapports de stress |

---

## 4. Modèle de Données (Base de Données)

### 4.1 Schéma des tables

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │destinations  │       │   voyages    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ nom          │       │ nom          │       │ nom          │
│ prenom       │       │ region       │       │ pays         │
│ email        │       │ image        │       │ image        │
│ telephone    │       │ timestamps   │       │ prix         │
│ password     │       └──────┬───────┘       │ duree        │
│ role         │              │               │ description  │
│ photo        │              │ has_many      │ timestamps   │
│ timestamps   │              ▼               └──────────────┘
└──────┬───────┘       ┌──────────────┐
       │               │    hotels    │
       │ has_many      ├──────────────┤
       ▼               │ id           │
┌──────────────┐       │destination_id│◄── BelongsTo Destination
│ reservations │       │ nom          │
├──────────────┤       │ prix_par_nuit│
│ id           │       │ etoiles      │
│ user_id      │◄──────│ description  │
│ hotel_id     │       │ image        │
│ chambre_id   │       │ disponible   │
│ pension_id   │       │ timestamps   │
│ date_arrivee │       └──────┬───────┘
│ date_depart  │              │
│ nb_chambres  │      ┌───────┼────────────┐
│ nb_adultes   │      │       │            │
│ nb_enfants   │   has_many  has_many    belongs_to_many
│ ages_enfants │      │       │            │
│ prix_total   │      ▼       ▼            ▼
│ statut       │  ┌────────┐ ┌──────────┐ ┌──────────┐
│ timestamps   │  │chambres│ │  avis    │ │services  │
└──────────────┘  ├────────┤ ├──────────┤ ├──────────┤
                  │type    │ │user_id   │ │ nom      │
┌──────────────┐  │nom     │ │hotel_id  │ │ icone    │
│   favoris    │  │prix_   │ │note_glob │ └──────────┘
├──────────────┤  │base_   │ │note_prop │
│ user_id      │  │nuit    │ │note_chbr │ ┌────────────┐
│ hotel_id     │  │capac_  │ │note_qual │ │hotel_photos│
│ timestamps   │  │adultes │ │comment.  │ ├────────────┤
└──────────────┘  │capac_  │ │timestamps│ │ hotel_id   │
                  │enfants │ └──────────┘ │ url        │
                  │quantite│             │ alt_text   │
                  └───┬────┘             │ ordre      │
                      │                 └────────────┘
               belongs_to_many
                      │
                      ▼
                  ┌────────────────┐
                  │    pensions    │
                  ├────────────────┤
                  │ id             │
                  │ nom            │
                  └────────────────┘
                  (pivot: supplement_prix)
```

### 4.2 Liste des 22 migrations (ordre chronologique)

| # | Migration | Date | Table créée/modifiée |
|---|-----------|------|----------------------|
| 1 | `create_users_table` | Système | `users` |
| 2 | `create_cache_table` | Système | `cache` |
| 3 | `create_jobs_table` | Système | `jobs` |
| 4 | `create_destinations_table` | 19/06/2026 | `destinations` |
| 5 | `create_hotels_table` | 19/06/2026 | `hotels` |
| 6 | `create_reservations_table` | 19/06/2026 | `reservations` |
| 7 | `create_personal_access_tokens_table` | 19/06/2026 | `personal_access_tokens` |
| 8 | `create_voyages_table` | 24/06/2026 | `voyages` |
| 9 | `add_role_to_users_table` | 01/07/2026 | `users` + champ `role` |
| 10 | `add_photo_to_users_table` | 02/07/2026 | `users` + champ `photo` |
| 11 | `create_chambres_table` | 09/07/2026 | `chambres` |
| 12 | `update_reservations_table` | 09/07/2026 | `reservations` + `chambre_id` |
| 13 | `create_pensions_table` | 09/07/2026 | `pensions` |
| 14 | `create_chambre_pension_table` | 09/07/2026 | `chambre_pension` (pivot) |
| 15 | `create_services_table` | 09/07/2026 | `services` |
| 16 | `create_hotel_service_table` | 09/07/2026 | `hotel_service` (pivot) |
| 17 | `create_hotel_photos_table` | 09/07/2026 | `hotel_photos` |
| 18 | `add_pension_id_to_reservations` | 09/07/2026 | `reservations` + `pension_id` |
| 19 | `add_remise_to_chambres_table` | 12/07/2026 | `chambres` + `remise` |
| 20 | `add_tarification_enfants_to_hotels` | 12/07/2026 | `hotels` + tarifs enfants |
| 21 | `create_avis_table` | 17/07/2026 | `avis` |
| 22 | `create_favoris_table` | 23/07/2026 | `favoris` |

### 4.3 Règles de gestion des données

| Règle | Description |
|-------|-------------|
| Rôles utilisateurs | `client` (par défaut) ou `admin` — jamais modifiable par l'utilisateur lui-même |
| Statuts réservation | `en_attente` → `confirmee` ou `annulee` · `annulee` est un état terminal |
| Générations automatiques | À la création d'un hôtel : 10 chambres + 4 pensions + 8 services + 4 photos générés automatiquement |
| Tarification enfants | < 2 ans : gratuit · 2-12 ans : +30 DT/nuit · > 12 ans : +50 DT/nuit |
| Formule prix total | `(prix_chambre + supplement_pension + supplement_enfants) × nb_nuits × nb_chambres` |
| Pension | Petit Déjeuner (+0 DT) · Demi Pension (+40 DT) · All Inclusive Soft (+70 DT) · All Inclusive (+100 DT) |
| Services auto | ≥ 5★ : tous les services · 4★ : WiFi+Piscine+Restaurant+Parking+Clim · < 4★ : WiFi+Restaurant+Parking+Clim |

---

## 5. Backend — API Laravel

### 5.1 Structure des contrôleurs

```
server/app/Http/Controllers/
├── Api/
│   ├── AuthController.php          → Profil, Mot de passe, Photo
│   ├── AvisController.php          → Avis hôtels (lecture/écriture/suppression)
│   ├── ChambreController.php       → CRUD des chambres
│   ├── DestinationController.php   → CRUD des destinations
│   ├── FavoriController.php        → Gestion des favoris (toggle)
│   ├── HotelController.php         → CRUD des hôtels
│   ├── PasswordResetController.php → Réinitialisation mot de passe
│   ├── PensionController.php       → CRUD des pensions
│   ├── ReservationController.php   → Réservations client + admin
│   ├── SocialAuthController.php    → Authentification Google OAuth
│   ├── UserController.php          → Gestion des utilisateurs (admin)
│   └── VoyageController.php        → CRUD des voyages
└── Auth/
    ├── AuthenticatedSessionController.php  → Login / Logout
    ├── RegisteredUserController.php        → Inscription
    ├── PasswordResetLinkController.php     → Email réinitialisation
    └── NewPasswordController.php          → Nouveau mot de passe
```

### 5.2 Référentiel complet des routes API

#### Routes Publiques (sans authentification)

| Méthode | Route | Contrôleur | Description |
|---------|-------|-----------|-------------|
| POST | `/api/register` | RegisteredUserController | Inscription (max 3/min) |
| POST | `/api/login` | AuthenticatedSessionController | Connexion (max 5/min) |
| POST | `/api/forgot-password` | PasswordResetLinkController | Email reset mdp (max 3/min) |
| POST | `/api/reset-password` | NewPasswordController | Nouveau mot de passe |
| POST | `/api/auth/social` | SocialAuthController | Connexion Google OAuth |
| GET | `/api/destinations` | DestinationController@index | Liste destinations |
| GET | `/api/destinations/{id}` | DestinationController@show | Détail destination |
| GET | `/api/hotels` | HotelController@index | Liste hôtels (filtrable) |
| GET | `/api/hotels/{id}` | HotelController@show | Détail hôtel |
| GET | `/api/hotels/{id}/chambres` | ChambreController@index | Chambres d'un hôtel |
| GET | `/api/chambres/{id}` | ChambreController@show | Détail chambre |
| GET | `/api/pensions` | PensionController@index | Liste pensions |
| GET | `/api/voyages` | VoyageController@index | Liste voyages |
| GET | `/api/voyages/{id}` | VoyageController@show | Détail voyage |
| GET | `/api/hotels/{id}/avis` | AvisController@index | Avis + stats d'un hôtel |

#### Routes Authentifiées (Bearer Token requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/me` | Profil de l'utilisateur connecté |
| PUT | `/api/me` | Mise à jour du profil |
| PUT | `/api/me/password` | Changement de mot de passe |
| POST | `/api/me/photo` | Upload photo de profil |
| POST | `/api/logout` | Déconnexion (révoque le token) |
| POST | `/api/reservations` | Créer une réservation |
| GET | `/api/mes-reservations` | Mes réservations |
| GET | `/api/favoris` | Liste de mes favoris |
| GET | `/api/favoris/ids` | IDs de mes hôtels favoris |
| POST | `/api/favoris/{hotel}` | Toggle favori (ajouter/retirer) |
| POST | `/api/hotels/{id}/avis` | Créer ou mettre à jour un avis |
| DELETE | `/api/avis/{id}` | Supprimer mon avis |

#### Routes Admin Seulement (Bearer Token + role=admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/destinations` | Créer une destination |
| POST | `/api/destinations/{id}` | Modifier une destination |
| DELETE | `/api/destinations/{id}` | Supprimer une destination |
| POST | `/api/hotels` | Créer un hôtel |
| POST | `/api/hotels/{id}` | Modifier un hôtel |
| DELETE | `/api/hotels/{id}` | Supprimer un hôtel |
| POST | `/api/hotels/{id}/chambres` | Créer une chambre |
| POST | `/api/chambres/{id}` | Modifier une chambre |
| DELETE | `/api/chambres/{id}` | Supprimer une chambre |
| POST | `/api/chambres/{id}/pensions` | Synchroniser les pensions |
| POST | `/api/pensions` | Créer une pension |
| POST/DELETE | `/api/pensions/{id}` | Modifier/Supprimer une pension |
| POST/DELETE | `/api/voyages/{id}` | Modifier/Supprimer un voyage |
| GET | `/api/reservations` | Toutes les réservations |
| GET | `/api/reservations/{id}` | Détail réservation |
| PUT | `/api/reservations/{id}` | Changer statut (confirmee/annulee) |
| DELETE | `/api/reservations/{id}` | Supprimer une réservation |
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/{id}` | Profil d'un utilisateur |
| PUT | `/api/users/{id}/role` | Changer le rôle d'un utilisateur |
| DELETE | `/api/users/{id}` | Supprimer un utilisateur |

### 5.3 Modèles & Relations Eloquent

| Modèle | Relations principales | Méthodes métier |
|--------|----------------------|-----------------|
| `User` | hasMany(Reservation), hasMany(Avis), belongsToMany(Hotel via favoris) | — |
| `Hotel` | belongsTo(Destination), hasMany(Chambre), hasMany(Avis), belongsToMany(Service), hasMany(HotelPhoto) | `isDisponible()`, `isEtoilesValide()`, `isPrixValide()` |
| `Destination` | hasMany(Hotel) | `hasNom()`, `hasRegion()`, `getNomComplet()` |
| `Chambre` | belongsTo(Hotel), belongsToMany(Pension via chambre_pension) | `peutAccueillir(adultes, enfants)` |
| `Reservation` | belongsTo(User, Hotel, Chambre, Pension) | `getNbNuits()`, `calculatePrixTotal()`, `isStatutValide()`, `canTransitionTo()` |
| `Avis` | belongsTo(User, Hotel) | — |
| `Favori` | belongsTo(User, Hotel) | — |
| `Voyage` | — | `isPrixValide()`, `isDureeValide()`, `getDureeLabel()` |
| `Pension` | belongsToMany(Chambre via chambre_pension) | — |
| `Service` | belongsToMany(Hotel via hotel_service) | — |
| `HotelPhoto` | belongsTo(Hotel) | — |

### 5.4 Middleware de sécurité

| Middleware | Fichier | Rôle |
|-----------|---------|------|
| `auth:sanctum` | Laravel built-in | Vérifie que le token Bearer est valide |
| `admin` | `EnsureUserIsAdmin.php` | Vérifie que `$user->role === 'admin'` → 403 sinon |
| `throttle:3,1` | Laravel built-in | Limite à 3 requêtes/minute (inscription, reset password) |
| `throttle:5,1` | Laravel built-in | Limite à 5 requêtes/minute (connexion) |

---

## 6. Frontend — Application Next.js

### 6.1 Structure des pages (App Router)

```
client/src/app/
├── page.tsx                    → 🏠 Page d'accueil
├── layout.tsx                  → Layout racine (SessionProvider, Navbar, Footer)
├── globals.css                 → Styles globaux
│
├── hotels/
│   └── [id]/page.tsx           → 🏨 Fiche détail d'un hôtel (onglets: Infos, Chambres, Avis, Galerie)
│
├── destinations/
│   └── page.tsx                → 📍 Liste des destinations tunisiennes
│
├── voyages/
│   └── page.tsx                → ✈️  Liste des voyages internationaux
│
├── reservations/
│   └── page.tsx                → 📅 Mes réservations (utilisateur connecté)
│
├── favoris/
│   └── page.tsx                → ❤️  Mes hôtels favoris
│
├── profil/
│   └── page.tsx                → 👤 Mon profil (infos, photo, mot de passe)
│
├── login/
│   └── page.tsx                → 🔐 Page de connexion
│
├── register/
│   └── page.tsx                → 📝 Page d'inscription
│
├── forgot-password/
│   └── page.tsx                → 📧 Demande reset mot de passe
│
├── reset-password/
│   └── page.tsx                → 🔑 Nouveau mot de passe (depuis email)
│
├── admin/
│   ├── layout.tsx              → Layout admin (AdminNavbar sécurisé)
│   ├── page.tsx                → 📊 Dashboard admin (statistiques)
│   ├── hotels/                 → 🏨 Gestion hôtels (liste, créer, modifier)
│   ├── destinations/           → 📍 Gestion destinations
│   ├── voyages/                → ✈️  Gestion voyages
│   ├── reservations/           → 📅 Gestion toutes les réservations
│   ├── users/                  → 👥 Gestion utilisateurs
│   └── profil/                 → 👤 Profil admin
│
└── api/
    └── auth/[...nextauth]/
        └── route.ts            → Configuration NextAuth (Credentials + Google)
```

### 6.2 Composants réutilisables

| Composant | Taille | Rôle |
|-----------|--------|------|
| `Navbar.tsx` | ~11 Ko | Barre de navigation (menu, avatar, déconnexion, liens selon rôle) |
| `SearchBoxAdvanced.tsx` | ~21 Ko | Moteur de recherche avancé (destination, dates, personnes) |
| `SearchBoxCompact.tsx` | ~21 Ko | Version compacte du moteur de recherche |
| `DestinationHotelsSection.tsx` | ~18 Ko | Section hôtels par destination avec filtres |
| `HeartButton.tsx` | ~3.5 Ko | Bouton ❤️ toggle favori (avec animation) |
| `HotelsFilterForm.tsx` | ~3.8 Ko | Formulaire de filtres (étoiles, prix, disponibilité) |
| `DestinationsListClient.tsx` | ~5 Ko | Grille des destinations (côté client) |
| `SessionProviderWrapper.tsx` | ~224 Ko | Wrapper NextAuth SessionProvider |
| `ConditionalMain.tsx` | ~1.6 Ko | Affichage conditionnel selon la page |
| `Footer.tsx` | ~295 o | Pied de page |

### 6.3 Fonctionnalités du Dashboard Admin

Le dashboard admin (`/admin`) affiche en temps réel :
- **Statistiques générales** : nombre d'hôtels, destinations, voyages, réservations, utilisateurs
- **Répartition des statuts** : réservations confirmées / en attente / annulées
- **Top 5 hôtels** : les plus réservés
- **Top 5 destinations** : les plus populaires
- **Dernières réservations** : tableau avec statut coloré

### 6.4 Fonctionnalités clés du Frontend

| Fonctionnalité | Détail technique |
|----------------|-----------------|
| Authentification | NextAuth.js + CredentialsProvider + token Sanctum stocké dans la session |
| Protection des pages | Vérification côté serveur du rôle admin sur les pages admin |
| Favoris | Bouton toggle avec état optimiste (mise à jour immédiate de l'UI) |
| Sélection de dates | `react-datepicker` avec validation (départ après arrivée) |
| Calcul de prix | Affiché en temps réel dans le formulaire de réservation |
| Upload photo | Formulaire `multipart/form-data` vers `/api/me/photo` |
| Avis | Formulaire de notation multi-critères (global, propreté, chambres, qualité/prix) |
| Responsive | CSS adaptatif pour mobile, tablette et desktop |

---

## 7. Sécurité

### 7.1 Mesures implémentées

| Couche | Mesure | Implémentation |
|--------|--------|---------------|
| **Authentification** | Tokens Sanctum à durée limitée | Expire après **7 jours** |
| **Mots de passe** | Hachage fort | `bcrypt` avec 12 tours (BCRYPT_ROUNDS=12) |
| **Mots de passe** | Complexité imposée | Regex : majuscule + minuscule + chiffre, min 8 caractères |
| **Rate Limiting** | Protection brute force | Throttle 3/min (register) · 5/min (login) |
| **Rôles** | Ségrégation admin/client | Middleware `EnsureUserIsAdmin` sur toutes les routes admin |
| **Protection** | Injection de rôle impossible | Le `role` est toujours forcé à `'client'` à l'inscription |
| **Logging** | Tentatives échouées | Log des connexions échouées (email + IP) dans le canal `security` |
| **CORS** | Origine autorisée uniquement | Seul `http://localhost:3000` (FRONTEND_URL) est autorisé |
| **Validation** | Toutes les entrées | Validation Laravel sur 100% des endpoints |
| **Photos** | Types autorisés | JPEG, PNG, JPG, GIF · max 2 Mo |
| **Tokens OAuth** | Connexion sécurisée | Google OAuth via Laravel Socialite |

### 7.2 Cycle de vie du token

```
1. Inscription/Connexion → Token créé avec expiration 7 jours
2. Chaque requête → Token vérifié par Sanctum middleware
3. Déconnexion → Token supprimé de la table personal_access_tokens
4. Déconnexion partout → Tous les tokens de l'utilisateur supprimés
5. Token expiré → Réponse 401 Unauthorized
```

### 7.3 Réinitialisation de mot de passe

```
1. Utilisateur saisit son email → POST /api/forgot-password
2. Laravel génère un token sécurisé et l'enregistre en base
3. Email envoyé via Brevo SMTP avec le lien de reset
4. Utilisateur clique le lien → page /reset-password
5. Saisie du nouveau mot de passe → POST /api/reset-password
6. Token invalidé, mot de passe mis à jour avec bcrypt
```

---

## 8. Monitoring — Sentry

### 8.1 Configuration

Sentry est intégré des deux côtés de l'application pour capturer toutes les erreurs :

| Côté | DSN | Taux de traces |
|------|-----|---------------|
| **Backend** (Laravel) | `https://808e8ada...sentry.io/4511668515438672` | 100% (`SENTRY_TRACES_SAMPLE_RATE=1.0`) |
| **Frontend** (Next.js) | Configuré dans `instrumentation.ts` et `instrumentation-client.ts` | Configuré dans `sentry.client.config.js` |

### 8.2 Ce que Sentry capture

| Type d'événement | Exemple |
|-----------------|---------|
| Erreurs PHP/Laravel | Exceptions non gérées, erreurs 500 |
| Erreurs JavaScript | Erreurs React, promesses rejetées |
| Requêtes lentes | Traces de performance (N+1 queries, etc.) |
| Erreurs HTTP | 404, 422, 500 avec contexte complet |
| Erreurs de session | Tokens invalides, accès refusés |

### 8.3 Utilisation en développement

```bash
# Tester que Sentry capture bien les erreurs backend
php artisan sentry:test

# Page de test Sentry côté frontend
http://localhost:3000/sentry-example-page
```

---

## 9. Tests

### 9.1 Vue d'ensemble des tests

| Catégorie | Framework | Nombre | Couverture |
|-----------|-----------|--------|-----------|
| Tests Unitaires | PHPUnit | 31 tests | Modèles : Reservation, Hotel, Destination, Voyage |
| Tests Feature/Intégration | PHPUnit + SQLite | 33 tests | Toutes les routes API critiques |
| Tests E2E | Playwright | 3 specs | Parcours utilisateur complets |
| Tests de Stress | Node.js custom | 4 vagues | 7 endpoints · 10 → 300 VUs |

### 9.2 Tests Unitaires PHPUnit

**Principe :** Tester les méthodes métier **sans base de données**. Les modèles sont instanciés manuellement via `setRawAttributes()`.

| Fichier | Tests | Ce qui est testé |
|---------|-------|-----------------|
| `ReservationTest.php` | 17 tests | `getNbNuits()`, `calculatePrixTotal()`, `isStatutValide()`, `canTransitionTo()`, `getStatutsValides()` |
| `HotelTest.php` | 8 tests | `isDisponible()`, `isEtoilesValide()`, `isPrixValide()` |
| `DestinationTest.php` | 6 tests | `hasNom()`, `hasRegion()`, `getNomComplet()` |
| `VoyageTest.php` | 7 tests | `isPrixValide()`, `isDureeValide()`, `getDureeLabel()` |

```bash
# Lancer les tests unitaires
cd server && php artisan test --testsuite=Unit
```

### 9.3 Tests Feature/Intégration PHPUnit

**Principe :** Tester les routes HTTP complètes avec une base SQLite en mémoire (`RefreshDatabase`).

| Fichier | Tests | Routes testées |
|---------|-------|---------------|
| `AuthTest.php` | 4 | POST /register, POST /login, POST /logout |
| `HotelApiTest.php` | 5 | GET/POST /hotels, GET /hotels/{id} |
| `ChambreApiTest.php` | 6 | GET/POST/PUT/DELETE /chambres |
| `ReservationApiTest.php` | 5 | POST /reservations (logique métier complète) |
| `ReservationAdminTest.php` | 6 | GET/PUT/DELETE /reservations (admin) |
| `FavoriApiTest.php` | 3 | GET/POST /favoris |
| `AvisApiTest.php` | 5 | GET/POST/DELETE /avis |
| `ProfilApiTest.php` | 3 | GET/PUT /me |

```bash
# Lancer les tests feature
cd server && php artisan test --testsuite=Feature

# Lancer tous les tests Laravel
cd server && php artisan test
```

### 9.4 Tests End-to-End (Playwright)

**Principe :** Contrôler un navigateur Chromium réel pour simuler un vrai utilisateur.

| Spec | Scénarios |
|------|-----------|
| `auth.spec.ts` | Inscription → redirection · Connexion valide → accès profil · Connexion invalide → message d'erreur |
| `hotels.spec.ts` | Liste hôtels → filtre étoiles → clic hôtel → fiche détail → onglets Chambres/Avis |
| `reservation.spec.ts` | Connexion → sélection hôtel → sélection chambre/dates → confirmation → "Mes réservations" |

```bash
# Lancer les tests E2E
cd client && npx playwright test

# Avec navigateur visible
cd client && npx playwright test --headed

# Interface visuelle Playwright UI
cd client && npx playwright test --ui
```

**Live Test Recorder :** Script qui enregistre une session de navigation manuelle en temps réel et génère automatiquement un rapport Excel à la fermeture du navigateur.

```bash
cd client && node live-test-recorder.js
# → Rapport : reports/Session_Live_Tests.xlsx
```

### 9.5 Tests de Stress & Performance

**Principe :** Monter progressivement la charge pour trouver le point de rupture de l'API.

**7 endpoints testés :**
- `GET /api/hotels` — Liste hôtels
- `GET /api/hotels/1` — Fiche hôtel
- `GET /api/hotels/1/chambres` — Chambres
- `GET /api/hotels/1/avis` — Avis
- `GET /api/destinations` — Destinations
- `GET /api/voyages` — Voyages
- `POST /api/login` — Authentification (lourd CPU Bcrypt)

**4 vagues de montée en charge :**

| Vague | VUs | Durée | Simulation |
|-------|-----|-------|-----------|
| Vague 1 | 10 | 5s | Jour ordinaire |
| Vague 2 | 50 | 5s | Jour d'affluence |
| Vague 3 | 150 | 5s | Pic de saison touristique |
| Vague 4 | 300 | 5s | Breakpoint (limite du système) |

**Métriques mesurées :** RPS, Apdex Score, Taux de succès, Temps moyen/max/p95

**Rapport généré :** `reports/Rapport_Test_De_Stress.xlsx` (3 onglets : Résumé vagues · Analyse endpoints · Plan d'optimisation)

```bash
node reports/run-stress-test.js
```

### 9.6 Recommandations d'optimisation (issues des tests de stress)

| Recommandation | Impact attendu |
|----------------|---------------|
| Cache Redis sur `/api/hotels` et `/api/destinations` | -90% charge MySQL |
| Laravel Octane + Swoole | ×10 débit (jusqu'à 3 000 req/s) |
| Ajuster coût Bcrypt ou Argon2id | Réduction CPU `/api/login` |
| Connection Pooling MySQL | Évite le rejet sous 300 VUs |
| Nginx + Gzip/Brotli | Réduction taille réponses JSON |

---

## 10. Données de Démonstration (Seeders)

### 10.1 Destinations (5)

| Destination | Région |
|-------------|--------|
| Hammamet | Nabeul |
| Djerba | Médenine |
| Sousse | Sousse |
| Tabarka | Jendouba |
| Tozeur | Tozeur |

### 10.2 Hôtels exemples (par destination)

**Hammamet :**
- El Mouradi El Menzah — 4★ — 120 DT/nuit
- The Orangers Garden Villa & Bungalows — 5★ — 350 DT/nuit

**Djerba :**
- Hasdrubal Prestige Thalassa & Spa Djerba — 5★ — 450 DT/nuit
- Djerba Plaza Thalasso & Spa — 4★ — 180 DT/nuit

> Chaque hôtel créé génère automatiquement : **10 chambres** × **4 pensions** + **8 services** + **4 photos galerie**

### 10.3 Voyages (4 destinations internationales)

| Destination | Pays | Prix | Durée |
|-------------|------|------|-------|
| Paris | France | 850 DT | 7 jours |
| Dubai | Émirats Arabes Unis | 1 200 DT | 5 jours |
| Istanbul | Turquie | 650 DT | 6 jours |
| Rome | Italie | 750 DT | 5 jours |

### 10.4 Utilisateurs de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@gmail.com | admin1234 |
| Client | (généré par factory) | (généré) |

---

## 11. Structure des Fichiers du Projet

```
stage20252026/                              ← Racine du projet
│
├── 📂 server/                             ← Backend Laravel 11
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/                   ← 12 contrôleurs API
│   │   │   │   └── Auth/                  ← 4 contrôleurs d'auth
│   │   │   ├── Middleware/
│   │   │   │   ├── EnsureEmailIsVerified.php
│   │   │   │   └── EnsureUserIsAdmin.php  ← Protection routes admin
│   │   │   └── Requests/                  ← Form requests de validation
│   │   ├── Models/                        ← 11 modèles Eloquent
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/                    ← 22 fichiers de migration
│   │   ├── seeders/                       ← 6 seeders de données
│   │   └── factories/                     ← Factories pour les tests
│   ├── routes/
│   │   └── api.php                        ← Toutes les routes (126 lignes)
│   ├── tests/
│   │   ├── Unit/                          ← 4 fichiers, 31 tests
│   │   └── Feature/                       ← 8 fichiers, 33 tests
│   ├── .env                               ← Configuration environnement
│   ├── composer.json                      ← Dépendances PHP
│   └── Dockerfile                         ← Conteneurisation Docker
│
├── 📂 client/                             ← Frontend Next.js 14
│   ├── src/
│   │   ├── app/                           ← Pages (App Router)
│   │   │   ├── admin/                     ← 6 sections admin
│   │   │   ├── hotels/[id]/               ← Fiche hôtel dynamique
│   │   │   ├── destinations/              ← Page destinations
│   │   │   ├── voyages/                   ← Page voyages
│   │   │   ├── reservations/              ← Mes réservations
│   │   │   ├── favoris/                   ← Mes favoris
│   │   │   ├── profil/                    ← Mon profil
│   │   │   ├── login/ register/           ← Auth pages
│   │   │   └── api/auth/[...nextauth]/    ← NextAuth handler
│   │   ├── components/                    ← 10 composants réutilisables
│   │   └── lib/                           ← Utilitaires
│   ├── package.json                       ← Dépendances Node.js
│   ├── live-test-recorder.js              ← Live recorder Playwright
│   └── playwright.config.ts               ← Config tests E2E
│
├── 📂 reports/                            ← Scripts et rapports de tests
│   ├── run-stress-test.js                 ← Test de stress (v2 PRO)
│   ├── Rapport_Test_De_Stress.xlsx        ← Rapport Excel stress (généré)
│   └── Session_Live_Tests.xlsx            ← Rapport live recorder (généré)
│
├── 📁 Documentations
│   ├── Documentation_Complete_Tests.md    ← Documentation tests
│   ├── PROJECT_SUMMARY.md                 ← Résumé projet
│   ├── GUIDE_PLAYWRIGHT_E2E.md            ← Guide Playwright
│   ├── GUIDE_SENTRY.md                    ← Guide Sentry
│   ├── walkthrough.md                     ← Journal des changements
│   └── diagramme_de_classe.pdf            ← Diagramme de classes UML
│
└── 📁 Présentations (PowerPoint)
    ├── 01_PHP_Les_Bases.pptx
    └── 02_Laravel_Backend_API.pptx
```

---

## 12. Bilan & Compétences Acquises

### 12.1 Récapitulatif chiffré du projet

| Indicateur | Valeur |
|------------|--------|
| Durée du stage | Juin – Juillet 2026 (~8 semaines) |
| Migrations de base de données | **22 migrations** |
| Tables créées | **11 tables métier** + tables systèmes |
| Modèles Eloquent | **11 modèles** |
| Contrôleurs API | **12 contrôleurs** |
| Routes API totales | **~40 routes** |
| Pages Frontend | **~18 pages** |
| Composants React | **10 composants** |
| Tests unitaires | **31 tests** |
| Tests Feature | **33 tests** |
| Tests E2E Playwright | **3 specs** |
| Endpoints testés en stress | **7 endpoints** |
| Vagues de stress | **4 vagues (10 → 300 VUs)** |
| Seeders de données | **6 fichiers** |
| Lignes de code (estimées) | **~8 000 lignes** |

### 12.2 Compétences techniques développées

#### Backend
- ✅ Architecture MVC avec Laravel 11
- ✅ Conception de bases de données relationnelles (normalisation, migrations)
- ✅ Développement d'une API REST complète (CRUD, validation, pagination)
- ✅ Authentification par tokens (Sanctum) et OAuth (Socialite)
- ✅ Gestion des rôles et permissions (middleware)
- ✅ Calculs métier complexes (prix dynamique, tarification enfants)
- ✅ Envoi d'emails transactionnels (SMTP Brevo)
- ✅ Écriture de tests automatisés (PHPUnit, TDD)
- ✅ Protection contre les attaques (rate limiting, validation stricte)
- ✅ Monitoring en production (Sentry)

#### Frontend
- ✅ Next.js 14 avec App Router et React Server Components
- ✅ TypeScript (typage strict)
- ✅ Gestion d'état avec React Hooks (useState, useEffect)
- ✅ Authentification côté client (NextAuth.js)
- ✅ Appels API REST avec gestion des erreurs
- ✅ Interface responsive et moderne (Tailwind CSS)
- ✅ Tests E2E avec Playwright
- ✅ Tests de composants avec Jest + Testing Library

#### DevOps & Outils
- ✅ Gestion de projet Git (branches, commits descriptifs)
- ✅ Docker (Dockerfile pour le serveur)
- ✅ Tests de performance et analyse des résultats
- ✅ Génération de rapports Excel automatisés
- ✅ Monitoring et suivi d'erreurs en production (Sentry)
- ✅ Documentation technique (Markdown)

### 12.3 Points d'amélioration possibles (perspectives)

| Amélioration | Impact |
|--------------|--------|
| Cache Redis sur les endpoints GET | Performance ×10 sous charge |
| Laravel Octane + Swoole | Serveur haute performance |
| Paiement en ligne (Stripe/Flouci) | Fonctionnalité complète e-commerce |
| Notifications en temps réel (WebSockets/Pusher) | Statut réservation en direct |
| Application mobile (React Native) | Accessibilité mobile native |
| CI/CD GitHub Actions | Tests automatiques à chaque push |
| Déploiement production (Railway/AWS) | Mise en production réelle |
| Internationalisation (i18n) | Support arabe / français / anglais |
| Système de recommandation | IA pour suggérer des hôtels |

---

*Rapport généré automatiquement — Projet TunisieBooking — Stage 2025/2026*  
*Dernière mise à jour : Juillet 2026*
