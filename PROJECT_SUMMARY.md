# 📌 RÉCAPITULATIF DE PROJET - TUNISIEBOOKING

> **Note pour l'IA suivante / Rapport de Projet**  
> Ce document décrit l'ensemble de l'architecture, de la base de données, de la logique métier, des webhooks d'automatisation n8n et des fonctionnalités développées sur le projet **TunisieBooking** depuis la création des données jusqu'à présent.

---

## 1. 🛠️ TECH-STACK & ARCHITECTURE GLOBALE

- **Backend (API REST)** : Laravel 11 / PHP 8.2+
- **Base de Données** : MySQL / SQLite (avec migrations Laravel)
- **Authentification** : Laravel Sanctum (Tokens Bearer)
- **Frontend** : Next.js 16 (App Router, TypeScript, Vanilla CSS + Tailwind CSS)
- **Automatisation & Emails** : n8n (Webhooks HTTP + Nœud Gmail API)
- **Tests & Assurance Qualité** : PHPUnit (78 tests automatisés 100% PASS)

---

## 2. 🗄️ BASE DE DONNÉES & MODÈLES (13 MODÈLES)

### 🔹 Core & Authentification
1. **`users`** :
   - Champs : `id`, `nom`, `prenom`, `email`, `password`, `telephone`, `photo`, `role` (`client` ou `admin`), `timestamps`.
   - Fonctionnalités : Inscription, connexion, édition profil, upload photo, changement mot de passe, rôles.

2. **`personal_access_tokens`** : Gestion des jetons d'accès API Sanctum.

---

### 🔹 Offres & Hébergement
3. **`destinations`** :
   - Champs : `id`, `nom`, `region`, `image`, `timestamps`.
   - Exemples : Hammamet, Sousse, Djerba, Monastir, Tabarka, etc.

