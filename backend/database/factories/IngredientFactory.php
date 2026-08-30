<?php

namespace Database\Factories;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ingredient>
 */
class IngredientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'recipe_id' => Recipe::factory(),
            'name' => fake()->word(),
            'quantity' => fake()->randomElement(['200g', '大さじ1', '1個', '少々', '2カップ']),
            'sort_order' => 1,
        ];
    }
}
