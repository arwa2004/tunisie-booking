# ============================================
#  Dockerfile — Backend Laravel (TunisieBooking)
#  A placer dans server/Dockerfile
#  Optimise pour un deploiement sur Render
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

# --- Apache : pointer vers /public et activer mod_rewrite ---
RUN a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# --- Dependances PHP (cache Docker : copie composer.* avant le reste) ---
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-req=ext-mongodb

# --- Code source ---
COPY . .

# --- Permissions Laravel ---
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# --- Finaliser l'autoload (scripts artisan desactives plus haut) ---
RUN composer dump-autoload --optimize

EXPOSE 10000

# --- Render fournit le port via $PORT : on l'injecte dans Apache au demarrage ---
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
