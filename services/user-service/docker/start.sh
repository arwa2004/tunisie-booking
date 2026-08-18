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
$db   = getenv("DB_NAME") ?: "user_db";
$user = getenv("DB_USER") ?: "root";
$pass = getenv("DB_PASSWORD") ?: "root";

for ($i = 1; $i <= 60; $i++) {
    try {
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
        $pdo->query("SELECT 1");
        echo "✅ MySQL est prêt (tentative $i)\n";
        exit(0);
    } catch (\Throwable $e) {
        if ($i % 5 === 0) {
            echo "   ... en attente de MySQL (tentative $i/60)\n";
        }
        sleep(2);
    }
}
fwrite(STDERR, "🔴 MySQL indisponible après 120s — abandon.\n");
exit(1);
'

# ── Espaces de stockage (permissions) ────────────────────────────────────
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache
chmod -R 775 storage bootstrap/cache

# ── Application Laravel ──────────────────────────────────────────────────
echo "🗄️  Migrations..."
# Tentative normale, puis fresh si la base contient d'anciennes tables
if php artisan migrate --force; then
    echo "✅ Migrations appliquées correctement."
else
    echo "⚠️  Migration standard échouée — tentative migrate:fresh (base de dev)..."
    php artisan migrate:fresh --force
fi

echo "🌱 Seed des utilisateurs..."
php artisan db:seed --force

echo "📦 Vidage du cache de config..."
php artisan config:clear || true

# ── Lancement du serveur (port 8000 — attendu par le gateway Nginx) ──────
echo "🟢 User Service disponible sur http://0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000

