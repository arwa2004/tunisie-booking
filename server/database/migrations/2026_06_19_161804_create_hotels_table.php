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
        Schema::create('hotels', function (Blueprint $table) {
        $table->id();
        $table->foreignId('destination_id')->constrained('destinations')->onDelete('cascade');
        $table->string('nom');
        $table->integer('prix_par_nuit');
        $table->integer('etoiles');
        $table->text('description')->nullable();
        $table->text('image')->nullable();
        $table->boolean('disponible')->default(true);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
