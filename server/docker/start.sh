#!/bin/bash
set -e

# -------------------------------------------------------------
# 1. Configuration du Port Apache (Render / Railway)
# -------------------------------------------------------------
PORT="${PORT:-10000}"
echo "Configuration d'Apache sur le port ${PORT}..."
sed -ri "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -ri "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf

# -------------------------------------------------------------
# 2. DEBUG : Affiche les variables disponibles pour diagnostiquer
# -------------------------------------------------------------
echo "=== DEBUG VARIABLES DB ==="
echo "DB_HOST=${DB_HOST:-NON DEFINI}"
echo "DB_PORT=${DB_PORT:-NON DEFINI}"
echo "DB_DATABASE=${DB_DATABASE:-NON DEFINI}"
echo "DB_USERNAME=${DB_USERNAME:-NON DEFINI}"
echo "DB_PASSWORD=${DB_PASSWORD:+[DEFINI]}"
echo "DB_URL=${DB_URL:+[DEFINI]}"
echo "DATABASE_URL=${DATABASE_URL:+[DEFINI]}"
echo "MYSQL_URL=${MYSQL_URL:+[DEFINI]}"
echo "MYSQLHOST=${MYSQLHOST:-NON DEFINI}"
echo "MYSQLPORT=${MYSQLPORT:-NON DEFINI}"
echo "MYSQLDATABASE=${MYSQLDATABASE:-NON DEFINI}"
echo "MYSQLUSER=${MYSQLUSER:-NON DEFINI}"
echo "=========================="

# -------------------------------------------------------------
# 3. Resolution des variables de connexion BDD (Render / Railway)
# -------------------------------------------------------------

# Priorité aux variables DB_* directes (ajoutées manuellement dans Render)
# Sinon on essaie les variables MYSQL* de Railway
if [ -z "$DB_HOST" ] && [ -n "$MYSQLHOST" ]; then
    export DB_HOST="$MYSQLHOST"
fi
if [ -z "$DB_PORT" ] && [ -n "$MYSQLPORT" ]; then
    export DB_PORT="$MYSQLPORT"
fi
if [ -z "$DB_DATABASE" ] && [ -n "$MYSQLDATABASE" ]; then
    export DB_DATABASE="$MYSQLDATABASE"
fi
if [ -z "$DB_USERNAME" ] && [ -n "$MYSQLUSER" ]; then
    export DB_USERNAME="$MYSQLUSER"
fi
if [ -z "$DB_PASSWORD" ] && [ -n "$MYSQLPASSWORD" ]; then
    export DB_PASSWORD="$MYSQLPASSWORD"
fi

# Fallback URL
if [ -z "$DB_URL" ]; then
    if [ -n "$MYSQL_URL" ]; then
        export DB_URL="$MYSQL_URL"
    elif [ -n "$MYSQL_PUBLIC_URL" ]; then
        export DB_URL="$MYSQL_PUBLIC_URL"
    elif [ -n "$DATABASE_URL" ]; then
        export DB_URL="$DATABASE_URL"
    fi
fi

echo "=== VARIABLES RESOLUES ==="
echo "DB_HOST=${DB_HOST:-NON DEFINI}"
echo "DB_PORT=${DB_PORT:-NON DEFINI}"
echo "DB_DATABASE=${DB_DATABASE:-NON DEFINI}"
echo "DB_USERNAME=${DB_USERNAME:-NON DEFINI}"
echo "=========================="

# -------------------------------------------------------------
# 4. Test de connexion avec affichage de l'erreur exacte
# -------------------------------------------------------------
echo "Test de connexion à MySQL..."
CONNECT_ERROR=$(php -r "
    try {
        \$host = getenv('DB_HOST') ?: '127.0.0.1';
        \$port = getenv('DB_PORT') ?: '3306';
        \$db   = getenv('DB_DATABASE') ?: 'railway';
        \$user = getenv('DB_USERNAME') ?: 'root';
        \$pass = getenv('DB_PASSWORD') ?: '';
        \$url  = getenv('DB_URL');

        if (\$url) {
            \$pdo = new PDO(\$url, null, null, [PDO::ATTR_TIMEOUT => 5]);
        } else {
            \$dsn = \"mysql:host={\$host};port={\$port};dbname={\$db};charset=utf8mb4\";
            \$pdo = new PDO(\$dsn, \$user, \$pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);
        }
        echo 'OK';
    } catch (\Throwable \$e) {
        echo 'ERREUR: ' . \$e->getMessage();
    }
" 2>&1)

echo "Résultat test: $CONNECT_ERROR"

if [[ "$CONNECT_ERROR" == "OK" ]]; then
    CONNECTED=1
else
    CONNECTED=0
fi

# -------------------------------------------------------------
# 5. Attente active de la disponibilite de MySQL si pas connecté
# -------------------------------------------------------------
if [ $CONNECTED -eq 0 ]; then
    echo "Attente de la disponibilité de la base de données MySQL..."
    MAX_ATTEMPTS=20
    ATTEMPT=1

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        RESULT=$(php -r "
            try {
                \$host = getenv('DB_HOST') ?: '127.0.0.1';
                \$port = getenv('DB_PORT') ?: '3306';
                \$db   = getenv('DB_DATABASE') ?: 'railway';
                \$user = getenv('DB_USERNAME') ?: 'root';
                \$pass = getenv('DB_PASSWORD') ?: '';
                \$url  = getenv('DB_URL');

                if (\$url) {
                    \$pdo = new PDO(\$url, null, null, [PDO::ATTR_TIMEOUT => 5]);
                } else {
                    \$dsn = \"mysql:host={\$host};port={\$port};dbname={\$db};charset=utf8mb4\";
                    \$pdo = new PDO(\$dsn, \$user, \$pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_TIMEOUT => 5
                    ]);
                }
                echo 'OK';
            } catch (\Throwable \$e) {
                echo 'FAIL';
            }
        " 2>/dev/null)

        if [[ "$RESULT" == "OK" ]]; then
            echo "✅ Connexion à MySQL établie (tentative $ATTEMPT/$MAX_ATTEMPTS)!"
            CONNECTED=1
            break
        fi

        echo "⏳ En attente de MySQL (tentative $ATTEMPT/$MAX_ATTEMPTS)... pause 3s"
        sleep 3
        ATTEMPT=$((ATTEMPT + 1))
    done
fi

# -------------------------------------------------------------
# 6. Execution des Migrations & Seeders
# -------------------------------------------------------------
if [ $CONNECTED -eq 1 ]; then
    echo "Exécution des migrations Laravel..."
    php artisan migrate --force || echo "⚠️ Avertissement lors des migrations."

    echo "Alimentation initiale des données (Seeders)..."
    php artisan db:seed --force || echo "⚠️ Données déjà présentes ou avertissement lors du seeding."
else
    echo "⚠️ Impossible de joindre MySQL. Vérifiez les variables DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD dans Render."
fi

# -------------------------------------------------------------
# 7. Cache Prod & Démarrage Apache
# -------------------------------------------------------------
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Démarrage d'Apache sur le port ${PORT}..."
exec apache2-foreground
