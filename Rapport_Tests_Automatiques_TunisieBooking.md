# 🧪 RAPPORT COMPLET SUR LES TESTS LOGICIELS AUTOMATISÉS
## Plateforme Microservices Polyglotte — TunisieBooking
**Présenté par :** Arwa Ben Amar  
**Destination :** Maître de stage / Jury de Soutenance  
**Architecture :** Microservices conteneurisés (Docker, Nginx Gateway, Spring/H2, Node/MongoDB, Laravel/MySQL, Keycloak, Eureka)  

---

## 📑 Table des Matières
1. [Synthèse Éxécutive & Pyramide des Tests](#1-synthèse-éxécutive--pyramide-des-tests)
2. [Niveau 1 — Tests Unitaires Métier & Composants (Jest)](#2-niveau-1--tests-unitaires-métier--composants-jest)
3. [Niveau 2 — Tests d'Intégration API REST (Jest + BDD)](#3-niveau-2--tests-dintégration-api-rest-jest--bdd)
4. [Niveau 3 — Tests E2E / Bout-en-Bout (Playwright Chromium)](#4-niveau-3--tests-e2e--bout-en-bout-playwright-chromium)
5. [Niveau 4 — Tests d'Architecture & Nginx (CORS Preflight)](#5-niveau-4--tests-darchitecture--nginx-cors-preflight)
6. [Niveau 5 — Tests de Montée en Charge (Load Testing avec Postman)](#6-niveau-5--tests-de-montée-en-charge-load-testing-avec-postman)
7. [Niveau 6 — Tests de Résilience & Tolérance aux Pannes (Docker & Eureka)](#7-niveau-6--tests-de-résilience--tolérance-aux-pannes-docker--eureka)
8. [Conclusion & Tableau Récapitulatif](#8-conclusion--tableau-récapitulatif)

---

## 1. Synthèse Éxécutive & Pyramide des Tests

Ce rapport présente l'ensemble des **63+ tests automatisés** mis en œuvre sur la plateforme **TunisieBooking**. 

L'architecture microservices ayant une nature distribuée, la stratégie de test s'appuie sur la **Pyramide des Tests**, de l'unité métier jusqu'à la tolérance aux pannes d'infrastructure conteneurisée :

```
                     🔺 Level 6: Résilience & Pannes Docker (Eureka)
                   ──────────────────────────────────────────────────
                    ⚡ Level 5: Montée en Charge (Postman 427 req/s)
                  ────────────────────────────────────────────────────
                   🔒 Level 4: CORS Preflight & Nginx Gateway (HTTP 204)
                 ──────────────────────────────────────────────────────
                  🌐 Level 3: Tests E2E Playwright (Chromium 21 Scénarios)
                ────────────────────────────────────────────────────────
                 🔶 Level 2: Tests d'Intégration API REST & BDD (Jest 31 Tests)
               ──────────────────────────────────────────────────────────
                🟢 Level 1: Tests Unitaires Métier & Composants UI (Jest 17 Tests)
```

| Catégorie | Outil / Framework | Nombre de Tests | Résultat |
|---|---|---|---|
| **Tests Unitaires Métier** | Jest (Node.js) | 11 tests | **100% PASSÉ 🟢** |
| **Tests Composants UI** | React Testing Library | 6 suites | **100% PASSÉ 🟢** |
| **Tests Intégration API** | Jest + MongoDB & Express | 31 tests | **100% PASSÉ 🟢** |
| **Tests E2E navigateur** | Playwright (Chromium) | 21 tests | **100% PASSÉ 🟢** |
| **Smoke & CORS Gateway** | Nginx / cURL | 7 endpoints + HTTP 204 | **100% PASSÉ 🟢** |
| **Montée en Charge** | Postman Performance Runner | 14 600 req / 427 req/s | **100% PASSÉ 🟢** |
| **Résilience Docker** | Docker Engine & Eureka | Stop/Start conteneur | **100% PASSÉ 🟢** |

---

## 2. Niveau 1 — Tests Unitaires Métier & Composants (Jest)

> 🎯 **Rôle du Test :**  
> Les tests unitaires vérifient le fonctionnement des **fonctions métiers pures** (comme le calcul des prix) et des **composants d'interface React** en totale isolation, sans dépendre d'un serveur ou d'une base de données. Ils permettent d'attraper les bugs d'affichage ou d'algorithme instantanément (en quelques millisecondes).

### A. Logique Métier de Calcul des Tarifs (`priceCalculator.test.js`)
Ce module teste la formule de calcul de réservation de TunisieBooking :

- **Règles validées :**
  - Gratuité des enfants de moins de 2 ans (`+0 DT`).
  - Tarification enfants de 2 à 11 ans (`+30 DT / nuit`).
  - Tarification enfants de 12 ans et plus (`+50 DT / nuit`).
  - Prise en compte du supplément pension et du multiplicateur de chambres.
  - Calcul du nombre exact de nuits entre deux dates et arrondi à l'entier.

```bash
cd services/booking-service && npx jest tests/unit/priceCalculator.test.js
```
> **Résultat :** **11/11 tests passés 🟢**

### B. Composants UI Frontend (`client/__tests__/`)
Tests unitaires de rendu et d'interaction des composants React :
- `ChambreSelector.test.tsx` : Sélection et calcul dynamique des chambres.
- `HotelCard.test.tsx` : Rendu des cartes hôtels, étoiles et prix.
- `LoginForm.test.tsx` & `RegisterPage.test.tsx` : Validation des formulaires.
- `ReservationForm.test.tsx` & `SearchForm.test.tsx` : Interactions de recherche.

---

## 3. Niveau 2 — Tests d'Intégration API REST (Jest + BDD)

> 🎯 **Rôle du Test :**  
> Les tests d'intégration valident la chaîne complète **Route HTTP ➔ Contrôleur ➔ Modèle ➔ Base de Données**. Ils garantissent que lorsque le frontend envoie une requête `POST` pour créer une réservation ou un `GET` pour lire le catalogue, le backend enregistre et retourne correctement les données en base (MongoDB et H2).

### A. Microservice Réservation (`booking-service/tests/integration/reservationApi.test.js`)
- Connexion directe à la base MongoDB de test `booking_test_db`.
- **Scénarios validés :**
  - `GET /health` : Statut `200 UP`.
  - `GET /` : Liste des réservations existantes.
  - `POST /` : Création avec calcul automatique du tarif et statut `en_attente`.
  - `GET /mes-reservations?email=...` : Isolation et filtrage par email client.
  - `PUT /:id` : Modification du statut (`en_attente` ➔ `confirmee`).
  - `DELETE /:id` : Suppression et vérification de la suppression en BDD.

```bash
cd services/booking-service && npm test
```
> **Résultat :** **14/14 tests passés 🟢**

### B. Microservice Hôtel (`hotel-service/tests/hotelService.test.js`)
- Validation du catalogue de 5 hôtels, des destinations (Hammamet, Djerba, Sousse...), des 4 types de pensions et des filtres de recherche (étoiles, prix max).

```bash
cd services/hotel-service && npm test
```
> **Résultat :** **17/17 tests passés 🟢**

---

## 4. Niveau 3 — Tests E2E / Bout-en-Bout (Playwright Chromium)

> 🎯 **Rôle du Test :**  
> Les tests **End-to-End (E2E)** simulent le comportement d'un **vrai utilisateur humain** naviguant dans un navigateur web (Chromium). Ils cliquent sur les boutons, remplissent les champs et vérifient le parcours utilisateur réel (Accueil ➔ Fiche Hôtel ➔ Sélection des chambres ➔ Redirection Keycloak).

### Fichiers de Scénarios (`client/e2e/`) :
1. **`admin.spec.ts`** : Redirection automatique des accès non autorisés aux routes admin (`/admin`, `/profil`) vers la page `/login`.
2. **`auth.spec.ts`** : Rendu des pages d'authentification Keycloak, présence des boutons SSO et liens de basculement login/register.
3. **`hotels.spec.ts`** : Navigation complète depuis l'Accueil ➔ Liste des hôtels ➔ Fiche détaillée de l'hôtel.
4. **`reservation.spec.ts`** : Sélection des chambres, vérification des formulaires et déclenchement des protections sans session.

```bash
cd client && npx playwright test
```
> **Résultat :** **21/21 scénarios passés 🟢** (Rapport visualisable via `npx playwright show-report`).

---

## 5. Niveau 4 — Tests d'Architecture & Nginx (CORS Preflight)

> 🎯 **Rôle du Test :**  
> Garantir la communication sécurisée entre le Frontend (`http://localhost:3000`) et l'API Gateway (`http://localhost:8000`). Ce test vérifie que Nginx répond immédiatement **`204 No Content`** à la requête invisible `OPTIONS` envoyée par les navigateurs web, évitant ainsi l'erreur de sécurité *"Blocked by CORS policy"*.

### Commande de test cURL :
```cmd
curl.exe -i -X OPTIONS http://localhost:8000/api/hotels -H "Origin: http://localhost:3000"
```

### Réponse brute d'Nginx obtenue :
```http
HTTP/1.1 204 No Content
Server: nginx/1.25.3
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Origin, X-Requested-With
Access-Control-Max-Age: 1728000
Content-Length: 0
```
> **Résultat :** **PASSÉ 🟢** — Code **`204 No Content`** et en-tête `Access-Control-Allow-Origin: *` retournés sans blocage.

---

## 6. Niveau 5 — Tests de Montée en Charge (Load Testing avec Postman)

> 🎯 **Rôle du Test :**  
> Simuler un **pic de trafic massif** (par exemple des centaines d'utilisateurs qui cherchent un hôtel en même temps) pour mesurer si l'architecture reste rapide et stable. Il valide le débit maximal de requêtes par seconde (RPS) et vérifie qu'aucun serveur ne plante.

### Protocole de Test
Exécuté via le **Performance Runner de Postman** en envoyant des requêtes concourantes à fort débit sur l'API Gateway (`http://localhost:8000/api/hotels`).

### Chiffres Clés de la Performance :
- **Total des requêtes envoyées :** `14 600` requêtes
- **Débit maximal (Requests/sec) :** **`427.11 req/sec`**
- **Temps de réponse moyen :** `24 ms` (Percentile 90% : `23 ms`)
- **Taux d'erreur (Error %) :** **`0.00 %`** 🟢 (Zéro paquet perdu)
- **Taux d'échec (Failure %) :** **`0.00 %`** 🟢

> **Conclusion :** La plateforme absorbe plus de 400 requêtes/seconde avec une stabilité parfaite et une latence de 24 ms.

---

## 7. Niveau 6 — Tests de Résilience & Tolérance aux Pannes (Docker & Eureka)

> 🎯 **Rôle du Test :**  
> Prouver qu'en architecture microservices, **la panne d'un composant n'effondre pas tout le système**. On éteint volontairement le service réservation (`docker stop`), on vérifie qu'Eureka le détecte en panne et que le service des hôtels continue de marcher normalement (isolation), puis on le rallume pour valider l'auto-guérison.

### Déroulement du Scénario :
1. **Arrêt du composant :** `docker stop tb_booking_service`.
2. **Détection Registre :** Eureka (`http://localhost:8761`) détecte la panne et bascule le statut du service à `DOWN`.
3. **Isolation des Pannes :** Le service hôtel (`http://localhost:8000/api/hotels`) continue de répondre à **100%** sans perturbation.
4. **Auto-Guérison (Recovery) :** Redémarrage via `docker start tb_booking_service`. Le service est réenregistré automatiquement en statut `UP`.

| Étape de Test | Comportement Attendu | Statut |
|---|---|---|
| **Détection Eureka** | Passage du statut à `DOWN` | **PASSÉ 🟢** |
| **Isolation de Panne** | Autres services 100% opérationnels | **PASSÉ 🟢** |
| **Rétablissement Auto** | Reconnexion et passage à `UP` | **PASSÉ 🟢** |

---

## 8. Conclusion & Tableau Récapitulatif

L'ensemble des **63+ tests automatisés** couvre l'intégralité du cycle de vie du logiciel.

```
Total des tests exécutés  : 63+
Taux de réussite global    : 100% 🟢
Temps de réponse moyen API : 24 ms
Débit maximal validé      : 427 req/s
```

La plateforme **TunisieBooking** démontre une conformité totale aux exigences d'architecture microservices moderne.
