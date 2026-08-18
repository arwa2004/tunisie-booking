# 🧪 Guide de commandes pour lancer les tests Frontend (Next.js / Jest)

Ce guide récapitule toutes les commandes utiles pour lancer et filtrer vos tests unitaires de composants React.
> **Note :** Toutes ces commandes doivent être exécutées depuis le dossier **`client/`** de votre projet.

---

## 🚀 1. Lancer les tests avec npm (Recommandé)

Ces scripts sont configurés directement dans le fichier `package.json` de votre frontend.

*   **Lancer tous les tests avec les détails (verbose) :**
    ```bash
    npm test
    ```
    *Cette commande affiche la liste de chaque test individuel avec une coche verte `√`.*

*   **Lancer les tests en mode "Watch" (Observation) :**
    ```bash
    npm run test:watch
    ```
    *Le terminal reste ouvert et relance automatiquement les tests dès que vous modifiez un fichier.*

---

## 🐘 2. Lancer les tests avec Jest directement (Ciblage précis)

Si vous voulez cibler uniquement certains tests ou fichiers sans tout exécuter :

*   **Lancer uniquement un fichier de test spécifique :**
    ```bash
    npx jest __tests__/LoginForm.test.tsx --verbose
    ```
    ```bash
    npx jest __tests__/RegisterPage.test.tsx --verbose
    ```
    ```bash
    npx jest __tests__/ReservationForm.test.tsx --verbose
    ```
    ```bash
    npx jest __tests__/HotelCard.test.tsx --verbose
    ```

*   **Lancer les tests contenant un mot-clé précis (filtre) :**
    ```bash
    npx jest -t "mot de passe" --verbose
    ```
    *Cette commande va lancer uniquement les tests dont la description contient "mot de passe" (ex: dans `LoginForm.test.tsx`).*

*   **Lancer les tests et s'arrêter au premier échec :**
    ```bash
    npx jest --bail
    ```
