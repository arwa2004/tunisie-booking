<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Hotel>
 */
class HotelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
{
    return [
        'nom'           => fake()->company() . ' Hotel',
        'prix_par_nuit' => fake()->numberBetween(50, 500),
        'etoiles'       => fake()->numberBetween(1, 5),
        'description'   => fake()->sentence(),
        'image'         => null,
        'disponible'    => true,
    ];
}
}
