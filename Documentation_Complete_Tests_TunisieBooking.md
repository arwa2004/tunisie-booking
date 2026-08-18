# 📋 Documentation Complète des Tests — Projet TunisieBooking

> **Projet** : TunisieBooking — Plateforme de réservation hôtelière en Tunisie  
> **Stack** : Laravel 11 (API) · Next.js 14 (Client) · MySQL · Playwright · PHPUnit  
> **Date** : Juillet 2026

---

## 🗺️ Vue d'Ensemble — Architecture des Tests

```
TunisieBooking Tests
│
├── 🔬 TESTS UNITAIRES (PHPUnit — Sans base de données)
│   ├── ReservationTest.php     → Logique métier des réservations
│   ├── HotelTest.php           → Validations du modèle Hôtel
│   ├── DestinationTest.php     → Validations du modèle Destination
│   └── VoyageTest.php          → Validations du modèle Voyage
│
├── 🔗 TESTS D'INTÉGRATION / FEATURE (PHPUnit + BDD SQLite en mémoire)
│   ├── AuthTest.php            → Inscription, Connexion, Déconnexion
│   ├── HotelApiTest.php        → CRUD des Hôtels via API REST
│   ├── ChambreApiTest.php      → CRUD des Chambres via API REST
│   ├── ReservationApiTest.php  → Création de réservations (Client)
│   ├── ReservationAdminTest.php→ Gestion des réservations (Admin)
│   ├── FavoriApiTest.php       → Système de Favoris
│   ├── AvisApiTest.php         → Système d'Avis & Notations
│   └── ProfilApiTest.php       → Gestion du Profil Utilisateur
│
├── 🌐 TESTS END-TO-END (Playwright — Navigateur Chromium réel)
│   ├── auth.spec.ts            → Parcours complet d'authentification
│   ├── hotels.spec.ts          → Navigation et recherche d'hôtels
│   ├── reservation.spec.ts     → Tunnel complet de réservation
│   └── live-test-recorder.js   → Enregistrement en temps réel
│
└── ⚡ TESTS DE STRESS & CHARGE (Node.js — HTTP natif)
    └── run-stress-test.js      → 4 vagues de montée en charge (10→300 VUs)
```

---

## 🔬 PARTIE 1 — TESTS UNITAIRES (PHPUnit)

> **Principe** : Les tests unitaires vérifient une **seule méthode ou règle métier** en isolation totale, **sans jamais toucher à la base de données**. Le modèle est instancié manuellement avec des données fictives via `setRawAttributes()`.

**Commande pour lancer :**
```bash
cd server
php artisan test --testsuite=Unit
```

---

### 📄 Fichier 1 : `ReservationTest.php`
**Localisation :** `server/tests/Unit/ReservationTest.php`  
**Nombre de tests :** 16 tests

Ce fichier teste **toute la logique métier** du modèle `Reservation` : calcul du nombre de nuits, calcul du prix total avec ou sans enfants, et le cycle de vie des statuts.

---

#### Groupe A — Méthode `getNbNuits()`

Cette méthode calcule le nombre de nuits entre la date d'arrivée et la date de départ.

| # | Nom du test | Ce que l'on vérifie | Données d'entrée | Résultat attendu |
|---|-------------|---------------------|------------------|-----------------|
| 1 | `test_getNbNuits_retourne_nombre_correct` | Calcul normal sur 4 nuits | arrivée: 2025-08-01, départ: 2025-08-05 | `4` nuits |
| 2 | `test_getNbNuits_retourne_zero_si_meme_date` | Cas limite : arrivée = départ (séjour 0 nuit) | arrivée: 2025-08-01, départ: 2025-08-01 | `0` nuit |
| 3 | `test_getNbNuits_retourne_zero_si_depart_avant_arrivee` | Protection contre données incohérentes | arrivée: 2025-08-10, départ: 2025-08-05 | `0` nuit |
| 4 | `test_getNbNuits_retourne_zero_si_dates_manquantes` | Protection contre données vides | arrivée: (vide), départ: (vide) | `0` nuit |

**Pourquoi c'est important ?** Sans ces tests, un bug dans ce calcul affecterait silencieusement tous les prix calculés sur la plateforme.

---

#### Groupe B — Méthode `calculatePrixTotal(float $prixNuit)`

Cette méthode calcule le prix total en appliquant des suppléments selon l'âge des enfants :
- Enfant **< 2 ans** → Gratuit
- Enfant **2 à 12 ans** → +30 DT/nuit
- Enfant **> 12 ans** → +50 DT/nuit

**Formule :** `(prix_nuit + suppléments_enfants) × nb_nuits × nb_chambres`

