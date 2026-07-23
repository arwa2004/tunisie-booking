<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('hotel_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Un utilisateur ne peut mettre un hôtel en favori qu'une seule fois
            $table->unique(['user_id', 'hotel_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favoris');
    }
};