4. **`hotels`** :
   - Champs : `id`, `nom`, `description`, `etoiles` (1 à 5), `prix_par_nuit` (prix de base), `destination_id`, `image`, `tarification_enfants` (JSON/champs d'âge), `timestamps`.
   - Relations : `belongsTo(Destination)`, `hasMany(Chambre)`, `belongsToMany(Service)`, `hasMany(HotelPhoto)`, `hasMany(Avis)`.

5. **`chambres`** :
   - Champs : `id`, `hotel_id`, `type`, `nom` (ex: Chambre Double Vue Mer), `prix_base_nuit`, `capacite_adultes`, `capacite_enfants`, `quantite` (stock disponible), `remise`, `timestamps`.

6. **`pensions`** :
   - Champs : `id`, `nom` (`Logement Seul`, `Petit Déjeuner`, `Demi-Pension`, `Pension Complète`, `All Inclusive`), `timestamps`.

7. **`chambre_pension` (Table Pivot avec Prix)** :
   - Champs : `chambre_id`, `pension_id`, `supplement_prix` (Prix du supplément en DT / nuit pour cette chambre spécifique).

8. **`services` & `hotel_service`** :
   - Équipements de l'hôtel : Wifi, Piscine, Spa, Plage privée, Parking, Restaurant, etc.

9. **`hotel_photos`** :
   - Galerie photo secondaire pour chaque hôtel.

---

### 🔹 Voyages à l'étranger
10. **`voyages`** :
    - Champs : `id`, `nom`, `pays`, `description`, `prix`, `duree_jours`, `image`, `timestamps`.

---

### 🔹 Réservations, Avis & Favoris
11. **`reservations`** :
    - Champs : `id`, `user_id`, `hotel_id`, `chambre_id`, `pension_id`, `date_arrivee`, `date_depart`, `nb_adultes`, `nb_enfants`, `ages_enfants` (JSON ex: `[4, 8]`), `quantite_chambres`, `prix_total` (calculé automatiquement), `statut` (`en attente`, `confirmee`, `annulee`), `timestamps`.

12. **`avis`** :
    - Champs : `id`, `user_id`, `hotel_id`, `note` (1 à 5), `commentaire`, `timestamps`.

13. **`favoris` (Système de Cœur ❤️)** :
    - Champs : `id`, `user_id`, `hotel_id`, `timestamps` (Contrainte unique `user_id` + `hotel_id`).

---

## 3. ⚙️ LOGIQUE MÉTIER & CALCUL DES PRIX DE RÉSERVATION

Le calcul du `prix_total` lors d'une réservation respecte la règle suivante :
$$\text{Prix Total} = \Big[ \big(\text{Prix Base Chambre} + \text{Supplément Pension Chambre}\big) \times \text{Quantité Chambres} + \text{Supplément Enfants selon Âge} \Big] \times \text{Nombre de Nuits}$$

1. **Vérification de Disponibilité** : Décrémentation automatique de `chambres.quantite` lors de la création d'une réservation.
2. **Remboursement de Stock** : Restitution de `chambres.quantite` en cas d'annulation ou de suppression administrative de la réservation.

---

## 4. 🤖 AUTOMATISATION N8N & NOTIFICATIONS GMAIL

L'application communique en temps réel avec des Workflows n8n via des Webhooks HTTP POST :

### 📬 Workflow 1 : Nouvelle Réservation (`POST /webhook/nouvelle-reservation`)
- **Déclencheur** : Lorsqu'un client crée une réservation.
- **Payload** : Données du client (nom, email, téléphone), de l'hôtel, dates, chambre, pension et prix total.
- **Action n8n** : Envoi automatique d'un email de confirmation au client via le nœud Gmail n8n.

### 📬 Workflow 2 : Modification du Statut ou Suppression (`POST /webhook/statut-reservation`)
- **Déclencheur** : Lorsqu'un administrateur **Confirme**, **Annule** ou **Supprime** une réservation.
- **Payload** : `action` (`"confirmation"`, `"annulation"`, `"suppression"`), email du client, nom du client, nom de l'hôtel, dates et prix.
- **Action n8n** : Envoi d'un email d'information personnalisé au client informant du nouvel état de sa réservation.

---

## 5. 💻 COMPOSANTS FRONTEND & EXPÉRIENCE UTILISATEUR (NEXT.JS)

### 👤 Espace Client :
- **Page d'Accueil (`/`)** : Moteur de recherche avancé (Destination, Dates, Personnes), cartes d'hôtels "Nos Bons Plans" avec bouton Favori ❤️.
- **Page Hôtels (`/hotels`)** : Filtres interactifs par destination, étoiles, budget et recherche textuelle.
- **Fiche Hôtel (`/hotels/[id]`)** : Galerie photo, avis des clients, détails des chambres & pensions, calculateur dynamique de prix en temps réel et réservation.
- **Espace Profil (`/profil`)** : Gestion des informations personnelles, modification du mot de passe et upload de photo de profil.
- **Mes Réservations (`/reservations`)** : Liste des réservations passées et en cours avec badges de statut (`en attente`, `confirmée`, `annulée`).
- **Mes Favoris (`/favoris`)** : Page dédiée regroupant tous les hôtels mis en favori par l'utilisateur.

### 🛡️ Espace Administration (`/admin`) :
- **Dashboard** : Statistiques globales (Total réservations, revenus, hôtels, utilisateurs).
- **Gestion des Hôtels (`/admin/hotels`)** :
  - Création/Modification d'hôtels.
  - **Éditeur de Chambres et Suppléments de Pension** : Permet de définir pour chaque chambre de l'hôtel le prix de base, la quantité disponible et le tarif de chaque supplément de pension (Petit Déjeuner, Demi-Pension, Pension Complète, All Inclusive).
- **Gestion des Réservations (`/admin/reservations`)** : Validation (Confirmation), Annulation ou Suppression avec déclenchement automatique du Webhook n8n.
- **Système de Notifications Toast** : Remplacement des fenêtres pop-up grises `alert()` du navigateur par des bannières Toast professionnelles animées en bas à droite (Vert pour succès, Rouge pour erreur).

---

## 6. 🧪 SUITE DE TESTS AUTOMATISÉS (PHPUNIT)

- **Total Tests** : 78 tests unitaires et de fonctionnalités (**78 Passed**, 0 Failed).
- **Couverture** :
  - `AuthTest` (Inscription, connexion, mot de passe, tokens)
  - `HotelApiTest` & `ChambreApiTest` (Recherche, filtres, stock)
  - `ReservationApiTest` & `ReservationAdminTest` (Calculs de prix, annulation, remboursements de stock, webhooks)
  - `AvisApiTest` (Avis et notes)
  - `FavoriApiTest` (Gestion du cœur favori, authentification, basculement toggle)

---

## 🚀 ÉTAT ACTUEL DU PROJET
Le projet est entièrement fonctionnel, compilé sans erreur TypeScript/Next.js (`npm run build` OK), avec une base de données migrée à jour et un backend totalement testé.
