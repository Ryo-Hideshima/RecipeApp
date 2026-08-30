<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Favorite;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\RecipeStep;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_migrations_run(): void
    {
        foreach (['users', 'recipes', 'recipe_images', 'ingredients', 'recipe_steps',
            'categories', 'recipe_categories', 'comments', 'favorites', 'follows'] as $table) {
            $this->assertTrue(\Schema::hasTable($table), "missing table: {$table}");
        }
    }

    public function test_recipe_belongs_to_user_and_has_children(): void
    {
        $recipe = Recipe::factory()->create();
        Ingredient::factory()->create(['recipe_id' => $recipe->id]);
        RecipeStep::factory()->create(['recipe_id' => $recipe->id]);
        $recipe->categories()->attach(Category::factory()->create());

        $recipe->refresh();

        $this->assertInstanceOf(User::class, $recipe->user);
        $this->assertCount(1, $recipe->ingredients);
        $this->assertCount(1, $recipe->steps);
        $this->assertCount(1, $recipe->categories);
    }

    public function test_favorite_is_unique_per_user_and_recipe(): void
    {
        $favorite = Favorite::factory()->create();

        $this->expectException(QueryException::class);

        Favorite::factory()->create([
            'recipe_id' => $favorite->recipe_id,
            'user_id' => $favorite->user_id,
        ]);
    }

    public function test_follow_relationships(): void
    {
        [$a, $b] = User::factory(2)->create();
        $a->following()->attach($b->id, ['created_at' => now()]);

        $this->assertTrue($a->following->contains($b));
        $this->assertTrue($b->followers->contains($a));
    }

    public function test_comment_belongs_to_recipe_and_user(): void
    {
        $comment = Comment::factory()->create();

        $this->assertInstanceOf(Recipe::class, $comment->recipe);
        $this->assertInstanceOf(User::class, $comment->user);
    }

    public function test_category_seeder_populates_fixed_master(): void
    {
        $this->seed(CategorySeeder::class);

        $this->assertDatabaseCount('categories', count(CategorySeeder::NAMES));
        $this->assertDatabaseHas('categories', ['name' => '和食']);

        // 冪等であること
        $this->seed(CategorySeeder::class);
        $this->assertDatabaseCount('categories', count(CategorySeeder::NAMES));
    }
}
