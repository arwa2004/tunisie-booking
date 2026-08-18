# ══════════════════════════════════════════════════════════════════════════
#  Dockerfile — User Service (TunisieBooking)
#  Laravel 11 + PHP 8.3 + Composer 2 + MySQL
#  Le conteneur écoute sur le port 8000 (attendu par l'API Gateway Nginx)
# ══════════════════════════════════════════════════════════════════════════

FROM php:8.3-cli

# ── Outils système + extensions PHP nécessaires à Laravel / MySQL ────────
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Composer 2 ────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# ── Dépendances PHP (cache Docker : composer.json copié avant le code) ────
# Note : pas de composer.lock versionné — composer résout les versions.
COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# ── Code source ───────────────────────────────────────────────────────────
COPY . .

# ── Dossiers Laravel (nécessaires avant dump-autoload / package:discover) ─
RUN mkdir -p storage/framework/cache/data \
            storage/framework/sessions \
            storage/framework/views \
            storage/logs \
            bootstrap/cache

# ── Finaliser l'autoload (scripts artisan désactivés) ────────────────────
RUN composer dump-autoload --optimize --no-scripts

# ── Permissions storage ───────────────────────────────────────────────────
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache \
    && chmod -R 775 /app/storage /app/bootstrap/cache

EXPOSE 8000

# ── Script de démarrage : attente MySQL + migrate + seed + artisan serve ──
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]

