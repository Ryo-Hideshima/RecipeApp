<?php

namespace Tests\Feature\Comment;

use App\Models\Comment;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_list_recipe_comments_oldest_first(): void
    {
        $recipe = Recipe::factory()->create();
        $first = Comment::factory()->for($recipe)->create(['created_at' => now()->subHour()]);
        $second = Comment::factory()->for($recipe)->create(['created_at' => now()]);
        Comment::factory()->create(); // 別レシピのコメント

        $response = $this->getJson("/api/recipes/{$recipe->id}/comments")
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'content', 'user' => ['id', 'name'], 'created_at']]]);

        $this->assertSame(
            [$first->id, $second->id],
            array_column($response->json('data'), 'id'),
        );
    }

    public function test_guest_cannot_post_comment(): void
    {
        $recipe = Recipe::factory()->create();

        $this->postJson("/api/recipes/{$recipe->id}/comments", ['content' => 'いいね'])
            ->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_post_comment(): void
    {
        $recipe = Recipe::factory()->create();
        $commenter = User::factory()->create();

        $this->actingAs($commenter)
            ->postJson("/api/recipes/{$recipe->id}/comments", ['content' => '砂糖を減らして作りました'])
            ->assertCreated()
            ->assertJsonPath('data.content', '砂糖を減らして作りました')
            ->assertJsonPath('data.user.id', $commenter->id);

        $this->assertDatabaseHas('comments', [
            'recipe_id' => $recipe->id,
            'user_id' => $commenter->id,
            'content' => '砂糖を減らして作りました',
        ]);
    }

    public function test_comment_content_is_required_and_limited(): void
    {
        $recipe = Recipe::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/comments", ['content' => ''])
            ->assertJsonValidationErrors('content');

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/comments", [
            'content' => str_repeat('あ', 201),
        ])->assertJsonValidationErrors('content');
    }

    public function test_user_can_delete_own_comment(): void
    {
        $comment = Comment::factory()->create();

        $this->actingAs($comment->user)->deleteJson("/api/comments/{$comment->id}")
            ->assertOk();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_user_cannot_delete_someone_elses_comment(): void
    {
        $comment = Comment::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($other)->deleteJson("/api/comments/{$comment->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }
}
