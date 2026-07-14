#!/bin/bash
set -e

# Render injecte le port a ecouter via la variable $PORT (souvent 10000).
# Apache ecoute sur 80 par defaut : on remplace dynamiquement.
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -ri "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf

# Lance les migrations au demarrage (force requis car APP_ENV=production)
echo "Exécution des migrations..."
php artisan migrate --force

# Cache la config Laravel pour la prod (sans erreur bloquante si deja fait)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Démarrage d'Apache sur le port ${PORT}..."
exec apache2-foreground