| # | Nom du test | Scénario | Détail du calcul | Résultat attendu |
|---|-------------|----------|-----------------|-----------------|
| 5 | `test_calculatePrixTotal_correct_sans_enfants` | 4 nuits, 2 chambres, 0 enfant | 200 × 4 × 2 = **1 600 DT** | `1600.0` |
| 6 | `test_calculatePrixTotal_avec_enfants_de_differents_ages` | 4 nuits, 1 chambre, 3 enfants (1 an, 5 ans, 14 ans) | Gratuit + 30 + 50 = 80 DT de supplément · (200+80) × 4 = **1 120 DT** | `1120.0` |
| 7 | `test_calculatePrixTotal_une_nuit_une_chambre_sans_enfants` | 1 nuit, 1 chambre, 0 enfant | 350 × 1 × 1 = **350 DT** | `350.0` |
| 8 | `test_calculatePrixTotal_zero_si_meme_date` | Séjour 0 nuit (impossible de réserver) | 0 nuit → **0 DT** | `0.0` |

**Pourquoi c'est important ?** C'est la règle métier la plus critique : une erreur de facturation peut coûter de l'argent à l'hôtel ou au client.

---

#### Groupe C — Méthode `isStatutValide(string $statut)`

Vérifie si un statut donné fait partie des statuts autorisés : `en_attente`, `confirmee`, `annulee`.

| # | Nom du test | Ce que l'on vérifie | Résultat attendu |
|---|-------------|---------------------|-----------------|
| 9 | `test_isStatutValide_retourne_true_pour_en_attente` | `en_attente` est un statut valide | `true` |
| 10 | `test_isStatutValide_retourne_true_pour_confirmee` | `confirmee` est un statut valide | `true` |
| 11 | `test_isStatutValide_retourne_true_pour_annulee` | `annulee` est un statut valide | `true` |
| 12 | `test_isStatutValide_retourne_false_pour_statut_inconnu` | `payee`, `""`, `CONFIRMEE` sont invalides (sensible à la casse) | `false` pour les 3 |

---

#### Groupe D — Méthode `canTransitionTo(string $nouveauStatut)`

Vérifie si le changement de statut est logiquement autorisé selon un diagramme d'états :

```
  [en_attente] ──► [confirmee]
       │
       └──────────► [annulee]  (état terminal)
  
  [annulee] → ❌ Aucune transition possible
  [confirmee] → ❌ Aucune transition possible
```

| # | Nom du test | Transition testée | Résultat attendu |
|---|-------------|-------------------|-----------------|
| 13 | `test_canTransitionTo_en_attente_vers_confirmee` | `en_attente` → `confirmee` | `true` (autorisé) |
| 14 | `test_canTransitionTo_en_attente_vers_annulee` | `en_attente` → `annulee` | `true` (autorisé) |
| 15 | `test_canTransitionTo_annulee_est_etat_terminal` | `annulee` → `confirmee` ou `en_attente` | `false` (interdit) |
| 16 | `test_canTransitionTo_retourne_false_pour_statut_invalide` | `en_attente` → `payee` | `false` (statut inexistant) |

---

#### Groupe E — Méthode statique `getStatutsValides()`

Retourne la liste complète des statuts autorisés dans le système.

| # | Nom du test | Ce que l'on vérifie | Résultat attendu |
|---|-------------|---------------------|-----------------|
| 17 | `test_getStatutsValides_contient_les_trois_statuts` | Liste complète et exacte | Tableau contenant exactement `['en_attente', 'confirmee', 'annulee']` (3 éléments) |

---

### 📄 Fichier 2 : `HotelTest.php`
**Localisation :** `server/tests/Unit/HotelTest.php`  
**Nombre de tests :** 8 tests

Ce fichier teste les **règles de validation métier** du modèle `Hotel` : disponibilité, nombre d'étoiles et prix.

---

#### Groupe A — Méthode `isDisponible()`

| # | Nom du test | Ce que l'on vérifie | Résultat attendu |
|---|-------------|---------------------|-----------------|
| 1 | `test_isDisponible_retourne_true_quand_disponible` | Hôtel avec `disponible = true` | `true` |
| 2 | `test_isDisponible_retourne_false_quand_indisponible` | Hôtel avec `disponible = false` | `false` |

---

#### Groupe B — Méthode `isEtoilesValide()`

Les hôtels ont entre 1 et 5 étoiles. 0 et 6 sont invalides.

| # | Nom du test | Ce que l'on vérifie | Résultat attendu |
|---|-------------|---------------------|-----------------|
| 3 | `test_isEtoilesValide_retourne_true_pour_1_a_5` | Chaque valeur de 1 à 5 est valide | `true` pour 1, 2, 3, 4, 5 |
| 4 | `test_isEtoilesValide_retourne_false_pour_zero` | 0 étoile est invalide | `false` |
| 5 | `test_isEtoilesValide_retourne_false_pour_six` | 6 étoiles est invalide | `false` |

---

#### Groupe C — Méthode `isPrixValide()`

