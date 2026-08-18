# TODO — Activer les microservices hotel, user, booking

## Contexte
Corriger le CORS (gateway) et compléter le hotel-service (Node/Express) pour servir
les pages admin hôtels & destinations. Aucun ajout de voyages.

## Étapes

### 1. Hotel Service — endpoints admin manquants (Node/Express index.js)
- [x] `services/hotel-service/index.js` : ajouter `GET /:id/chambres`.
- [x] `index.js` : ajouter `POST /chambres/:id` (mise à jour chambre).
- [x] `index.js` : ajouter `POST /chambres/:id/pensions` (synchronisation pensions).
- [x] `index.js` : ajouter CRUD destinations `POST`, `PUT`, `DELETE /destinations`.

### 2. Gateway nginx — routes manquantes
- [x] `gateway/nginx.conf` : ajouter `/api/chambres` vers hotel-service.
- [x] `gateway/nginx.conf` : ajouter `/api/pensions` vers hotel-service.

### 3. Relance / rebuild des conteneurs
- [x] `docker compose up -d --build hotel-service api-gateway`
- [x] Reload nginx (`nginx -s reload`) pour activer la nouvelle config CORS + routes.

### 4. Vérification
- [x] `curl` des endpoints : `/api/hotels`, `/api/hotels/:id/chambres`, `/api/pensions`, `/api/chambres/:id`, `/api/chambres/:id/pensions`, CRUD `/api/destinations` → 200/201/204 avec en-têtes CORS.
- [x] `npx tsc --noEmit` dans le client (aucune erreur).
