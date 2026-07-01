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
        Schema::create('reservations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
        $table->date('date_arrivee');
        $table->date('date_depart');
        $table->integer('nb_chambres')->default(1);
        $table->integer('nb_adultes')->default(1);
        $table->integer('nb_enfants')->default(0);
        $table->integer('prix_total');
        $table->enum('statut', ['en_attente', 'confirmee', 'annulee'])->default('en_attente');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