| # | Nom du test | Ce que l'on vérifie | Résultat attendu |
|---|-------------|---------------------|-----------------|
| 6 | `test_isPrixValide_retourne_true_pour_prix_positif` | Prix = 200 DT → valide | `true` |
| 7 | `test_isPrixValide_retourne_false_pour_prix_zero` | Prix = 0 DT → invalide | `false` |
| 8 | `test_isPrixValide_retourne_false_pour_prix_negatif` | Prix = -50 DT → invalide | `false` |

---

### 📄 Fichier 3 : `DestinationTest.php`
**Localisation :** `server/tests/Unit/DestinationTest.php`  
**Nombre de tests :** 6 tests

Ce fichier teste les **méthodes de validation et d'affichage** du modèle `Destination`.

| # | Méthode testée | Scénario | Résultat attendu |
|---|---------------|----------|-----------------|
| 1 | `hasNom()` | Destination avec nom 'Tunis' | `true` |
| 2 | `hasNom()` | Destination avec nom vide `''` | `false` |
| 3 | `hasNom()` | Destination sans attribut `nom` | `false` |
| 4 | `hasRegion()` | Destination avec région 'Sahel' | `true` |
| 5 | `hasRegion()` | Destination avec région vide `''` | `false` |
| 6 | `getNomComplet()` | Djerba + Médenine | `"Djerba (Médenine)"` — Format d'affichage normalisé |

---

### 📄 Fichier 4 : `VoyageTest.php`
**Localisation :** `server/tests/Unit/VoyageTest.php`  
**Nombre de tests :** 7 tests

Ce fichier teste les **méthodes du modèle `Voyage`** : validité du prix, de la durée et formatage du label.

#### Groupe A — Méthode `isPrixValide()`

| # | Scénario | Résultat attendu |
|---|----------|-----------------|
| 1 | Prix = 1500 DT | `true` |
| 2 | Prix = 0 DT | `false` |
| 3 | Prix = -200 DT | `false` |

#### Groupe B — Méthode `isDureeValide()`

| # | Scénario | Résultat attendu |
|---|----------|-----------------|
| 4 | Durée = 1 jour | `true` (minimum autorisé) |
| 5 | Durée = 7 jours | `true` |
| 6 | Durée = 0 jour | `false` (voyage impossible) |

#### Groupe C — Méthode `getDureeLabel()`

| # | Scénario | Résultat attendu |
|---|----------|-----------------|
| 7 | Durée = 1 → singulier | `"1 jour"` |
| 8 | Durée = 10 → pluriel | `"10 jours"` |

---

## 🔗 PARTIE 2 — TESTS D'INTÉGRATION / FEATURE (PHPUnit + API REST)

> **Principe** : Les tests Feature testent **plusieurs couches ensemble** (Contrôleur → Service → Modèle → Base de données). Ils utilisent une base SQLite en mémoire recréée avant chaque test via `RefreshDatabase`. Ces tests vérifient que les routes HTTP de l'API répondent correctement.

**Commande pour lancer :**
```bash
cd server
php artisan test --testsuite=Feature
```

**Commande pour tout lancer :**
```bash
cd server
php artisan test
```

---

### 📄 Fichier 1 : `AuthTest.php`
**Localisation :** `server/tests/Feature/AuthTest.php`  
**Nombre de tests :** 4 tests

Ce fichier valide le **cycle complet d'authentification** : inscription, connexion, et déconnexion.

---

#### Test 1 : `test_register_returns_token`
**Route :** `POST /api/register`

**Objectif :** Vérifier qu'un nouvel utilisateur peut créer un compte et reçoit immédiatement un token d'authentification Sanctum.

**Données envoyées :**
```json
{
  "nom": "Ben Ali",
  "prenom": "Ahmed",
  "email": "ahmed@test.com",
  "telephone": "+21612345678",
  "password": "Password123",
  "password_confirmation": "Password123"
}
```

**Ce qui est vérifié :**
- ✅ Statut HTTP `201 Created`
- ✅ La réponse contient les champs `token` et `user`

---

#### Test 2 : `test_login_correct_returns_200`
**Route :** `POST /api/login`

**Objectif :** Vérifier qu'un utilisateur existant peut se connecter avec les bons identifiants.

**Ce qui est vérifié :**
- Un utilisateur est créé en base avec `User::factory()->create()`
- On envoie l'email et le mot de passe corrects
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient les champs `token` et `user`

---

#### Test 3 : `test_login_wrong_password_returns_401`
**Route :** `POST /api/login`

**Objectif :** Vérifier que la connexion est refusée avec un mauvais mot de passe.

**Ce qui est vérifié :**
- On envoie `mauvais_password` au lieu du vrai mot de passe
- ✅ Statut HTTP `401 Unauthorized`

---

#### Test 4 : `test_logout_revokes_token`
**Route :** `POST /api/logout`

