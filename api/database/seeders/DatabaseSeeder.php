<?php

namespace Database\Seeders;

use App\Models\Fixture;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create 10 fixtures with the default 'scheduled' status
        //Fixture::factory(10)->create();

        // Create 5 fixtures that are 'live' with random scores
        // Fixture::factory(5)->create([
        //     'status' => 'live',
        //     'home_team_score' => fake()->numberBetween(0, 5),
        //     'away_team_score' => fake()->numberBetween(0, 5),
        // ]);

        // Create 5 fixtures that are 'finished' with random scores
        // Fixture::factory(5)->create([
        //     'status' => 'finished',
        //     'home_team_score' => fake()->numberBetween(0, 5),
        //     'away_team_score' => fake()->numberBetween(0, 5),
        // ]);
    }
}
