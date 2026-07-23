<?php
// Configurer temporairement l'environnement pour se connecter à Railway
putenv('DB_HOST=mainline.proxy.rlwy.net');
putenv('DB_PORT=32987');
putenv('DB_DATABASE=railway');
putenv('DB_USERNAME=root');
putenv('DB_PASSWORD=utAjEPytmExwbMZwtPMVOIaICdCOKutD');

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $hotels = \App\Models\Hotel::with('destination')->get();
    echo "SUCCESS: " . $hotels->count() . " hotels fetched from Railway DB\n";
    foreach ($hotels as $hotel) {
        echo " - " . $hotel->nom . " (" . ($hotel->destination->nom ?? 'N/A') . ")\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
