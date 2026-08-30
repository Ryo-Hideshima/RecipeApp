<?php

namespace Tests\Feature\Recipe;

use App\Models\Category;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecipeCrudTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'basicの肉じゃが',
            'ingredients' => [
                ['name' => '牛こま切れ肉', 'quantity' => '200g'],
                ['name' => 'じゃがいも', 'quantity' => '3個'],
            ],
            'steps' => [
                '野菜を一口大に切る。',
                '鍋で肉を炒める。',
                '調味料を入れて煮る。',
            ],
        ], $overrides);
    }

    public function test_guest_cannot_create_recipe(): void
    {
        $this->postJson('/api/recipes', $this->validPayload())->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_recipe_with_children(): void
    {
        $user = User::factory()->create();
        $categories = Category::factory()->count(2)->create();

        $response = $this->actingAs($user)->postJson('/api/recipes', $this->validPayload([
            'category_ids' => $categories->pluck('id')->all(),
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.title', 'basicの肉じゃが')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonCount(2, 'data.ingredients')
            ->assertJsonCount(3, 'data.steps')
            ->assertJsonCount(2, 'data.categories')
            ->assertJsonPath('data.steps.0.step_number', 1)
            ->assertJsonPath('data.steps.2.step_number', 3);

        $recipe = Recipe::firstOrFail();
        $this->assertSame(1, $recipe->ingredients->first()->sort_order);
        $this->assertDatabaseCount('recipe_categories', 2);
    }

    public function test_create_validation_errors(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/recipes', $this->validPayload(['title' => '']))
            ->assertJsonValidationErrors('title');

        $this->actingAs($user)->postJson('/api/recipes', $this->validPayload(['ingredients' => []]))
            ->assertJsonValidationErrors('ingredients');

        $this->actingAs($user)->postJson('/api/recipes', $this->validPayload(['steps' => []]))
            ->assertJsonValidationErrors('steps');

        $this->actingAs($user)->postJson('/api/recipes', $this->validPayload(['category_ids' => [999]]))
            ->assertJsonValidationErrors('category_ids.0');
    }

    public function test_anyone_can_view_recipe(): void
    {
        $recipe = Recipe::factory()->create();
        $recipe->ingredients()->create(['name' => '塩', 'quantity' => '少々', 'sort_order' => 1]);
        $recipe->steps()->create(['step_number' => 1, 'description' => '混ぜる。']);

        $this->getJson("/api/recipes/{$recipe->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $recipe->id)
            ->assertJsonPath('data.ingredients.0.name', '塩')
            ->assertJsonPath('data.favorites_count', 0);
    }

    public function test_owner_can_update_and_children_are_replaced(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();
        $recipe->ingredients()->create(['name' => '古い材料', 'quantity' => '1', 'sort_order' => 1]);
        $recipe->steps()->create(['step_number' => 1, 'description' => '古い手順']);

        $this->actingAs($user)->putJson("/api/recipes/{$recipe->id}", $this->validPayload([
            'title' => '更新後タイトル',
        ]))->assertOk()->assertJsonPath('data.title', '更新後タイトル');

        $this->assertDatabaseMissing('ingredients', ['name' => '古い材料']);
        $this->assertDatabaseCount('ingredients', 2);
        $this->assertDatabaseCount('recipe_steps', 3);
    }

    public function test_non_owner_cannot_update_or_delete(): void
    {
        $recipe = Recipe::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($other)->putJson("/api/recipes/{$recipe->id}", $this->validPayload())
            ->assertForbidden();

        $this->actingAs($other)->deleteJson("/api/recipes/{$recipe->id}")
            ->assertForbidden();
    }

    public function test_owner_can_delete_recipe_and_children_cascade(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();
        $recipe->ingredients()->create(['name' => '塩', 'quantity' => '少々', 'sort_order' => 1]);

        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}")->assertOk();

        $this->assertDatabaseMissing('recipes', ['id' => $recipe->id]);
        $this->assertDatabaseCount('ingredients', 0);
    }
}
