<?php

namespace Tests\Feature\Favorite;

use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_favorite(): void
    {
        $recipe = Recipe::factory()->create();

        $this->postJson("/api/recipes/{$recipe->id}/favorite")->assertUnauthorized();
    }

    public function test_user_can_favorite_a_recipe_and_it_is_idempotent(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->create();

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/favorite")
            ->assertOk()
            ->assertJson(['favorites_count' => 1, 'is_favorited' => true]);

        // 2回目も成功し、件数は増えない
        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/favorite")
            ->assertOk()
            ->assertJson(['favorites_count' => 1, 'is_favorited' => true]);

        $this->assertDatabaseCount('favorites', 1);
    }

    public function test_user_can_unfavorite_and_it_is_idempotent(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->create();
        $recipe->favorites()->create(['user_id' => $user->id]);

        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}/favorite")
            ->assertOk()
            ->assertJson(['favorites_count' => 0, 'is_favorited' => false]);

        // 未登録状態でもう一度呼んでもエラーにならない
        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}/favorite")
            ->assertOk();

        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_favorites_index_returns_only_own_favorites_newest_first(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $older = Recipe::factory()->create();
        $newer = Recipe::factory()->create();
        $someoneElses = Recipe::factory()->create();

        $older->favorites()->create(['user_id' => $user->id])
            ->forceFill(['created_at' => now()->subDay()])->save();
        $newer->favorites()->create(['user_id' => $user->id])
            ->forceFill(['created_at' => now()])->save();
        $someoneElses->favorites()->create(['user_id' => $other->id]);

        $response = $this->actingAs($user)->getJson('/api/favorites')->assertOk();

        $this->assertSame(
            [$newer->id, $older->id],
            array_column($response->json('data'), 'id'),
        );
        $this->assertTrue($response->json('data.0.is_favorited'));
    }

    public function test_recipe_show_exposes_is_favorited_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->create();
        $recipe->favorites()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson("/api/recipes/{$recipe->id}")
            ->assertJsonPath('data.is_favorited', true);
    }

    public function test_recipe_show_omits_is_favorited_for_guest(): void
    {
        $recipe = Recipe::factory()->create();

        $data = $this->getJson("/api/recipes/{$recipe->id}")->assertOk()->json('data');

        $this->assertArrayNotHasKey('is_favorited', $data);
    }
}
