# 📚 Explication complète des Tests Unitaires — TunisieBooking

---

## 1. C'est quoi un test unitaire ? (La philosophie)

Imaginez que vous construisez une voiture.  
Un **test unitaire** c'est tester **chaque pièce séparément** :  
- Est-ce que le moteur démarre seul ? ✅  
- Est-ce que le frein résiste à une pression ? ✅  
- Est-ce que le volant tourne ? ✅  

On ne teste **pas** la voiture entière sur la route — ça c'est un test d'intégration.

Dans notre projet Laravel :
- **Les modèles** = les pièces de la voiture (Reservation, Hotel, Destination, Voyage)
- **Les méthodes dans les modèles** = les fonctions de chaque pièce
- **Les tests unitaires** = les tests qui vérifient chaque fonction, seule, sans base de données

---

## 2. L'architecture choisie

```
server/
├── app/Models/
│   ├── Reservation.php    ← contient la LOGIQUE MÉTIER (les méthodes)
│   ├── Hotel.php          ← contient la LOGIQUE MÉTIER
│   ├── Destination.php    ← contient la LOGIQUE MÉTIER
│   └── Voyage.php         ← contient la LOGIQUE MÉTIER
│
└── tests/Unit/
    ├── ReservationTest.php  ← APPELLE les méthodes de Reservation
    ├── HotelTest.php        ← APPELLE les méthodes de Hotel
    ├── DestinationTest.php  ← APPELLE les méthodes de Destination
    └── VoyageTest.php       ← APPELLE les méthodes de Voyage
```

> **Règle d'or :** Le modèle contient la logique. Le test vérifie que la logique fonctionne.

---

## 3. Le modèle Reservation.php — ligne par ligne

**`namespace App\Models;`**
> On déclare dans quel dossier logique se trouve ce fichier.
> Laravel cherche les modèles dans `app/Models/`.

**`use Illuminate\Database\Eloquent\Model;`**
> On importe la classe `Model` de Laravel (Eloquent).
> Tous les modèles Laravel héritent de cette classe pour avoir accès à la base de données
> (mais on n'est pas obligés de l'utiliser dans les tests).

**`class Reservation extends Model`**
> Notre classe hérite de `Model` → elle a toutes les capacités de Laravel.

**`protected $fillable = [...]`**
> Liste des champs autorisés à être remplis automatiquement.
> C'est une mesure de sécurité contre les attaques "mass assignment".

---

### Les méthodes métier ajoutées

**`public static function getStatutsValides(): array`**
> - `static` : appelable sans créer d'instance → `Reservation::getStatutsValides()`
> - `array` : retourne un tableau
> - Centralise les 3 statuts en un seul endroit. Si on en ajoute un, on modifie ici seulement.

**`public function getNbNuits(): int`**
> - `int` : retourne un nombre entier
> - Utilise `\DateTime` (classe PHP native) pour calculer la différence entre 2 dates
> - `$diff->invert` : vaut 1 si la date de fin est avant la date de début (protection)
> - `condition ? a : b` : opérateur ternaire (si condition vraie → a, sinon → b)

**`public function calculatePrixTotal(float $prixParNuit): float`**
> - Reçoit le prix par nuit en paramètre
> - `?? 1` : si `nb_chambres` est null, on utilise 1 par défaut (opérateur null coalescing)
> - Formule : `prix_nuit × nb_nuits × nb_chambres`
> - Réutilise `getNbNuits()` → pas de duplication de code

**`public function isStatutValide(string $statut): bool`**
> - `bool` : retourne `true` ou `false`
> - `in_array(..., true)` : vérifie si la valeur existe dans le tableau, avec comparaison stricte
> - `self::` : appelle une méthode statique de la même classe

**`public function canTransitionTo(string $nouveauStatut): bool`**
> - Vérifie deux règles métier dans l'ordre :
>   1. Le nouveau statut doit être valide
>   2. Une réservation annulée ne peut plus changer (état terminal)
> - Si les deux règles passent → la transition est autorisée

---

## 4. Les tests ReservationTest.php — ligne par ligne

**`use PHPUnit\Framework\TestCase;`**
> TRÈS IMPORTANT : c'est le TestCase de PHPUnit **pur**, pas celui de Laravel.
> Laravel ne démarre pas → pas de base de données → test unitaire pur.

**`private function makeReservation(array $attributs): Reservation`**
> - `private` : méthode interne, uniquement pour les tests de cette classe
> - `new Reservation()` : crée un objet en **mémoire** (pas en base de données !)
> - `setRawAttributes($attributs)` : remplit les attributs directement dans le tableau interne PHP.
>   Aucune requête SQL n'est exécutée. C'est la technique clé du test unitaire pur.
> - `return $reservation` : retourne l'objet prêt à être testé

**`public function test_getNbNuits_retourne_nombre_correct(): void`**
> - PHPUnit détecte automatiquement toute méthode commençant par `test_`
> - `void` : la méthode ne retourne rien
> - Le nom décrit exactement ce qu'on teste → documentation vivante

**`$this->assertEquals(4, $reservation->getNbNuits())`**
> - `assertEquals(attendu, reçu)` : vérifie que les deux valeurs sont égales
> - Si `getNbNuits()` retourne 4 → test vert ✅
> - Si `getNbNuits()` retourne autre chose → test rouge ❌ avec message d'erreur

---

## 5. Tableau des assertions utilisées

| Assertion | Signification | Exemple |
|---|---|---|
| `assertEquals(4, $v)` | Égal à 4 | Vérifier nb_nuits |
| `assertTrue($v)` | Doit être true | Vérifier isDisponible() |
| `assertFalse($v)` | Doit être false | Vérifier isStatutValide('payee') |
| `assertContains('x', $tab)` | Tableau contient 'x' | Vérifier getStatutsValides() |
| `assertCount(3, $tab)` | Tableau a 3 éléments | Vérifier nombre de statuts |

---

## 6. Commandes pour lancer les tests

```bash
# Tous les tests
vendor/bin/phpunit

# Uniquement les Unit tests
vendor/bin/phpunit --testsuite Unit

# Un test précis avec affichage lisible
vendor/bin/phpunit --filter ReservationTest --testdox

# Résultat :
# ReservationTest
#  ✔ getNbNuits retourne nombre correct
#  ✔ calculatePrixTotal correct
#  ✔ canTransitionTo annulee est etat terminal
# OK (14 tests, 14 assertions)
```

---

## 7. Résumé — Pourquoi c'est des tests unitaires purs ?

| Critère | Nos tests |
|---|---|
| Base de données utilisée ? | ❌ Non — `setRawAttributes()` en mémoire |
| Serveur HTTP utilisé ? | ❌ Non — pas de `$this->get('/api/...')` |
| Classe de base PHPUnit pure ? | ✅ Oui — `PHPUnit\Framework\TestCase` |
| Laravel démarré ? | ❌ Non — pas de `Tests\TestCase` de Laravel |
| Chaque test teste UNE fonction ? | ✅ Oui — une méthode du modèle par test |
| Rapide ? | ✅ 70 tests en 1 seconde |
