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
# 2. Resolution des variables de connexion BDD (Render / Railway)
# -------------------------------------------------------------
if [ -n "$MYSQL_URL" ] && [ -z "$DB_URL" ]; then
    export DB_URL="$MYSQL_URL"
elif [ -n "$MYSQLURL" ] && [ -z "$DB_URL" ]; then
    export DB_URL="$MYSQLURL"
elif [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
    export DB_URL="$DATABASE_URL"
fi

if [ -n "$MYSQLHOST" ]; then
    export DB_HOST="$MYSQLHOST"
fi
if [ -n "$MYSQLPORT" ]; then
    export DB_PORT="$MYSQLPORT"
fi
if [ -n "$MYSQLDATABASE" ]; then
    export DB_DATABASE="$MYSQLDATABASE"
fi
if [ -n "$MYSQLUSER" ]; then
    export DB_USERNAME="$MYSQLUSER"
fi
if [ -n "$MYSQLPASSWORD" ]; then
    export DB_PASSWORD="$MYSQLPASSWORD"
fi

# -------------------------------------------------------------
# 3. Attente active de la disponibilite de MySQL (Wait for DB)
# -------------------------------------------------------------
echo "Attente de la disponibilité de la base de données MySQL..."
MAX_ATTEMPTS=30
ATTEMPT=1
CONNECTED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if php -r "
        try {
            \$host = getenv('DB_HOST') ?: '127.0.0.1';
            \$port = getenv('DB_PORT') ?: '3306';
            \$db   = getenv('DB_DATABASE') ?: 'tunisie_booking';
            \$user = getenv('DB_USERNAME') ?: 'root';
            \$pass = getenv('DB_PASSWORD') ?: '';
            \$url  = getenv('DB_URL');
            
            if (\$url) {
                \$pdo = new PDO(\$url);
            } else {
                \$dsn = \"mysql:host={\$host};port={\$port};dbname={\$db};charset=utf8mb4\";
                \$pdo = new PDO(\$dsn, \$user, \$pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5
                ]);
            }
            exit(0);
        } catch (\Throwable \$e) {
            exit(1);
        }
    " 2>/dev/null; then
        echo "✅ Connexion à MySQL établie avec succès (tentative $ATTEMPT/$MAX_ATTEMPTS)!"
        CONNECTED=1
        break
    fi

    echo "⏳ En attente de MySQL (tentative $ATTEMPT/$MAX_ATTEMPTS)... pause 2s"
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

# -------------------------------------------------------------
# 4. Execution des Migrations & Seeders
# -------------------------------------------------------------
if [ $CONNECTED -eq 1 ]; then
    echo "Exécution des migrations Laravel..."
    php artisan migrate --force || echo "⚠️ Avertissement lors des migrations."
    
    echo "Alimentation initiale des données (Seeders)..."
    php artisan db:seed --force || echo "⚠️ Avertissement lors du seeding (données déjà présentes)."
else
    echo "⚠️ Impossible de joindre MySQL après $MAX_ATTEMPTS tentatives. Le serveur Apache va démarrer en mode autonome."
fi

# -------------------------------------------------------------
# 5. Optimisation du Cache Prod & Démarrage d'Apache
# -------------------------------------------------------------
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Démarrage d'Apache sur le port ${PORT}..."
exec apache2-foreground
