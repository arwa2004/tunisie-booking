# Script pour interagir directement avec la base de données Railway depuis votre ordinateur
# Attention: Vous devez exécuter ce script depuis le dossier "server/"

# --- Configuration de la connexion Railway ---
$env:DB_HOST="mainline.proxy.rlwy.net"
$env:DB_PORT="32987"
$env:DB_DATABASE="railway"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="utAjEPytmExwbMZwtPMVOIaICdCOKutD"

Write-Host "====== Connexion a Railway ======" -ForegroundColor Cyan

# 1. Optionnel : Recréer TOUTE la base de données (Supprime toutes les données existantes !)
# Enlevez le '#' devant la ligne ci-dessous si vous voulez vider la base et tout recréer :
# php artisan migrate:fresh --force

# 2. Création des utilisateurs (Admin + 5 Clients)
Write-Host "-> Injection des utilisateurs (Admin)..."
php artisan db:seed --class=UserSeeder --force

# 3. Création des destinations et hôtels
# Note: Si la commande prend trop de temps et coupe, c'est normal, laissez commenté.
 php artisan db:seed --class=DestinationSeeder --force
 php artisan db:seed --class=HotelSeeder --force

# 4. Création des voyages
 php artisan db:seed --class=VoyageSeeder --force

Write-Host "====== Terminé ! ======" -ForegroundColor Green
