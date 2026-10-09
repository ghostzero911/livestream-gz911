<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->city() . ' ' . fake()->randomElement(['FC', 'United', 'Rovers', 'City']),
            'logo_url' => 'https://via.placeholder.com/150/0000FF/FFFFFF?Text=TeamLogo',
            'country' => fake()->country(),
        ];
    }
}
