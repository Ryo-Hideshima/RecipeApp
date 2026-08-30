<?php

namespace Tests\Feature\Follow;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_follow(): void
    {
        $target = User::factory()->create();

        $this->postJson("/api/users/{$target->id}/follow")->assertUnauthorized();
    }

    public function test_user_can_follow_another_user_idempotently(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($me)->postJson("/api/users/{$target->id}/follow")
            ->assertOk()
            ->assertJson(['is_following' => true, 'followers_count' => 1]);

        $this->actingAs($me)->postJson("/api/users/{$target->id}/follow")
            ->assertOk()
            ->assertJson(['is_following' => true, 'followers_count' => 1]);

        $this->assertDatabaseCount('follows', 1);
    }

    public function test_user_cannot_follow_themselves(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me)->postJson("/api/users/{$me->id}/follow")
            ->assertStatus(422)
            ->assertJsonValidationErrors('user');

        $this->assertDatabaseCount('follows', 0);
    }

    public function test_user_can_unfollow_idempotently(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        Follow::factory()->create(['follower_id' => $me->id, 'followee_id' => $target->id]);

        $this->actingAs($me)->deleteJson("/api/users/{$target->id}/follow")
            ->assertOk()
            ->assertJson(['is_following' => false, 'followers_count' => 0]);

        $this->actingAs($me)->deleteJson("/api/users/{$target->id}/follow")->assertOk();

        $this->assertDatabaseCount('follows', 0);
    }

    public function test_following_list_is_newest_first_with_viewer_relationship(): void
    {
        $viewer = User::factory()->create();
        $subject = User::factory()->create();
        $followedEarlier = User::factory()->create();
        $followedLater = User::factory()->create();

        Follow::factory()->create([
            'follower_id' => $subject->id,
            'followee_id' => $followedEarlier->id,
            'created_at' => now()->subDay(),
        ]);
        Follow::factory()->create([
            'follower_id' => $subject->id,
            'followee_id' => $followedLater->id,
            'created_at' => now(),
        ]);

        // viewer は followedLater だけをフォローしている
        Follow::factory()->create(['follower_id' => $viewer->id, 'followee_id' => $followedLater->id]);

        $response = $this->actingAs($viewer)->getJson("/api/users/{$subject->id}/following")
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'following_count', 'followers_count', 'is_following']]]);

        $this->assertSame(
            [$followedLater->id, $followedEarlier->id],
            array_column($response->json('data'), 'id'),
        );
        $this->assertTrue($response->json('data.0.is_following'));
        $this->assertFalse($response->json('data.1.is_following'));
    }

    public function test_followers_list_returns_users_following_the_subject(): void
    {
        $subject = User::factory()->create();
        $follower = User::factory()->create();
        $unrelated = User::factory()->create();

        Follow::factory()->create(['follower_id' => $follower->id, 'followee_id' => $subject->id]);

        $response = $this->actingAs($unrelated)->getJson("/api/users/{$subject->id}/followers")
            ->assertOk();

        $this->assertSame([$follower->id], array_column($response->json('data'), 'id'));
    }
}
