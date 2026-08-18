# TODO - Plan de modification

## Objectif
Mettre en place les tests E2E avec Playwright pour couvrir tous les parcours utilisateur critiques de TunisieBooking.

## Étapes
- [x] Installer `@playwright/test` (npm install -D)
- [x] Créer `playwright.config.ts` (configuration Chromium, port 3000, webServer Next.js)
- [x] Créer `e2e/auth.spec.ts` (inscription, connexion, déconnexion, erreurs)
- [x] Créer `e2e/hotels.spec.ts` (accueil, liste hôtels, détail, recherche)
- [x] Créer `e2e/reservation.spec.ts` (détail hôtel, chambres, redirection login)
- [x] Créer `e2e/admin.spec.ts` (routes protégées, profil)
- [ ] Installer Chromium (en cours de téléchargement...)
- [ ] Exécuter `npx playwright test` pour valider les tests
- [ ] Ajouter les tests supplémentaires si nécessaire

---

## ✅ Sentry - Configuration et Test

- [x] Activer Sentry côté serveur Laravel : `SENTRY_LARAVEL_DSN` et `SENTRY_TRACES_SAMPLE_RATE` décommentés dans `server/.env`
- [x] Créer le guide de test complet : `GUIDE_TEST_SENTRY.md`
- [ ] Tester l'envoi manuel depuis le client : `/sentry-example-page`
- [ ] Tester l'envoi manuel depuis le serveur : route `/api/sentry-test` ou Tinker

