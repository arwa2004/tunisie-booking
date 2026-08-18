<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('email', 'admin@gmail.com')->first();
if ($user) {
    echo "USER FOUND: " . $user->email . "\n";
    $token = $user->createToken('test-token')->plainTextToken;
    echo "TOKEN: " . $token . "\n";
} else {
    echo "USER NOT FOUND\n";
    $users = \App\Models\User::all(['email','role']);
    foreach ($users as $u) {
        echo " - " . $u->email . " [" . $u->role . "]\n";
    }
}
