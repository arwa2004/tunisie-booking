<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Ouvre la table 'users' existante pour la modifier

        $table->string('photo')   // Ajoute une colonne 'photo' de type VARCHAR
              ->nullable()         // La colonne peut être vide (pas obligatoire)
              ->after('telephone'); // Place la colonne après 'telephone'
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('photo'); // Supprime la colonne 'photo'
    });
}
};
