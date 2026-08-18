# ============================================
#  Dockerfile — Backend Laravel (TunisieBooking)
#  Optimise pour Railway / Render
# ============================================

FROM php:8.2-apache

# --- Extensions systeme + PHP necessaires a Laravel / MySQL ---
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Composer ---
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --- Apache : Purge MPMs concurents + activer mpm_prefork & rewrite ---
RUN find /etc/apache2/mods-enabled/ -name "mpm_*.load" ! -name "mpm_prefork.load" -delete 2>/dev/null || true \
    && find /etc/apache2/mods-enabled/ -name "mpm_*.conf" ! -name "mpm_prefork.conf" -delete 2>/dev/null || true \
    && a2enmod mpm_prefork rewrite

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# --- Dependances PHP (cache Docker) ---
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-req=ext-mongodb

# --- Code source ---
COPY . .

# --- Permissions Laravel ---
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# --- Finaliser l'autoload ---
RUN composer dump-autoload --optimize

EXPOSE 8080

# --- start.sh : gere le port, la BDD et les migrations ---
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
