#!/bin/bash
set -e

# -------------------------------------------------------------
# 1. Configuration du Port Apache
# -------------------------------------------------------------
PORT="${PORT:-10000}"
echo "Configuration d'Apache sur le port ${PORT}..."
sed -ri "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf 2>/dev/null || true
sed -ri "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf 2>/dev/null || true

# -------------------------------------------------------------
# 2. Resolution automatique de la BDD
# -------------------------------------------------------------
if [ -n "$MYSQL_URL" ] && [ -z "$DB_HOST" ]; then
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
fi

[ -n "$MYSQLHOST" ]     && [ -z "$DB_HOST" ]     && export DB_HOST="$MYSQLHOST"
[ -n "$MYSQLPORT" ]     && [ -z "$DB_PORT" ]      && export DB_PORT="$MYSQLPORT"
[ -n "$MYSQLDATABASE" ] && [ -z "$DB_DATABASE" ]  && export DB_DATABASE="$MYSQLDATABASE"
[ -n "$MYSQLUSER" ]     && [ -z "$DB_USERNAME" ]  && export DB_USERNAME="$MYSQLUSER"
[ -n "$MYSQLPASSWORD" ] && [ -z "$DB_PASSWORD" ]  && export DB_PASSWORD="$MYSQLPASSWORD"
export DB_CONNECTION="${DB_CONNECTION:-mysql}"

echo "=== CONFIG DB ==="
echo "  DB_HOST     = ${DB_HOST:-NON DEFINI}"
echo "  DB_PORT     = ${DB_PORT:-NON DEFINI}"
echo "  DB_DATABASE = ${DB_DATABASE:-NON DEFINI}"
echo "  DB_USERNAME = ${DB_USERNAME:-NON DEFINI}"
echo "  DB_PASSWORD = ${DB_PASSWORD:+[DEFINI]}"
echo "================="

# -------------------------------------------------------------
# 3. Attente rapide de MySQL (max 30s)
# -------------------------------------------------------------
CONNECTED=0
if [ -n "$DB_HOST" ]; then
    echo "Attente de MySQL sur ${DB_HOST}:${DB_PORT:-3306}..."
    for i in $(seq 1 10); do
        RESULT=$(php -r "
            try {
                \$dsn = 'mysql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:'3306').';dbname='.(getenv('DB_DATABASE')?:'railway').';charset=utf8mb4';
                new PDO(\$dsn, getenv('DB_USERNAME'), getenv('DB_PASSWORD'), [PDO::ATTR_TIMEOUT=>5]);
                echo 'OK';
            } catch(\Throwable \$e) { echo 'FAIL'; }
        " 2>/dev/null)
        if [ "$RESULT" = "OK" ]; then
            echo "✅ MySQL connecté (tentative $i/10)!"
            CONNECTED=1
            break
        fi
        echo "⏳ En attente de MySQL (tentative $i/10)... pause 3s"
        sleep 3
    done
fi

# -------------------------------------------------------------
# 4. Migrations en FOREGROUND (rapide) + Seeding en BACKGROUND
# -------------------------------------------------------------
if [ $CONNECTED -eq 1 ]; then
    echo "Exécution des migrations..."
    php artisan migrate --force || echo "⚠️ Migrations déjà effectuées."

    # Seeding EN ARRIÈRE-PLAN uniquement si la base est vide (évite les doublons)
    (
        sleep 5  # Attendre qu'Apache soit bien lancé
        DEST_COUNT=$(php -r "
            try {
                \$dsn = 'mysql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:'3306').';dbname='.(getenv('DB_DATABASE')?:'railway').';charset=utf8mb4';
                \$pdo = new PDO(\$dsn, getenv('DB_USERNAME'), getenv('DB_PASSWORD'));
                \$stmt = \$pdo->query('SELECT COUNT(*) FROM destinations');
                echo \$stmt->fetchColumn();
            } catch(\Throwable \$e) { echo '0'; }
        " 2>/dev/null)

        if [ "$DEST_COUNT" = "0" ]; then
            echo "[SEED] Base vide — lancement du seeding..." >> /tmp/seed.log
            php artisan db:seed --force >> /tmp/seed.log 2>&1 \
                && echo "[SEED] ✅ Seeding terminé avec succès." >> /tmp/seed.log \
                || echo "[SEED] ⚠️ Erreur lors du seeding." >> /tmp/seed.log
        else
            echo "[SEED] Base déjà alimentée ($DEST_COUNT destinations) — seeding ignoré." >> /tmp/seed.log
        fi
    ) &
else
    echo "⚠️ Démarrage sans BDD — vérifiez les variables DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD."
fi

# -------------------------------------------------------------
# 5. Cache Prod
# -------------------------------------------------------------
php artisan config:cache || true
php artisan route:cache  || true
php artisan view:cache   || true

# -------------------------------------------------------------
# 6. Démarrage immédiat d'Apache
# -------------------------------------------------------------
echo "Démarrage d'Apache sur le port ${PORT}..."
exec apache2-foreground
