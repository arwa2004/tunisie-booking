<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chambres', function (Blueprint $table) {
            // Pourcentage de remise appliqué au prix de cette chambre (0 à 100)
            // Ex: 20.00 → prix affiché avec -20% par rapport au "prix barré"
            $table->decimal('remise_pourcentage', 5, 2)->default(0)->after('quantite');
        });
    }

    public function down(): void
    {
        Schema::table('chambres', function (Blueprint $table) {
            $table->dropColumn('remise_pourcentage');
        });
    }
};
