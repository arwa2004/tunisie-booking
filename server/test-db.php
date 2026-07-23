<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $count = \App\Models\Hotel::count();
    echo "SUCCESS: " . $count . " hotels in DB\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
