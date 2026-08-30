<?php

namespace Database\Factories;

use App\Models\Recipe;
use App\Models\RecipeImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecipeImage>
 */
class RecipeImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'recipe_id' => Recipe::factory(),
            'image_path' => 'recipe-images/'.fake()->uuid().'.jpg',
            'sort_order' => 1,
        ];
    }
}
