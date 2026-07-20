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
    $data = [];
    foreach ($hotels as $hotel) {
        $data[] = [
            'nom' => $hotel->nom,
            'region' => $hotel->destination->nom ?? '',
            'description' => $hotel->description
        ];
    }
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
