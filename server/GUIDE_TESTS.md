# 🧪 Guide de commandes pour lancer les tests (TunisieBooking)

Ce guide récapitule toutes les commandes utiles pour lancer et filtrer vos tests unitaires et d'intégration.
> **Note :** Toutes ces commandes doivent être exécutées depuis le dossier **`server/`** de votre projet.

---

## 🚀 1. L'approche Moderne (Recommandée) — `php artisan test`
Cette approche utilise l'enrobage Laravel pour afficher un rapport coloré et interactif.

### 📊 Lancer des groupes de tests
*   **Lancer l'intégralité des tests (Unit + Feature) :**
    ```bash
    php artisan test
    ```
*   **Lancer uniquement les tests unitaires (Models) :**
    ```bash
    php artisan test --testsuite=Unit
    ```
*   **Lancer uniquement les tests d'API (Feature) :**
    ```bash
    php artisan test --testsuite=Feature
    ```

### 🎯 Cibler précisément un fichier ou une fonction
*   **Tester un seul modèle (ex: Reservation) :**
    ```bash
    php artisan test tests/Unit/ReservationTest.php
    ```
*   **Tester une seule méthode (ex: calcul du prix) :**
    ```bash
    php artisan test --filter=test_calculatePrixTotal_correct
    ```

### 🛠️ Options pratiques
*   **S'arrêter immédiatement au premier échec :**
    ```bash
    php artisan test --stop-on-failure
    ```

---

## 🐘 2. L'approche Classique — `vendor/bin/phpunit`
Cette approche utilise directement le binaire de PHPUnit brut.

### 📊 Lancer des groupes de tests
*   **Lancer tous les tests avec affichage lisible :**
    ```bash
    vendor/bin/phpunit --testdox
    ```
*   **Lancer uniquement les tests unitaires :**
    ```bash
    vendor/bin/phpunit --testsuite Unit --testdox
    ```
*   **Lancer uniquement les tests d'API :**
    ```bash
    vendor/bin/phpunit --testsuite Feature --testdox
    ```

### 🎯 Cibler précisément un fichier ou une fonction
*   **Tester un seul modèle (ex: Voyage) :**
    ```bash
    vendor/bin/phpunit tests/Unit/VoyageTest.php --testdox
    ```
*   **Tester une seule méthode :**
    ```bash
    vendor/bin/phpunit --filter test_isPrixValide_retourne_true_pour_prix_positif --testdox
    ```

### 🛠️ Options pratiques
*   **S'arrêter au premier échec :**
    ```bash
    vendor/bin/phpunit --stop-on-failure --testdox
    ```
*   **Forcer la coloration dans le terminal :**
    ```bash
    vendor/bin/phpunit --colors=always --testdox
    ```
