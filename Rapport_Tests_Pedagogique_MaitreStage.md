# 📋 Rapport sur les Tests Logiciels
### Plateforme TunisieBooking — Stage de Développement Web Full-Stack

---

**Présenté par :** Arwa Ben Amar  
**Destination :** Maître de stage  
**Période :** Stage Juillet 2026  
**Niveau :** Document pédagogique — Notions de base jusqu'aux tests avancés

---

## 📑 Table des Matières

1. [Pourquoi tester un logiciel ?](#1-pourquoi-tester-un-logiciel-)
2. [Qu'est-ce qu'un test logiciel ?](#2-quest-ce-quun-test-logiciel-)
3. [La Pyramide des Tests](#3-la-pyramide-des-tests)
4. [Les Tests Unitaires](#4-les-tests-unitaires)
5. [Les Tests d'Intégration](#5-les-tests-dintégration)
6. [Les Tests End-to-End (E2E)](#6-les-tests-end-to-end-e2e)
7. [Les Tests de Stress et de Charge](#7-les-tests-de-stress-et-de-charge)
8. [Les Outils utilisés dans ce projet](#8-les-outils-utilisés-dans-ce-projet)
9. [Métriques de qualité des tests](#9-métriques-de-qualité-des-tests)
10. [Bonne pratiques de tests](#10-bonnes-pratiques-de-tests)
11. [Glossaire des termes essentiels](#11-glossaire-des-termes-essentiels)

---

## 1. Pourquoi tester un logiciel ?

### 1.1 Le coût d'un bug non détecté

Imaginez qu'on livre une voiture sans avoir testé les freins. Dans le développement logiciel, un bug non détecté peut avoir des conséquences similaires : perte de données, mauvaise facturation, failles de sécurité, ou panne totale de l'application.

Des études publiées par le **National Institute of Standards and Technology (NIST)** montrent que :

> 💡 **Corriger un bug coûte 100 fois plus cher en production qu'en phase de développement.**

| Phase de détection du bug | Coût relatif de correction |
|--------------------------|---------------------------|
| Pendant l'écriture du code | ×1 (le moins cher) |
| Pendant les tests développeur | ×5 |
| Pendant les tests qualité (QA) | ×10 |
| Après la livraison (en production) | ×100 (le plus cher) |

### 1.2 Ce que les tests garantissent

Les tests logiciels servent à s'assurer que le logiciel :

- ✅ **Fait ce qu'il est censé faire** (fonctionnalités correctes)
- ✅ **Ne fait pas ce qu'il ne devrait pas faire** (protections contre les erreurs)
- ✅ **Continue de fonctionner après chaque modification** (non-régression)
- ✅ **Tient la charge en production** (performance)
- ✅ **Est sécurisé** (protection contre les attaques)

### 1.3 Le problème sans tests

Sans tests automatisés, chaque modification du code peut :
- Casser une fonctionnalité existante sans que personne ne s'en aperçoive
- Obliger les développeurs à tout re-vérifier manuellement (long et coûteux)
- Laisser passer des bugs jusqu'aux utilisateurs finaux

Avec les tests automatisés, cette vérification se fait **en quelques secondes, automatiquement, à chaque modification**.

---

## 2. Qu'est-ce qu'un test logiciel ?

### 2.1 Définition simple

Un **test logiciel** est un programme qui vérifie qu'un autre programme se comporte correctement. C'est comme un "contrôleur automatique" qui pose des questions au code et vérifie les réponses.

**Exemple en langage naturel :**

> "Si j'envoie l'email `user@test.com` et le mot de passe `Pass123`, est-ce que l'application me renvoie bien un token de connexion ?"

Le test automatisé effectue exactement cette vérification, sans intervention humaine.

### 2.2 Anatomie d'un test (structure AAA)

Tout bon test suit la structure **AAA (Arrange, Act, Assert)** :

```
┌─────────────────────────────────────────────────────┐
│  ARRANGE  → Préparer les données et le contexte     │
│             Ex : Créer un utilisateur en base        │
├─────────────────────────────────────────────────────┤
│  ACT      → Effectuer l'action à tester             │
│             Ex : Appeler la route POST /api/login    │
├─────────────────────────────────────────────────────┤
│  ASSERT   → Vérifier que le résultat est correct    │
│             Ex : La réponse contient bien un token  │
└─────────────────────────────────────────────────────┘
```

### 2.3 Types d'assertions (vérifications)

Une **assertion** est une vérification que le test effectue. Si l'assertion est vraie → le test **passe** (✅). Si elle est fausse → le test **échoue** (❌) et signale un problème.

| Type d'assertion | Ce qu'elle vérifie | Exemple |
|-------------------|-------------------|---------|
| Égalité | Deux valeurs sont identiques | `4 nuits × 200 DT = 800 DT` |
| Vrai / Faux | Une condition est vraie ou fausse | L'hôtel est disponible |
| Structure | La réponse contient les bons champs | La réponse contient `token` et `user` |
| Existence | Un enregistrement existe en base | La réservation a bien été créée |
| Absence | Un enregistrement n'existe plus | La réservation supprimée n'est plus en base |
| Statut HTTP | Le code HTTP retourné est correct | La réponse est `200 OK` ou `422 Erreur` |

### 2.4 Comment lire un résultat de test

```
Tests:  64 passed  ✅     → 64 tests ont réussi
Tests:   2 failed  ❌     → 2 tests ont échoué (bug détecté !)
Time:    3.42s            → Durée totale d'exécution
```

Quand un test échoue, il indique précisément :
- **Quel test** a échoué
- **Ce qui était attendu** vs **ce qui a été obtenu**
- **Le fichier et la ligne** du code en cause

---

## 3. La Pyramide des Tests

### 3.1 Principe général

La **Pyramide des Tests** est un modèle fondamental en ingénierie logicielle qui représente la répartition idéale des tests. Elle a été popularisée par Mike Cohn dans son livre "Succeeding with Agile" (2009).

```
                    ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲
                   ╱    TESTS E2E        ╲
                  ╱  (peu nombreux,       ╲
                 ╱   lents, coûteux)       ╲
                ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲
               ╱    TESTS D'INTÉGRATION     ╲
              ╱    (quantité moyenne,        ╲
             ╱      rapidité moyenne)         ╲
            ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲
           ╱         TESTS UNITAIRES           ╲
          ╱   (très nombreux, très rapides,     ╲
         ╱         peu coûteux)                  ╲
        ╱____________________________________________╲
```

### 3.2 Pourquoi cette forme de pyramide ?

| Niveau | Quantité | Vitesse | Coût | Isolation |
|--------|----------|---------|------|-----------|
| Tests Unitaires | 🔴🔴🔴🔴🔴 (beaucoup) | ⚡ Très rapide (< 1ms) | 💰 Très faible | 🔬 Totale |
| Tests d'Intégration | 🔴🔴🔴 (moyen) | 🏃 Rapide (10-100ms) | 💰💰 Moyen | 🔗 Partielle |
| Tests E2E | 🔴 (peu) | 🐢 Lent (2-30 secondes) | 💰💰💰 Élevé | 🌐 Aucune |

**Règle d'or :** Plus on monte dans la pyramide, plus les tests sont lents, fragiles et coûteux à maintenir. Il faut donc en avoir moins.

### 3.3 Le risque d'inverser la pyramide

Certaines équipes font l'erreur de tester principalement via des tests E2E (pyramide inversée). Le résultat :
- Suite de tests qui met **des heures** à s'exécuter
- Tests qui tombent en panne pour des raisons sans rapport avec le code
- Détection tardive des bugs
- Développeurs qui n'osent plus lancer les tests

---

## 4. Les Tests Unitaires

### 4.1 Définition

Un **test unitaire** vérifie une **seule unité de code** de manière totalement **isolée** — une fonction, une méthode ou une classe — sans dépendre d'une base de données, d'un réseau, ou d'un autre composant.

Le mot "unitaire" signifie qu'on teste **une seule chose à la fois**.

### 4.2 Caractéristiques essentielles

| Caractéristique | Description |
|----------------|-------------|
| **Isolation** | Pas de base de données, pas de réseau, pas de fichiers |
| **Rapidité** | S'exécutent en quelques millisecondes |
| **Déterminisme** | Donnent toujours le même résultat |
| **Simplicité** | Faciles à écrire et à comprendre |
| **Précision** | Pointent exactement vers le bug |

### 4.3 Ce qu'on teste avec les tests unitaires

Les tests unitaires sont parfaits pour vérifier la **logique métier** : les règles de calcul, les validations, les transformations de données.

**Exemples de logique métier qu'on peut tester unitairement :**

```
✅ Calcul du nombre de nuits entre deux dates
✅ Calcul du prix total avec suppléments enfants
✅ Validation qu'un prix est positif
✅ Vérification qu'un nombre d'étoiles est entre 1 et 5
✅ Vérification qu'une transition de statut est autorisée
✅ Formatage d'un libellé ("1 jour" vs "7 jours")
```

### 4.4 Ce qu'on ne teste PAS avec les tests unitaires

```
❌ Les appels à la base de données
❌ Les appels HTTP à d'autres services
❌ L'interface graphique
❌ L'envoi d'emails
```

Ces éléments sont testés par d'autres types de tests (intégration, E2E).

### 4.5 Analogie simple

> Imaginez une **calculatrice**. Un test unitaire vérifie que la touche `+` additionne correctement deux chiffres, de manière **isolée**, sans se préoccuper de l'écran, de la batterie ou du boîtier. On teste uniquement la fonction d'addition.

### 4.6 Avantages des tests unitaires

- **Feedback immédiat :** Le développeur sait en 1 seconde si son calcul est correct
- **Documentation vivante :** Un test unitaire documente comment la fonction doit se comporter
- **Refactoring sécurisé :** On peut réécrire le code en sachant que les tests signaleront tout écart
- **Débogage facilité :** Quand un test échoue, on sait exactement quelle fonction est défaillante

---

## 5. Les Tests d'Intégration

### 5.1 Définition

Un **test d'intégration** (appelé aussi **test Feature** dans Laravel) vérifie que **plusieurs composants fonctionnent correctement ensemble** : la route HTTP + le contrôleur + le modèle + la base de données.

Contrairement aux tests unitaires, les tests d'intégration **utilisent une vraie base de données** (généralement une base légère SQLite en mémoire pour les tests, isolée de la base de production).

### 5.2 À quoi ressemble un test d'intégration ?

En langage naturel, un test d'intégration dit :

> "Quand j'envoie une requête `POST /api/reservations` avec les bonnes données et un token valide, alors l'API doit créer la réservation en base de données et me répondre `201 Created` avec le prix calculé automatiquement."

Le test vérifie ainsi toute la chaîne : la route → le middleware → le contrôleur → la validation → la logique métier → la base de données → la réponse.

### 5.3 La notion de base de données de test

Pour ne **jamais affecter les vraies données**, les tests d'intégration utilisent une base de données dédiée, recréée proprement avant chaque test. Le mécanisme s'appelle `RefreshDatabase`.

```
Avant chaque test  → Base de données vide et fraîche
Pendant le test    → Données créées uniquement pour ce test
Après le test      → Toutes les données supprimées automatiquement
```

Ainsi, les tests sont **totalement indépendants** les uns des autres.

### 5.4 Ce que les tests d'intégration vérifient

| Scénario testé | Résultat attendu |
|----------------|-----------------|
| Inscription d'un utilisateur | Statut 201, réception d'un token |
| Connexion avec mauvais mot de passe | Statut 401 Unauthorized |
| Création d'une réservation valide | Statut 201, prix calculé automatiquement |
| Accès admin par un utilisateur normal | Statut 403 Forbidden |
| Requête sans authentification | Statut 401 Unauthorized |
| Données invalides envoyées | Statut 422 Unprocessable Entity |
| Ressource inexistante demandée | Statut 404 Not Found |

### 5.5 Les codes de statut HTTP

Les tests d'intégration vérifient très souvent les **codes de statut HTTP**. Ces codes sont standardisés et universellement reconnus :

| Code | Signification | Quand l'utiliser |
|------|--------------|-----------------|
| `200 OK` | Succès | Requête GET ou PUT réussie |
| `201 Created` | Créé avec succès | Création d'une ressource (POST) |
| `401 Unauthorized` | Non authentifié | Token manquant ou invalide |
| `403 Forbidden` | Accès refusé | Authentifié mais pas le bon rôle |
| `404 Not Found` | Non trouvé | Ressource inexistante |
| `422 Unprocessable Entity` | Données invalides | Validation échouée |
| `500 Internal Server Error` | Erreur serveur | Bug côté serveur |

### 5.6 Analogie simple

> Imaginez un **restaurant** (application web). Un test unitaire vérifie que le cuisinier maîtrise la recette. Un test d'intégration vérifie que toute la chaîne fonctionne : le client passe une commande au serveur → le serveur la transmet en cuisine → le cuisinier prépare → le plat arrive à la table avec les bons ingrédients.

---

## 6. Les Tests End-to-End (E2E)

### 6.1 Définition

Les **tests End-to-End (de bout en bout)** simulent un vrai utilisateur humain qui interagit avec l'application via un navigateur web. Le test contrôle un navigateur réel (comme Chrome), clique sur des boutons, remplit des formulaires, et vérifie ce qui s'affiche à l'écran.

**"End-to-End"** signifie "du début à la fin" : on teste le parcours complet, depuis l'interface utilisateur jusqu'à la base de données.

### 6.2 Comment ça fonctionne ?

Un outil comme **Playwright** (utilisé dans ce projet) prend le contrôle d'un navigateur de manière programmée :

```
Script de test                    Navigateur (Chrome/Firefox)
─────────────                    ──────────────────────────
1. Ouvrir la page /login     →   Charge la page de connexion
2. Remplir l'email           →   Écrit dans le champ email
3. Remplir le mot de passe   →   Écrit dans le champ mot de passe
4. Cliquer sur "Se connecter"→   Clique sur le bouton
5. Vérifier la redirection   →   Vérifie que l'URL est /accueil
6. Vérifier que le nom       →   Vérifie que "Arwa" apparaît
   s'affiche dans la barre
```

Le tout se passe automatiquement, sans intervention humaine, en quelques secondes.

### 6.3 Scénarios typiques de tests E2E

Les tests E2E reproduisent des **parcours utilisateurs complets** :

**Parcours 1 : Inscription**
```
Ouvrir /register
→ Remplir nom, email, mot de passe
→ Cliquer "S'inscrire"
→ Vérifier redirection vers la page d'accueil
→ Vérifier que le nom apparaît dans la barre de navigation
```

**Parcours 2 : Réservation d'un hôtel**
```
Se connecter
→ Naviguer vers la liste des hôtels
→ Cliquer sur un hôtel
→ Sélectionner une chambre
→ Choisir les dates d'arrivée et de départ
→ Cliquer "Réserver"
→ Vérifier le récapitulatif avec le prix calculé
→ Confirmer la réservation
→ Vérifier que la réservation apparaît dans "Mes réservations"
```

### 6.4 Avantages et limites des tests E2E

| Avantages | Limites |
|-----------|---------|
| Testent l'application comme un vrai utilisateur | Lents (2 à 30 secondes par test) |
| Détectent les problèmes d'interface | Fragiles (un changement d'interface casse le test) |
| Valident l'intégration complète | Difficiles à déboguer |
| Donnent confiance avant une mise en production | Coûteux à maintenir |
| Peuvent générer des captures d'écran/vidéos | Nécessitent un environnement complet |

### 6.5 Playwright — L'outil utilisé

**Playwright** est un outil open-source développé par Microsoft pour automatiser les navigateurs web. Il supporte Chrome, Firefox et Safari.

Ses fonctionnalités principales :
- **Multi-navigateur :** Teste sur Chrome, Firefox, Safari en même temps
- **Headless :** Peut fonctionner sans afficher le navigateur (en arrière-plan)
- **Screenshots & Vidéos :** Capture automatique en cas d'échec
- **Rapport HTML :** Génère un rapport visuel des tests
- **Attente intelligente :** Attend automatiquement que les éléments soient prêts

### 6.6 Le Live Test Recorder

En plus des tests automatiques, le projet dispose d'un **Live Test Recorder** : un script qui enregistre une session de navigation **manuelle** en temps réel. Le testeur navigue librement dans l'application, et le script capture automatiquement chaque action, chaque appel API, chaque réponse du serveur, puis génère un rapport Excel complet à la fin de la session.

C'est une approche hybride entre test manuel et test automatisé.

---

## 7. Les Tests de Stress et de Charge

### 7.1 Définition et différence

| Type | Question posée | Objectif |
|------|---------------|----------|
| **Test de charge** | "L'application tient-elle avec 100 utilisateurs simultanés ?" | Vérifier le comportement en conditions normales d'utilisation |
| **Test de stress** | "À partir de combien d'utilisateurs l'application s'effondre-t-elle ?" | Trouver la limite maximale (point de rupture) |
| **Test de performance** | "L'application répond-elle en moins de 500ms ?" | Mesurer les temps de réponse |

### 7.2 Pourquoi faire des tests de stress ?

Un site web peut fonctionner parfaitement avec 10 utilisateurs, mais tomber en panne avec 500 utilisateurs simultanés. C'est particulièrement critique pour :
- Un site de réservation lors d'une promotion ou d'un pic saisonnier
- Une application de ticketing lors d'une mise en vente de billets
- Tout service avec des variations d'audience importantes

Les tests de stress permettent d'**anticiper** ces situations et de **corriger** les failles avant qu'elles impactent les vrais utilisateurs.

### 7.3 La notion de VU (Virtual User)

Un **VU (Virtual User / Utilisateur Virtuel)** est une simulation informatique d'un utilisateur réel qui envoie des requêtes à l'application. En lançant 100 VUs simultanément, on simule 100 personnes qui utilisent l'application en même temps.

```
Vague 1 :   10 VUs → 10 personnes simultanées  (situation normale)
Vague 2 :   50 VUs → 50 personnes simultanées  (affluence)
Vague 3 :  150 VUs → 150 personnes simultanées (pic saisonnier)
Vague 4 :  300 VUs → 300 personnes simultanées (breakpoint ?)
```

### 7.4 Les métriques mesurées

#### RPS (Requests Per Second — Requêtes par seconde)
Nombre de requêtes que le serveur peut traiter chaque seconde.
- Un serveur basique Laravel : **10 à 50 RPS**
- Avec optimisation (cache Redis + Nginx) : **500 à 2 000 RPS**
- Avec Laravel Octane : **jusqu'à 10 000 RPS**

#### Taux de succès
Pourcentage de requêtes ayant reçu une réponse valide (code HTTP 2xx).
- **> 99%** : Excellent
- **95–99%** : Acceptable
- **< 90%** : Problème critique à corriger

#### Temps de réponse

| Métrique | Signification |
|----------|--------------|
| **Temps moyen** | Durée moyenne de toutes les requêtes |
| **Temps maximum** | Pire cas observé |
| **p95 (95e percentile)** | 95% des requêtes ont répondu sous cette durée |
| **p99 (99e percentile)** | 99% des requêtes ont répondu sous cette durée |

> Le **p95** est la métrique la plus utilisée en industrie car elle ignore les cas extrêmes tout en représentant l'expérience réelle de la grande majorité des utilisateurs.

### 7.5 Le Score Apdex (Application Performance Index)

L'**Apdex** est un standard industriel international (défini par l'Apdex Alliance) qui mesure la **satisfaction des utilisateurs** vis-à-vis des performances d'une application. Il produit un score entre 0 et 1.

**Définition des seuils (seuil T = 500ms dans ce projet) :**

| Temps de réponse | Catégorie | Points |
|-----------------|-----------|--------|
| < 500 ms | **Satisfaisant** (Satisfied) | 1.0 point |
| 500 ms – 2 000 ms | **Toléré** (Tolerating) | 0.5 point |
| > 2 000 ms | **Frustrant** (Frustrated) | 0 point |

**Formule :**
```
Apdex = (Satisfaisantes + Tolérées/2) / Total des requêtes
```

**Interprétation :**

| Score Apdex | Qualité | Signification |
|-------------|---------|--------------|
| 1.00 | Excellent | Tous les utilisateurs sont satisfaits |
| 0.85 – 0.99 | Bien | Satisfaction très haute |
| 0.70 – 0.84 | Acceptable | Acceptable mais des améliorations sont souhaitables |
| 0.50 – 0.69 | Médiocre | Des utilisateurs quittent le site |
| < 0.50 | Inacceptable | Grave problème de performance |

### 7.6 Le Breakpoint (Point de rupture)

Le **breakpoint** est le moment où le serveur ne peut plus tenir la charge : les requêtes commencent à échouer massivement, les temps de réponse explosent, et le service devient indisponible. L'identifier permet de savoir quel est le **plafond de capacité** du système actuel et de planifier des améliorations.

### 7.7 Les goulots d'étranglement (Bottlenecks)

Un **goulot d'étranglement** (bottleneck) est le point le plus lent de la chaîne qui limite les performances globales. C'est comme une autoroute à 3 voies qui se réduit soudainement à 1 voie : même si le reste de la route est libre, tout se bloque à cet endroit.

Dans une application web, les bottlenecks les plus courants sont :

| Bottleneck | Cause fréquente | Solution typique |
|-----------|----------------|-----------------|
| **Base de données** | Trop de requêtes SQL, index manquants | Cache Redis, optimisation des requêtes |
| **Authentification** | Algorithme de hachage coûteux (Bcrypt) | Ajuster le coût, utiliser Argon2id |
| **Serveur PHP** | Serveur mono-thread | Laravel Octane, serveur multi-thread |
| **Bande passante** | Réponses JSON volumineuses | Compression Gzip/Brotli |

---

## 8. Les Outils Utilisés dans ce Projet

### 8.1 PHPUnit — Tests Unitaires et d'Intégration (Backend)

**PHPUnit** est le framework de tests standard pour PHP et Laravel. Créé par Sebastian Bergmann, il est utilisé dans la quasi-totalité des projets PHP professionnels.

**Caractéristiques :**
- Intégré nativement dans Laravel
- Utilise une syntaxe claire et lisible
- Génère des rapports détaillés
- Peut mesurer la couverture du code (% de code testé)

**Comment lancer les tests :**
```bash
php artisan test              # Tous les tests
php artisan test --testsuite=Unit      # Tests unitaires seulement
php artisan test --testsuite=Feature   # Tests d'intégration seulement
php artisan test --filter=AuthTest     # Un fichier de test spécifique
```

**Exemple de sortie :**
```
   PASS  Tests\Unit\ReservationTest
  ✓ getNbNuits retourne nombre correct
  ✓ calculatePrixTotal correct sans enfants
  ✓ isStatutValide retourne true pour confirmee

   PASS  Tests\Feature\AuthTest
  ✓ register returns token
  ✓ login correct returns 200
  ✓ logout revokes token

  Tests:  64 passed
  Duration: 3.42s
```

### 8.2 Playwright — Tests E2E (Frontend)

**Playwright** est un framework de tests E2E open-source développé par **Microsoft**. Il est considéré comme l'un des outils les plus modernes et fiables pour tester des applications web.

**Pourquoi Playwright plutôt que d'autres outils ?**

| Critère | Playwright | Selenium | Cypress |
|---------|-----------|---------|---------|
| Multi-navigateur | ✅ Chrome, Firefox, Safari | ✅ | ⚠️ Chrome/Firefox |
| Vitesse | ⚡ Très rapide | 🐢 Lent | 🏃 Rapide |
| Fiabilité | 🌟 Excellent | ⚠️ Moyen | 🌟 Bon |
| Attente auto | ✅ Oui | ❌ Manuel | ✅ Oui |
| Développé par | Microsoft | Open Source | Cypress.io |

**Comment lancer les tests E2E :**
```bash
npx playwright test              # Tous les tests E2E
npx playwright test --headed     # Avec navigateur visible
npx playwright test --ui         # Interface graphique interactive
npx playwright show-report       # Voir le rapport HTML
```

### 8.3 Node.js (script custom) — Tests de Stress

Les tests de stress du projet sont réalisés avec un **script Node.js personnalisé** qui utilise le module HTTP natif de Node.js. Ce script simule des centaines d'utilisateurs simultanés, mesure les métriques de performance, et génère un rapport Excel professionnel via la librairie **ExcelJS**.

**Avantages de cette approche :**
- Aucune dépendance externe payante (contrairement à k6 Pro ou LoadRunner)
- Personnalisation totale des scénarios de test
- Rapport Excel riche et automatisé
- Calcul du score Apdex intégré

---

## 9. Métriques de Qualité des Tests

### 9.1 La couverture de code (Code Coverage)

La **couverture de code** mesure le pourcentage du code source qui est exécuté lors des tests. Elle s'exprime en pourcentage.

```
Couverture = (Lignes de code exécutées par les tests / Total lignes de code) × 100
```

| Niveau de couverture | Évaluation |
|---------------------|-----------|
| < 50% | Insuffisant — risques élevés |
| 50 – 70% | Acceptable |
| 70 – 85% | Bon — recommandé pour la plupart des projets |
| 85 – 95% | Très bon |
| > 95% | Excellent — mais attention au piège du 100% |

> ⚠️ **Attention :** Une couverture de 100% ne signifie pas qu'il n'y a pas de bugs. Elle signifie seulement que chaque ligne a été exécutée au moins une fois. La qualité des tests est plus importante que la quantité.

### 9.2 La régression

On parle de **régression** quand une fonctionnalité qui fonctionnait correctement cesse de fonctionner suite à une modification du code.

Les tests automatisés sont le meilleur rempart contre les régressions : à chaque nouveau code ajouté, on relance tous les tests (appelé **CI — Continuous Integration**). Si un test qui passait avant commence à échouer, on a détecté une régression immédiatement.

### 9.3 Indicateurs de qualité d'une suite de tests

| Indicateur | Signification |
|-----------|--------------|
| **Taux de réussite** | % de tests qui passent (objectif : 100%) |
| **Durée d'exécution** | Temps total pour lancer tous les tests (doit rester < 5 minutes) |
| **Stabilité** | Les tests donnent-ils toujours le même résultat ? (pas de "flaky tests") |
| **Isolation** | Chaque test est-il indépendant des autres ? |
| **Lisibilité** | Les tests sont-ils compréhensibles par tous ? |

### 9.4 Les "flaky tests" (tests instables)

Un **flaky test** est un test qui passe parfois et échoue parfois sans raison apparente. C'est l'ennemi des équipes de développement car il crée de la méfiance envers la suite de tests entière.

Causes fréquentes des flaky tests :
- Dépendance à l'heure système ou aux données aléatoires
- Conditions de concurrence (race conditions)
- Dépendances à des services externes instables
- Tests E2E trop fragiles (recherche d'éléments UI par des sélecteurs non robustes)

---

## 10. Bonnes Pratiques de Tests

### 10.1 Règle F.I.R.S.T.

Les bons tests unitaires respectent les principes **F.I.R.S.T.** :

| Lettre | Principe | Signification |
|--------|---------|--------------|
| **F** | Fast (Rapide) | Les tests doivent s'exécuter en millisecondes |
| **I** | Independent (Indépendant) | Chaque test fonctionne seul, sans dépendre des autres |
| **R** | Repeatable (Reproductible) | Même résultat à chaque exécution |
| **S** | Self-validating (Auto-validant) | Le test dit lui-même s'il passe ou échoue |
| **T** | Timely (Opportun) | Écrits au moment du développement, pas après |

### 10.2 TDD — Test-Driven Development

Le **TDD (Développement guidé par les tests)** est une méthode qui consiste à écrire les tests **avant** d'écrire le code. Le cycle se déroule en 3 étapes (Red → Green → Refactor) :

```
🔴 RED     → Écrire un test qui échoue (la fonctionnalité n'existe pas encore)
🟢 GREEN   → Écrire le code minimum pour faire passer le test
🔵 REFACTOR → Améliorer le code sans casser les tests
```

**Avantages du TDD :**
- Force à réfléchir au "quoi" avant au "comment"
- Garantit une couverture de code élevée
- Produit un code plus modulaire et testable

### 10.3 Stratégie de nommage des tests

Un bon test doit avoir un nom qui décrit clairement ce qu'il teste. Convention recommandée :

```
test_[méthode_testée]_[contexte]_[résultat_attendu]

Exemples :
test_login_avec_mauvais_mot_de_passe_retourne_401
test_calculatePrixTotal_avec_enfants_retourne_le_bon_montant
test_admin_peut_confirmer_une_reservation
```

Ainsi, quand un test échoue, son nom seul explique le problème.

### 10.4 Ce qu'il ne faut pas faire

| Mauvaise pratique | Problème |
|------------------|---------|
| Tester plusieurs choses dans un seul test | Difficile de savoir quelle partie a échoué |
| Des tests dépendants les uns des autres | Un test qui échoue en cascade d'autres |
| Utiliser les données de production pour tester | Risque de corruption des vraies données |
| Ignorer les tests qui échouent | Les bugs s'accumulent |
| Ne jamais lancer les tests | Les tests deviennent obsolètes et inutiles |

---

## 11. Glossaire des Termes Essentiels

| Terme | Définition |
|-------|-----------|
| **API** (Application Programming Interface) | Interface qui permet à deux applications de communiquer entre elles via des requêtes HTTP |
| **API REST** | Style d'architecture API utilisant les méthodes HTTP (GET, POST, PUT, DELETE) |
| **Assertion** | Vérification effectuée par un test pour confirmer qu'une valeur est correcte |
| **Apdex** | Score standardisé (0 à 1) mesurant la satisfaction des utilisateurs vis-à-vis des performances |
| **Backend** | Partie serveur d'une application (base de données, logique métier, API) |
| **Breakpoint** | Limite de charge au-delà de laquelle le serveur commence à dysfonctionner |
| **Bug** | Erreur dans le code qui produit un comportement inattendu ou incorrect |
| **CI/CD** | Continuous Integration / Continuous Deployment — automatisation des tests et déploiements |
| **Couverture de code** | Pourcentage du code source exécuté lors des tests |
| **E2E** (End-to-End) | Test simulant le parcours complet d'un utilisateur dans l'application |
| **Factory** | Classe qui génère des données fictives réalistes pour les tests |
| **Flaky test** | Test instable qui passe parfois et échoue parfois sans raison apparente |
| **Frontend** | Partie interface utilisateur d'une application (ce que l'utilisateur voit) |
| **Goulot d'étranglement** | Point le plus lent d'un système qui limite les performances globales |
| **Headless** | Mode navigateur sans interface graphique (plus rapide pour les tests automatisés) |
| **HTTP** | Protocole de communication entre un navigateur et un serveur web |
| **Mock** | Faux objet qui simule le comportement d'un vrai composant (ex : simuler un envoi d'email) |
| **p95 / p99** | 95e / 99e percentile — 95% des requêtes répondent sous ce délai |
| **PHPUnit** | Framework de tests automatisés standard pour PHP |
| **Playwright** | Framework de tests E2E (End-to-End) pour navigateurs, développé par Microsoft |
| **QA** (Quality Assurance) | Assurance Qualité — processus de vérification de la qualité d'un logiciel |
| **Régression** | Bug apparu suite à une modification du code, cassant une fonctionnalité existante |
| **RPS** (Requests Per Second) | Nombre de requêtes qu'un serveur peut traiter par seconde |
| **Scaffolding** | Génération automatique de code de base par un framework |
| **Seeder** | Script qui insère des données de démonstration dans la base de données |
| **Stub** | Version simplifiée d'un composant, utilisée en tests pour isoler le code testé |
| **Suite de tests** | Ensemble organisé de tests regroupés par catégorie |
| **TDD** (Test-Driven Development) | Méthode de développement où les tests sont écrits avant le code |
| **Token** | Identifiant chiffré permettant de s'authentifier sans renvoyer le mot de passe à chaque requête |
| **VU** (Virtual User) | Utilisateur simulé dans un test de charge envoyant des requêtes au serveur |

---

## Conclusion

La mise en place d'une stratégie de tests complète dans le projet TunisieBooking représente un investissement initial en temps, mais offre des bénéfices durables et mesurables :

| Bénéfice | Impact |
|----------|--------|
| **Détection rapide des bugs** | Les erreurs sont trouvées en secondes, pas en production |
| **Confiance dans le code** | Chaque modification est vérifiée automatiquement |
| **Documentation vivante** | Les tests décrivent le comportement attendu du système |
| **Maintenance facilitée** | Les développeurs osent améliorer le code car les tests protègent |
| **Connaissance des limites** | Les tests de stress révèlent les capacités réelles du serveur |
| **Qualité professionnelle** | Les tests sont aujourd'hui incontournables dans l'industrie logicielle |

La pyramide des tests appliquée dans ce projet — des **tests unitaires nombreux et rapides** à la base, des **tests d'intégration** au milieu, et des **tests E2E** au sommet — constitue une approche équilibrée, reconnue et recommandée par les ingénieurs logiciels à travers le monde.

---

*Document rédigé par Arwa Ben Amar — Stage 2025/2026*  
*Projet TunisieBooking — Plateforme de Réservation Hôtelière*
