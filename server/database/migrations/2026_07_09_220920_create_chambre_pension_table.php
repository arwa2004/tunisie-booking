<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chambre_pension', function (Blueprint $table) {
            $table->id();

            // Clé étrangère vers la table 'chambres'
            // onDelete('cascade') = si on supprime la chambre, ses pensions sont supprimées aussi
            $table->foreignId('chambre_id')->constrained('chambres')->onDelete('cascade');

            // Clé étrangère vers la table 'pensions'
            $table->foreignId('pension_id')->constrained('pensions')->onDelete('cascade');

            // Le supplément de prix EN DT par nuit pour cette pension sur cette chambre
            // Ex: All Inclusive = +100 DT/nuit, Petit Déjeuner = +0 DT
            $table->integer('supplement_prix')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chambre_pension');
    }
};
