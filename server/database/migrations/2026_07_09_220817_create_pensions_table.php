<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Crée la table 'pensions' avec 2 colonnes :
        // - id : clé primaire auto-incrémentée
        // - nom : le nom de la pension (ex: "All Inclusive")
        Schema::create('pensions', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // Ex: "All Inclusive", "Demi Pension"
            $table->timestamps();  // created_at et updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pensions');
    }
};
