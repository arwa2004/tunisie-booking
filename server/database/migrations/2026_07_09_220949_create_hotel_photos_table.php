<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
            $table->text('url');                    // URL complète de l'image
            $table->string('alt_text')->nullable(); // Texte alternatif (accessibilité)
            $table->integer('ordre')->default(0);   // Ordre d'affichage (0 = première)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_photos');
    }
};
