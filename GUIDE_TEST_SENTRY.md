# 🚨 Guide de Test Sentry — TunisieBooking

Ce guide explique comment **tester** et **valider** manuellement l'envoi d'erreurs à **Sentry** depuis les deux parties de l'application : **client (Next.js)** et **serveur (Laravel)**.

---

## 📋 Prérequis

Avant de commencer :

1. **Serveur Laravel démarré** :
   ```bash
   cd server
   php artisan serve
   ```

2. **Client Next.js démarré** :
   ```bash
   cd client
   npm run dev
   ```

3. **Accès au dashboard Sentry** :
   - Projet : [TunisieBooking - Sentry](https://o4511668502265856.ingest.de.sentry.io/)
   - Organisation : `tunisie-booking`

---

## 📁 1. Vérification de la Configuration

### Côté Client (Next.js) ✅

| Fichier | État | Notes |
|---|---|---|
| `client/sentry.client.config.ts` | ✅ Actif | `debug: true` → logs visibles dans la console navigateur |
| `client/sentry.edge.config.ts` | ⚠️ Prod uniquement | Activé uniquement si `NODE_ENV=production` |
| `client/sentry.server.config.ts` | ⚠️ Prod uniquement | Activé uniquement si `NODE_ENV=production` |
| `client/next.config.ts` | ⚠️ Prod uniquement | `withSentryConfig` uniquement en production |
| `client/src/instrumentation.ts` | ✅ Prêt | Importe les configs server/edge selon le runtime |

> **Important** : Le client (browser) est configuré pour fonctionner **même en dev** (pas de condition `NODE_ENV` dans `sentry.client.config.ts`).

### Côté Serveur (Laravel) ✅

| Fichier | État | Notes |
|---|---|---|
| `server/config/sentry.php` | ✅ Configuré | Utilise `env('SENTRY_LARAVEL_DSN')` |
| `server/.env` | ✅ Activé | `SENTRY_LARAVEL_DSN` et `SENTRY_TRACES_SAMPLE_RATE` décommentés |
| `server/bootstrap/app.php` | ✅ Captures d'exceptions | `\Sentry\captureException($e)` dans le handler d'exceptions |
| `server/composer.json` | ✅ Dépendance | `sentry/sentry-laravel` ^4.26 installé |

---

## 🌐 2. Test côté Client (Frontend Next.js)

### Méthode 1 : Page de test Sentry dédiée

Une page de test existe déjà à l'URL :

```
http://localhost:3000/sentry-example-page
```

Cette page exécute automatiquement :
```typescript
const err = new Error("Sentry frontend test: sentry-example-page");
Sentry.captureException(err);
```

**Procédure** :
1. Accéder à [http://localhost:3000/sentry-example-page](http://localhost:3000/sentry-example-page)
2. Ouvrir la **console navigateur** (F12 → Console)
3. Vérifier que Sentry affiche : `[Sentry] Debug: Transport • Sending event`
4. Aller sur le dashboard Sentry → Vérifier qu'un événement est apparu

### Méthode 2 : Déclencher une erreur volontairement

Depuis n'importe quelle page, ouvrir la console navigateur et exécuter :

```javascript
throw new Error("Test Sentry manuel depuis la console");
```

### Méthode 3 : Capturer une exception avec Sentry.captureException()

Toujours dans la console navigateur :

```javascript
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(new Error("Erreur de test depuis le client"));
```

---

## 🖥️ 3. Test côté Serveur (Laravel)

### Méthode 1 : Via une route de test dédiée

Ajouter temporairement cette route dans `server/routes/api.php` :

```php
Route::get('/sentry-test', function () {
    throw new \Exception("Test Sentry côté Laravel");
});
```

Puis appeler : [http://localhost:8000/api/sentry-test](http://localhost:8000/api/sentry-test)

> ⚠️ Supprimer cette route après le test.

### Méthode 2 : Via Tinker (sans route)

```bash
cd server
php artisan tinker
```

Puis dans Tinker :

```php
use function Sentry\captureException;
captureException(new \Exception("Test manuel Sentry Laravel depuis Tinker"));
```

### Méthode 3 : Via une erreur 404 naturelle

Appeler une route invalide :
```
http://localhost:8000/api/route-qui-nexiste-pas
```

---

## 🔄 4. Vérifier la Réception sur le Dashboard Sentry

1. Aller sur [https://sentry.io](https://sentry.io)
2. Se connecter avec le compte associé à `tunisie-booking`
3. Naviguer vers le projet concerné :
   - **Frontend** : Projet `javascript-nextjs`
   - **Backend** : Projet `laravel`
4. Vérifier les sections :
   - **Issues** → Toutes les erreurs capturées
   - **Performance** → Traces de performance (si `tracesSampleRate` > 0)
   - **Replays** → Session replays (uniquement client, si configuré)

---

## ⚙️ 5. Configuration Importante pour la Production

Avant de déployer, ajuster :

### Client (`sentry.client.config.ts`)
```typescript
// En production, réduire l'échantillonnage :
tracesSampleRate: 0.2,       // 20% des sessions tracées
replaysSessionSampleRate: 0.1, // 10% des sessions replay
debug: false,                 // Désactiver les logs de debug
```

### Serveur (`.env` → lignes déjà décommentées)
```env
SENTRY_LARAVEL_DSN=https://808e8adae65377df58c48ee4ac0f5ad2@...
SENTRY_TRACES_SAMPLE_RATE=0.2   # 20% des requêtes tracées
```

---

## 🧪 6. Résumé des Tests à Effectuer

| # | Test | Méthode | Résultat attendu |
|---|---|---|---|
| 1 | Client - page dédiée | `/sentry-example-page` | Événement visible dans Sentry |
| 2 | Client - console | `throw new Error(...)` | Événement visible dans Sentry |
| 3 | Serveur - route test | Ajouter `/api/sentry-test` | Événement visible dans Sentry |
| 4 | Serveur - Tinker | `captureException(...)` | Événement visible dans Sentry |
| 5 | Dashboard - Issues | Vérifier Sentry.io | Les 4 événements apparaissent |
| 6 | Dashboard - Performance | Vérifier traces | Traces visibles si activées |

---

## 📝 Notes Importantes

- **Client** : Le `sentry.client.config.ts` a `debug: true` → utile pour le débogage en dev mais **à désactiver en production**
- **Serveur** : Le comportement est géré via `bootstrap/app.php` → toute exception non gérée est automatiquement capturée
- **Edge/Server Next.js** : Les configurations edge et server ne s'activent **qu'en production** (`NODE_ENV === "production"`)
- **Turbopack** : En développement, `next.config.ts` n'utilise PAS `withSentryConfig` (incompatible). Les erreurs sont quand même envoyées via le SDK directement

---

## 🔍 Problèmes Courants

| Problème | Solution |
|---|---|
| Rien n'apparaît sur Sentry | Vérifier `debug: true` dans `sentry.client.config.ts` → logs dans la console |
| Erreur réseau sur `ingest.de.sentry.io` | Vérifier la connexion internet et que le DSN est correct |
| Sentry bloque le build Next.js | Vérifier que `withSentryConfig` n'est appelé qu'en production |
| Laravel ne capture pas les exceptions | Vérifier que `SENTRY_LARAVEL_DSN` est bien décommenté dans `.env` |

