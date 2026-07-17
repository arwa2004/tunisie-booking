<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedTinyInteger('note_globale');       // 1-10
            $table->unsignedTinyInteger('note_qualite_prix')->nullable();
            $table->unsignedTinyInteger('note_chambres')->nullable();
            $table->unsignedTinyInteger('note_emplacement')->nullable();
            $table->unsignedTinyInteger('note_proprete')->nullable();
            $table->unsignedTinyInteger('note_services')->nullable();
            $table->unsignedTinyInteger('note_equipements')->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();

            // Un utilisateur ne peut laisser qu'un seul avis par hôtel
            $table->unique(['hotel_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};
