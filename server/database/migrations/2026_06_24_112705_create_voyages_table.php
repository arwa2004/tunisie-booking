<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voyages', function (Blueprint $table) {
            $table->id();
            $table->string('nom');          // Nom de la destination (ex: "Paris")
            $table->string('pays');         // Pays (ex: "France")
            $table->text('image');        // URL de l'image
            $table->decimal('prix', 8, 2);  // Prix en DT (ex: 850.00)
            $table->integer('duree');       // Durée en jours (ex: 7)
            $table->text('description')->nullable(); // Description optionnelle
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voyages');
    }
};