**Objectif :** Vérifier que la déconnexion révoque le token Sanctum (il ne peut plus être réutilisé).

**Ce qui est vérifié :**
- Un token est créé manuellement via `$user->createToken('test')->plainTextToken`
- On appelle `/api/logout` avec ce token dans le header `Authorization: Bearer`
- ✅ Statut HTTP `200 OK`
- ✅ La table `personal_access_tokens` est **vide** → le token a été supprimé

---

### 📄 Fichier 2 : `HotelApiTest.php`
**Localisation :** `server/tests/Feature/HotelApiTest.php`  
**Nombre de tests :** 5 tests

Ce fichier valide les **opérations CRUD sur les hôtels** via l'API REST.

---

#### Test 1 : `test_get_hotels_returns_list`
**Route :** `GET /api/hotels`

**Objectif :** Vérifier que la liste des hôtels est accessible publiquement (sans authentification) et retourne le bon nombre d'éléments.

**Ce qui est vérifié :**
- 2 hôtels sont créés en base via Factory
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient exactement **2 hôtels**

---

#### Test 2 : `test_get_hotel_by_id_returns_correct_hotel`
**Route :** `GET /api/hotels/{id}`

**Objectif :** Vérifier qu'on peut récupérer les détails d'un hôtel spécifique par son identifiant.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient le champ `nom` avec la valeur correcte de l'hôtel

---

#### Test 3 : `test_get_hotel_inexistant_returns_404`
**Route :** `GET /api/hotels/9999`

**Objectif :** Vérifier que l'API retourne une erreur 404 si l'hôtel n'existe pas.

**Ce qui est vérifié :**
- ✅ Statut HTTP `404 Not Found`

---

#### Test 4 : `test_create_hotel_without_token_returns_401`
**Route :** `POST /api/hotels`

**Objectif :** Vérifier que la création d'hôtel est protégée — impossible sans authentification.

**Ce qui est vérifié :**
- Requête envoyée **sans token** `Authorization`
- ✅ Statut HTTP `401 Unauthorized`

---

#### Test 5 : `test_create_hotel_with_token_returns_201`
**Route :** `POST /api/hotels`

**Objectif :** Vérifier qu'un administrateur peut créer un hôtel.

**Ce qui est vérifié :**
- Un utilisateur avec `role = 'admin'` est créé
- La requête est envoyée avec son token Bearer
- ✅ Statut HTTP `201 Created`
- ✅ La réponse contient `"nom": "Hotel Test"`

---

### 📄 Fichier 3 : `ReservationApiTest.php`
**Localisation :** `server/tests/Feature/ReservationApiTest.php`  
**Nombre de tests :** 5 tests

Ce fichier est le **plus complexe** — il valide toutes les règles métier à l'API de création de réservation.

**Structure de la mise en place (`makeHotelWithChambre`) :**
1. Création d'une destination
2. Création d'un hôtel (sans déclencher la génération auto de chambres via `withoutEvents`)
3. Création manuelle d'une chambre double avec capacité connue
4. Création d'une pension et attachement à la chambre

---

#### Test 1 : `test_create_reservation_without_token_returns_401`
**Route :** `POST /api/reservations`

**Objectif :** Vérifier qu'on ne peut pas réserver sans être connecté.

**Ce qui est vérifié :**
- ✅ Statut HTTP `401 Unauthorized`

---

#### Test 2 : `test_create_reservation_with_invalid_data_returns_422`
**Route :** `POST /api/reservations`

