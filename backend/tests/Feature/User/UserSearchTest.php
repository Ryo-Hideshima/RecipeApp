<?php

namespace Tests\Feature\User;

use App\Models\Follow;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_authentication(): void
    {
        $this->getJson('/api/users?keyword=a')->assertUnauthorized();
    }

    public function test_keyword_is_required(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/users')
            ->assertJsonValidationErrors('keyword');
    }

    public function test_search_matches_name_partially_and_case_insensitively(): void
    {
        $viewer = User::factory()->create();
        $hit = User::factory()->create(['name' => 'Haruka Tanaka']);
        User::factory()->create(['name' => 'Kenta Suzuki']);

        Follow::factory()->create(['follower_id' => $viewer->id, 'followee_id' => $hit->id]);

        $response = $this->actingAs($viewer)->getJson('/api/users?keyword=haruka')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'is_following', 'followers_count']]]);

        $this->assertSame([$hit->id], array_column($response->json('data'), 'id'));
        $this->assertTrue($response->json('data.0.is_following'));
    }

    public function test_profile_show_returns_counts_and_viewer_relationship(): void
    {
        $viewer = User::factory()->create();
        $subject = User::factory()->create(['bio' => '週末は作り置き']);
        Recipe::factory()->count(2)->for($subject)->create();
        Follow::factory()->create(['follower_id' => $viewer->id, 'followee_id' => $subject->id]);

        $this->actingAs($viewer)->getJson("/api/users/{$subject->id}")
            ->assertOk()
            ->assertJsonPath('data.bio', '週末は作り置き')
            ->assertJsonPath('data.recipes_count', 2)
            ->assertJsonPath('data.followers_count', 1)
            ->assertJsonPath('data.is_following', true)
            ->assertJsonPath('data.is_me', false);
    }

    public function test_profile_show_marks_self(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson("/api/users/{$user->id}")
            ->assertJsonPath('data.is_me', true)
            ->assertJsonPath('data.is_following', false);
    }

    public function test_user_recipes_endpoint_returns_only_that_users_recipes_newest_first(): void
    {
        $user = User::factory()->create();
        $old = Recipe::factory()->for($user)->create(['created_at' => now()->subDay()]);
        $new = Recipe::factory()->for($user)->create(['created_at' => now()]);
        Recipe::factory()->create(); // 別ユーザー

        $response = $this->actingAs($user)->getJson("/api/users/{$user->id}/recipes")->assertOk();

        $this->assertSame(
            [$new->id, $old->id],
            array_column($response->json('data'), 'id'),
        );
    }
}
