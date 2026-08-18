#!/bin/bash
set -e

# -------------------------------------------------------------
# 1. Configuration du Port Apache (Railway utilise PORT=8080)
# -------------------------------------------------------------
PORT="${PORT:-8080}"
echo "Configuration d'Apache sur le port ${PORT}..."
sed -ri "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf 2>/dev/null || true
sed -ri "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf 2>/dev/null || true

# -------------------------------------------------------------
# 2. Resolution automatique de la BDD (Railway + Render)
# -------------------------------------------------------------

# Railway : MYSQL_URL (privée, format mysql://user:pass@host:port/db)
if [ -n "$MYSQL_URL" ] && [ -z "$DB_HOST" ]; then
    # Parse MYSQL_URL → extraire les composants
    # Format: mysql://user:pass@host:port/db
    DB_USER=$(echo "$MYSQL_URL" | sed 's|mysql://||' | cut -d: -f1)
    DB_PASS=$(echo "$MYSQL_URL" | sed 's|mysql://[^:]*:||' | cut -d@ -f1)
    DB_HOST_PORT=$(echo "$MYSQL_URL" | sed 's|mysql://[^@]*@||' | cut -d/ -f1)
    DB_HOSTONLY=$(echo "$DB_HOST_PORT" | cut -d: -f1)
    DB_PORTONLY=$(echo "$DB_HOST_PORT" | cut -d: -f2)
    DB_DBNAME=$(echo "$MYSQL_URL" | sed 's|.*/||')

    export DB_HOST="${DB_HOSTONLY}"
    export DB_PORT="${DB_PORTONLY:-3306}"
    export DB_USERNAME="${DB_USER}"
    export DB_PASSWORD="${DB_PASS}"
    export DB_DATABASE="${DB_DBNAME}"
    export DB_CONNECTION="mysql"
    echo "✅ Variables extraites depuis MYSQL_URL (Railway privé)"
fi

# Fallback: variables individuelles Render
[ -n "$MYSQLHOST" ]     && [ -z "$DB_HOST" ]     && export DB_HOST="$MYSQLHOST"
[ -n "$MYSQLPORT" ]     && [ -z "$DB_PORT" ]     && export DB_PORT="$MYSQLPORT"
[ -n "$MYSQLDATABASE" ] && [ -z "$DB_DATABASE" ] && export DB_DATABASE="$MYSQLDATABASE"
[ -n "$MYSQLUSER" ]     && [ -z "$DB_USERNAME" ] && export DB_USERNAME="$MYSQLUSER"
[ -n "$MYSQLPASSWORD" ] && [ -z "$DB_PASSWORD" ] && export DB_PASSWORD="$MYSQLPASSWORD"

# Forcer DB_CONNECTION à mysql
export DB_CONNECTION="${DB_CONNECTION:-mysql}"

# -------------------------------------------------------------
# 3. DEBUG : Variables résolues
# -------------------------------------------------------------
echo "=== CONFIG DB ==="
echo "  DB_HOST     = ${DB_HOST:-NON DEFINI}"
echo "  DB_PORT     = ${DB_PORT:-NON DEFINI}"
echo "  DB_DATABASE = ${DB_DATABASE:-NON DEFINI}"
echo "  DB_USERNAME = ${DB_USERNAME:-NON DEFINI}"
echo "  DB_PASSWORD = ${DB_PASSWORD:+[DEFINI]}"
echo "================="

# -------------------------------------------------------------
# 4. Attente active de MySQL
# -------------------------------------------------------------
if [ -n "$DB_HOST" ]; then
    echo "Attente de MySQL sur ${DB_HOST}:${DB_PORT:-3306}..."
    MAX_ATTEMPTS=20
    ATTEMPT=1
    CONNECTED=0

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        RESULT=$(php -r "
            try {
                \$dsn = 'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . (getenv('DB_DATABASE') ?: 'railway') . ';charset=utf8mb4';
                \$pdo = new PDO(\$dsn, getenv('DB_USERNAME'), getenv('DB_PASSWORD'), [PDO::ATTR_TIMEOUT => 5]);
                echo 'OK';
            } catch (\Throwable \$e) {
                echo 'FAIL:' . \$e->getMessage();
            }
        " 2>/dev/null)

        if [[ "$RESULT" == "OK" ]]; then
            echo "✅ MySQL connecté (tentative $ATTEMPT/$MAX_ATTEMPTS)!"
            CONNECTED=1
            break
        fi

        echo "⏳ En attente de MySQL (tentative $ATTEMPT/$MAX_ATTEMPTS)... [$RESULT]"
        sleep 3
        ATTEMPT=$((ATTEMPT + 1))
    done
else
    echo "⚠️ DB_HOST non défini — vérifiez les variables dans Railway (onglet Variables du service web)"
    CONNECTED=0
fi

# -------------------------------------------------------------
# 5. Migrations & Seeders
# -------------------------------------------------------------
if [ $CONNECTED -eq 1 ]; then
    echo "Exécution des migrations..."
    php artisan migrate --force || echo "⚠️ Migrations déjà effectuées ou erreur."
    echo "Injection des données (Seeders)..."
    php artisan db:seed --force || echo "⚠️ Données déjà présentes."
else
    echo "⚠️ Démarrage sans BDD — ajoutez MYSQL_URL ou DB_HOST dans les variables du service Railway."
fi

# -------------------------------------------------------------
# 6. Cache Prod & Démarrage Apache
# -------------------------------------------------------------
php artisan config:cache || true
php artisan route:cache  || true
php artisan view:cache   || true

echo "Démarrage d'Apache sur le port ${PORT}..."
exec apache2-foreground