**Objectif :** Vérifier que le serveur rejette les données invalides (hotel_id qui n'existe pas).

**Ce qui est vérifié :**
- On envoie `hotel_id: 9999` (inexistant en base)
- ✅ Statut HTTP `422 Unprocessable Entity` (validation échouée)

---

#### Test 3 : `test_create_reservation_valid_returns_201_with_prix`
**Route :** `POST /api/reservations`

**Objectif :** Vérifier le **scénario complet de réservation** — le serveur crée la réservation et calcule le prix automatiquement.

**Données envoyées :**
```json
{
  "hotel_id": 1,
  "chambre_id": 1,
  "pension_id": 1,
  "date_arrivee": "2026-08-01",
  "date_depart": "2026-08-04",
  "nb_chambres": 1,
  "nb_adultes": 2,
  "nb_enfants": 0
}
```

**Ce qui est vérifié :**
- ✅ Statut HTTP `201 Created`
- ✅ `prix_total = 600` (3 nuits × 200 DT × 1 chambre — calculé côté serveur)
- ✅ `statut = "en_attente"` (statut initial automatique)

---

#### Test 4 : `test_create_reservation_chambre_wrong_hotel_returns_422`
**Route :** `POST /api/reservations`

**Objectif :** Vérifier une règle métier importante — une chambre appartenant à un **autre hôtel** doit être refusée.

**Ce qui est vérifié :**
- On crée un deuxième hôtel avec une chambre différente
- On tente de réserver l'hôtel 1 avec la chambre de l'hôtel 2
- ✅ Statut HTTP `422 Unprocessable Entity`
- ✅ Message d'erreur : `"La chambre sélectionnée n'appartient pas à cet hôtel."`

---

#### Test 5 : `test_create_reservation_capacite_insuffisante_returns_422`
**Route :** `POST /api/reservations`

**Objectif :** Vérifier qu'on ne peut pas réserver si le nombre d'adultes dépasse la capacité de la chambre.

**Ce qui est vérifié :**
- La chambre a une capacité de 2 adultes
- On demande 5 adultes
- ✅ Statut HTTP `422 Unprocessable Entity`

---

### 📄 Fichier 4 : `ReservationAdminTest.php`
**Localisation :** `server/tests/Feature/ReservationAdminTest.php`  
**Nombre de tests :** 6 tests

Ce fichier valide les **actions réservées à l'administrateur** pour gérer les réservations.

---

#### Test 1 : `test_get_all_reservations_without_admin_returns_401`
**Route :** `GET /api/reservations`

**Objectif :** Vérifier qu'un client ordinaire ne peut pas voir toutes les réservations.

**Ce qui est vérifié :**
- Un utilisateur avec `role = 'user'` tente d'accéder à la liste
- ✅ Statut HTTP `403 Forbidden` (authentifié mais pas autorisé)

> **Note :** 401 = non authentifié, 403 = authentifié mais pas le bon rôle

---

#### Test 2 : `test_admin_can_list_all_reservations`
**Route :** `GET /api/reservations`

**Objectif :** Vérifier que l'admin peut voir toutes les réservations de la plateforme.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La liste contient exactement 1 réservation

---

#### Test 3 : `test_admin_can_confirm_reservation`
**Route :** `PUT /api/reservations/{id}`

**Objectif :** Vérifier qu'un admin peut confirmer une réservation en attente.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient `"statut": "confirmee"`

---

#### Test 4 : `test_admin_can_cancel_reservation`
**Route :** `PUT /api/reservations/{id}`

**Objectif :** Vérifier qu'un admin peut annuler une réservation.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient `"statut": "annulee"`

---

#### Test 5 : `test_admin_update_invalid_statut_returns_422`
**Route :** `PUT /api/reservations/{id}`

**Objectif :** Vérifier que l'admin ne peut pas définir un statut inventé.

**Ce qui est vérifié :**
- On envoie `statut = "zombie"` (n'existe pas dans le système)
- ✅ Statut HTTP `422 Unprocessable Entity`

---

#### Test 6 : `test_admin_can_delete_reservation`
**Route :** `DELETE /api/reservations/{id}`

**Objectif :** Vérifier qu'un admin peut supprimer définitivement une réservation.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La réservation **n'existe plus en base** (`assertDatabaseMissing`)

---

### 📄 Fichier 5 : `FavoriApiTest.php`
**Localisation :** `server/tests/Feature/FavoriApiTest.php`  
**Nombre de tests :** 3 tests

Ce fichier valide le **système de favoris** : ajouter/retirer un hôtel en favori (fonctionnement en toggle).

---

#### Test 1 : `test_unauthorized_user_cannot_access_favoris`
**Route :** `GET /api/favoris`

**Ce qui est vérifié :**
- ✅ Statut HTTP `401` sans token

---

#### Test 2 : `test_user_can_toggle_hotel_favori`
**Route :** `POST /api/favoris/{hotel_id}`

**Objectif :** Tester le comportement en **toggle** (un seul endpoint ajoute et retire).

**Ce qui est vérifié :**
1. Premier appel → hôtel **ajouté** aux favoris
   - ✅ Réponse : `{"favori": true, "message": "Ajouté aux favoris"}`
   - ✅ La table `favoris` contient l'enregistrement
2. Vérification de la liste des IDs via `GET /api/favoris/ids`
   - ✅ Retourne `[hotel_id]`
3. Deuxième appel → hôtel **retiré** des favoris
   - ✅ Réponse : `{"favori": false, "message": "Retiré des favoris"}`
   - ✅ La table `favoris` ne contient plus l'enregistrement

---

#### Test 3 : `test_user_can_get_favoris_list`
**Route :** `GET /api/favoris`

**Objectif :** Vérifier que la liste complète des hôtels favoris est retournée avec les détails.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La liste contient **1 hôtel**
- ✅ L'hôtel retourné s'appelle `"Hotel Test"`

---

### 📄 Fichier 6 : `AvisApiTest.php`
**Localisation :** `server/tests/Feature/AvisApiTest.php`  
**Nombre de tests :** 5 tests

Ce fichier valide le **système d'avis et de notation** des hôtels.

---

#### Test 1 : `test_get_avis_returns_list_and_stats`
**Route :** `GET /api/hotels/{id}/avis`

**Objectif :** Vérifier que l'API retourne les avis avec les statistiques calculées (moyennes, pourcentage recommandé).

**Mise en place :** 2 avis créés en base
- Avis 1 : note_globale = 8 (≥ 7 → recommandé)
- Avis 2 : note_globale = 6 (< 7 → non recommandé)

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ Structure JSON : `count`, `pct_recommande`, `moyennes.globale`, `moyennes.qualite_prix`, `moyennes.chambres`, `avis`
- ✅ `count = 2` (deux avis)
- ✅ `pct_recommande = 50` (1 avis sur 2 avec note ≥ 7)

---

#### Test 2 : `test_post_avis_without_token_returns_401`
**Route :** `POST /api/hotels/{id}/avis`

**Ce qui est vérifié :**
- ✅ Statut HTTP `401` — impossible de noter sans être connecté

---

#### Test 3 : `test_post_avis_with_token_creates_or_updates`
**Route :** `POST /api/hotels/{id}/avis`

**Objectif :** Vérifier le comportement **upsert** — un utilisateur ne peut laisser qu'un seul avis, et un deuxième appel met à jour le premier.

**Ce qui est vérifié :**
1. Premier avis → créé en base avec `note_globale = 9`
   - ✅ Statut HTTP `201 Created`
   - ✅ Base de données contient l'avis avec `commentaire = "Top !"`
2. Deuxième avis → **met à jour** le premier avec `note_globale = 8`
   - ✅ Statut HTTP `201`
   - ✅ Base contient `commentaire = "Moins bien finalement."`
   - ✅ `assertDatabaseCount('avis', 1)` — toujours **1 seul avis** en base

---

#### Test 4 : `test_post_avis_invalid_notes_returns_422`
**Route :** `POST /api/hotels/{id}/avis`

**Ce qui est vérifié :**
- On envoie `note_globale = 12` (les notes vont de 0 à 10)
- ✅ Statut HTTP `422 Unprocessable Entity`

---

#### Test 5 : `test_delete_avis_authorized`
**Route :** `DELETE /api/avis/{id}`

**Objectif :** Vérifier qu'un utilisateur peut supprimer son propre avis.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ L'avis **n'existe plus en base** (`assertDatabaseMissing`)

---

### 📄 Fichier 7 : `ChambreApiTest.php`
**Localisation :** `server/tests/Feature/ChambreApiTest.php`  
**Nombre de tests :** 6 tests

Ce fichier valide les **opérations CRUD sur les chambres**.

| # | Route | Rôle requis | Ce qui est vérifié |
|---|-------|------------|-------------------|
| 1 | `GET /api/hotels/{id}/chambres` | Public | Retourne la liste des chambres d'un hôtel · Statut 200 · 1 chambre |
| 2 | `GET /api/chambres/9999` | Public | Chambre inexistante → Statut 404 |
| 3 | `POST /api/hotels/{id}/chambres` | Aucun (sans token) | Tentative sans token → Statut 401 |
| 4 | `POST /api/hotels/{id}/chambres` | Admin | Création valide → Statut 201 · `nom = "Chambre Triple Vue Mer"` · `prix = 250` |
| 5 | `POST /api/chambres/{id}` | Admin | Mise à jour prix → Statut 200 · `prix_base_nuit = 180` · `quantite = 5` |
| 6 | `DELETE /api/chambres/{id}` | Admin | Suppression → Statut 200 · `message = "Chambre supprimée"` · Plus en base |

---

### 📄 Fichier 8 : `ProfilApiTest.php`
**Localisation :** `server/tests/Feature/ProfilApiTest.php`  
**Nombre de tests :** 3 tests

Ce fichier valide la **gestion du profil utilisateur**.

---

#### Test 1 : `test_me_returns_authenticated_user`
**Route :** `GET /api/me`

**Objectif :** Vérifier qu'un utilisateur connecté peut récupérer ses propres informations.

**Ce qui est vérifié :**
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient l'email de l'utilisateur connecté

---

#### Test 2 : `test_update_profile_updates_correctly`
**Route :** `PUT /api/me`

**Objectif :** Vérifier qu'un utilisateur peut mettre à jour son profil.

**Ce qui est vérifié :**
- On envoie `nom = "Nouveau"`, `prenom = "Prénom"`, etc.
- ✅ Statut HTTP `200 OK`
- ✅ La réponse contient `"nom": "Nouveau"`

---

#### Test 3 : `test_update_password_wrong_current_returns_422`
**Route :** `PUT /api/me/password`

**Objectif :** Vérifier qu'on ne peut pas changer le mot de passe sans fournir le bon mot de passe actuel.

**Ce qui est vérifié :**
- On envoie `current_password = "mauvais_password"` (le vrai est `correct123`)
- ✅ Statut HTTP `422 Unprocessable Entity`

---

## 🌐 PARTIE 3 — TESTS END-TO-END (Playwright)

> **Principe** : Les tests E2E simulent un **vrai utilisateur humain** qui interagit avec l'interface graphique du navigateur. Playwright contrôle un navigateur Chromium réel, clique sur les boutons, remplit les formulaires et vérifie ce qui est affiché à l'écran.

**Commande pour lancer :**
```bash
cd client
npx playwright test
npx playwright test --headed    # Avec affichage du navigateur
npx playwright test --ui        # Mode interactif avec interface
```

**Commande Live Recorder (enregistrement manuel) :**
```bash
cd client
node live-test-recorder.js
```

---

### 🎭 Qu'est-ce que Playwright ?

Playwright est un outil de Microsoft qui permet d'automatiser un navigateur web. Il peut :
- Ouvrir une page web
- Cliquer sur des boutons
- Remplir des formulaires
- Vérifier que le texte affiché est correct
- Prendre des captures d'écran
- Enregistrer des vidéos de test

---

### Parcours testés (Specs)

#### `auth.spec.ts` — Authentification

**Scénario 1 : Inscription d'un nouvel utilisateur**
1. Ouvrir la page `/register`
2. Remplir le formulaire (nom, prénom, email, téléphone, mot de passe)
3. Cliquer sur "S'inscrire"
4. Vérifier la redirection vers la page d'accueil
5. Vérifier que le nom de l'utilisateur apparaît dans la barre de navigation

**Scénario 2 : Connexion**
1. Ouvrir la page `/login`
2. Saisir l'email et le mot de passe
3. Cliquer sur "Se connecter"
4. Vérifier la redirection

**Scénario 3 : Connexion avec mauvais identifiants**
1. Saisir des identifiants incorrects
2. Vérifier qu'un message d'erreur s'affiche

---

#### `hotels.spec.ts` — Navigation et Recherche

**Scénario 1 : Liste des hôtels**
1. Ouvrir la page `/hotels`
2. Vérifier que les cartes d'hôtels s'affichent
3. Vérifier la présence des filtres

**Scénario 2 : Fiche détail d'un hôtel**
1. Cliquer sur un hôtel dans la liste
2. Vérifier que la page de détail s'ouvre
3. Vérifier les informations (nom, étoiles, prix, description)
4. Vérifier l'onglet "Chambres"
5. Vérifier l'onglet "Avis"

---

#### `reservation.spec.ts` — Tunnel de Réservation

**Scénario complet :**
1. Connexion utilisateur
2. Navigation vers un hôtel
3. Sélection d'une chambre
4. Sélection des dates
5. Clic sur "Réserver"
6. Vérification du récapitulatif avec prix calculé
7. Confirmation de la réservation
8. Vérification dans "Mes réservations"

---

### 📽️ Live Test Recorder (`live-test-recorder.js`)

**Objectif :** Permettre aux testeurs humains de naviguer manuellement dans l'application pendant qu'un script Playwright enregistre automatiquement chaque action dans un fichier Excel.

**Comment ça fonctionne :**
1. Le script ouvre un navigateur Chromium en mode non-headless
2. Il intercepte toutes les requêtes HTTP via `page.route()`
3. Chaque clic, navigation, et appel API est horodaté et sauvegardé
4. À la fermeture du navigateur → génération automatique du rapport Excel

**Données enregistrées :**
- Horodatage de chaque action
- Type d'action (Navigation / Clic / API Call)
- URL visitée
- Méthode HTTP et endpoint appelé
- Code de statut de la réponse
- Temps de réponse (ms)
- Données de réponse (parsées par champs)

**Rapport généré :** `reports/Session_Live_Tests.xlsx`

---

## ⚡ PARTIE 4 — TESTS DE STRESS & CHARGE

> **Principe** : Les tests de stress envoient un **très grand nombre de requêtes simultanées** pour trouver la limite à partir de laquelle le serveur commence à ralentir ou à tomber en erreur.

**Commande pour lancer :**
```bash
node reports/run-stress-test.js
```

**Rapport généré :** `reports/Rapport_Test_De_Stress.xlsx`

---

### 🎯 Endpoints testés

| ID | Endpoint | Méthode | Description |
|----|----------|---------|-------------|
| EP-01 | `/api/hotels` | GET | Liste de tous les hôtels |
| EP-02 | `/api/hotels/1` | GET | Fiche détail d'un hôtel |
| EP-03 | `/api/hotels/1/chambres` | GET | Chambres d'un hôtel |
| EP-04 | `/api/hotels/1/avis` | GET | Avis d'un hôtel |
| EP-05 | `/api/destinations` | GET | Liste des destinations |
| EP-06 | `/api/voyages` | GET | Liste des voyages |
| EP-07 | `/api/login` | POST | Authentification (charge CPU Bcrypt) |

---

### 📈 Les 4 Vagues de Charge

Le test monte en puissance progressivement pour identifier la limite de rupture :

| Vague | VUs Simultanés | Durée | Objectif |
|-------|---------------|-------|----------|
| **Vague 1** — Charge Normale | 10 VUs | 5 secondes | Comportement en conditions normales |
| **Vague 2** — Charge Élevée | 50 VUs | 5 secondes | Simulation d'un jour d'affluence |
| **Vague 3** — Pic de Saison | 150 VUs | 5 secondes | Simulation de la haute saison touristique |
| **Vague 4** — Stress Extrême | 300 VUs | 5 secondes | Trouver le Breakpoint (point de rupture) |

> **VU = Virtual User** = Un utilisateur simulé qui envoie des requêtes en boucle pendant la durée de la vague.

---

### 📊 Métriques Mesurées

Pour chaque vague, le test calcule et affiche :

| Métrique | Signification | Objectif |
|----------|--------------|----------|
| **RPS** (Req/sec) | Nombre de requêtes traitées par seconde | Plus c'est élevé, mieux c'est |
| **Apdex Score** | Score de satisfaction (0 à 1) | > 0.85 = Satisfaisant |
| **Taux de Succès** | % de réponses HTTP 2xx | > 95% est recommandé |
| **Moyenne** (ms) | Temps moyen de réponse | < 500ms en production |
| **Max** (ms) | Pire temps de réponse | Détecte les pics |
| **p95** (ms) | 95% des requêtes répondent sous ce délai | Indicateur de qualité |

**Calcul du Score Apdex :**
- Requête **< 500 ms** → Satisfaisante (score = 1)
- Requête entre **500 ms et 2 000 ms** → Tolérée (score = 0.5)
- Requête **> 2 000 ms** → Frustrante (score = 0)

```
Apdex = (Satisfaisantes + (Tolérées / 2)) / Total
```

---

### 📋 Structure du Rapport Excel (3 onglets)

**Onglet 1 — "⚡ Résumé des Vagues"**  
Tableau récapitulatif des 4 vagues avec toutes les métriques. Les taux de succès < 90% sont mis en rouge automatiquement.

**Onglet 2 — "🔍 Analyse par Endpoint"**  
Tableau des performances de chaque endpoint séparément : nombre total de requêtes reçues, succès, échecs et temps moyen. Permet d'identifier **quel endpoint est le goulet d'étranglement**.

**Onglet 3 — "💡 Plan d'Optimisation"**  
Liste des recommandations d'optimisation basées sur les résultats :

| Problème identifié | Recommandation |
|-------------------|---------------|
| Endpoints GET lents sous charge | Cache Redis → réduit la charge MySQL de 90% |
| Serveur php artisan serve limité | Laravel Octane/Swoole → ×10 débit |
| `/api/login` lent (Bcrypt CPU) | Ajuster le coût Bcrypt ou passer à Argon2id |
| Rejet des connexions en Vague 4 | Augmenter `max_connections` MySQL + Connection Pooling |
| Pas de compression HTTP | Nginx + Gzip/Brotli |

---

## 📊 Tableau Récapitulatif — Comparaison des Types de Tests

| Critère | Tests Unitaires | Tests Feature | Tests E2E | Tests de Stress |
|---------|----------------|--------------|-----------|----------------|
| **Ce qui est testé** | Une méthode isolée | Une route HTTP complète | L'interface utilisateur | La performance sous charge |
| **Base de données** | ❌ Non | ✅ SQLite en mémoire | ✅ BDD réelle | ✅ BDD réelle |
| **Navigateur** | ❌ Non | ❌ Non | ✅ Chromium réel | ❌ Non |
| **Vitesse** | ⚡ Très rapide (<1ms) | 🏃 Rapide (10-100ms) | 🐢 Lent (2-5s/test) | ⚡ Rapide (HTTP direct) |
| **Isolation** | 🔬 Totale | 🔗 Partielle | 🌐 Aucune | 🌐 Aucune |
| **Quand les lancer** | À chaque commit | À chaque commit | Avant chaque release | Avant la mise en prod |
| **Nombre dans ce projet** | **31 tests** | **33 tests** | **3 specs Playwright** | **4 vagues / 7 endpoints** |

---

## 🚀 Commandes Rapides — Récapitulatif

```bash
# Tests Unitaires seulement
cd server && php artisan test --testsuite=Unit

# Tests Feature seulement
cd server && php artisan test --testsuite=Feature

# Tous les tests Laravel (Unitaire + Feature)
cd server && php artisan test

# Tests E2E Playwright (interface graphique)
cd client && npx playwright test

# Tests E2E avec navigateur visible
cd client && npx playwright test --headed

# Live recorder (navigation manuelle enregistrée)
cd client && node live-test-recorder.js

# Tests de stress
node reports/run-stress-test.js
```

---

*Document généré pour le projet TunisieBooking — Stage 2025/2026*
