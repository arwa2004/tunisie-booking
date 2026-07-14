<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            // Âge strictement inférieur = gratuit (ex: 2 → 0 et 1 an gratuits)
            $table->unsignedTinyInteger('age_max_bebe')->default(2)->after('disponible');

            // Âge strictement inférieur = tarif "enfant" (supplement_enfant)
            // Au-delà = tarif "grand enfant" (supplement_grand_enfant)
            $table->unsignedTinyInteger('age_max_enfant')->default(12)->after('age_max_bebe');

            $table->decimal('supplement_enfant', 8, 2)->default(30)->after('age_max_enfant');
            $table->decimal('supplement_grand_enfant', 8, 2)->default(50)->after('supplement_enfant');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['age_max_bebe', 'age_max_enfant', 'supplement_enfant', 'supplement_grand_enfant']);
        });
    }
};
