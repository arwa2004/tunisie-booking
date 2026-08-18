#!/bin/sh
set -e

echo "═══════════════════════════════════════════════════════"
echo "  🚀 User Service — Laravel 11 + MySQL (Docker)"
echo "═══════════════════════════════════════════════════════"

# ── Attente de la disponibilité de MySQL ────────────────────────────────
echo "⏳ Connexion à MySQL (${DB_HOST:-mysql-db}:${DB_PORT:-3306})..."
php -r '
$host = getenv("DB_HOST") ?: "mysql-db";
$port = getenv("DB_PORT") ?: "3306";
$db   = getenv("DB_DATABASE") ?: (getenv("DB_NAME") ?: (getenv("MYSQLDATABASE") ?: "user_db"));
$user = getenv("DB_USERNAME") ?: (getenv("DB_USER") ?: (getenv("MYSQLUSER") ?: "root"));
$pass = getenv("DB_PASSWORD") ?: (getenv("MYSQLPASSWORD") ?: "root");

echo "Connecting to MySQL host=$host port=$port db=$db user=$user...\n";

for ($i = 1; $i <= 60; $i++) {
    try {
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_TIMEOUT => 5,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $pdo->query("SELECT 1");
        echo "✅ MySQL est prêt (tentative $i)\n";
        exit(0);
    } catch (\Throwable $e) {
        if ($i % 3 === 0) {
            echo "   ... en attente de MySQL (tentative $i/60): " . $e->getMessage() . "\n";
        }
        sleep(3);
    }
}
fwrite(STDERR, "🔴 MySQL indisponible après 180s — abandon.\n");
exit(1);
'

# ── Espaces de stockage (permissions) ────────────────────────────────────
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache
chmod -R 775 storage bootstrap/cache

# ── Application Laravel (avec système de tentative pour la DB Cloud) ──────
echo "🗄️  Exécution des Migrations avec re-tentatives..."
MIGRATED=0
for attempt in 1 2 3 4 5; do
    echo "   Tentative $attempt/5..."
    if php artisan migrate --force; then
        echo "✅ Migrations appliquées correctement."
        MIGRATED=1
        break
    else
        echo "⚠️ Tentative $attempt échouée (MySQL s'est déconnecté ou se réveille). Attente de 5s..."
        sleep 5
    fi
done

if [ $MIGRATED -eq 0 ]; then
    echo "⚠️ tentative migrate:fresh (base de dev)..."
    php artisan migrate:fresh --force || true
fi

echo "🌱 Seed des utilisateurs..."
php artisan db:seed --force || true

echo "📦 Vidage du cache de config..."
php artisan config:clear || true

# ── Lancement du serveur (port 8000 — attendu par le gateway Nginx) ──────
echo "🟢 User Service disponible sur http://0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
