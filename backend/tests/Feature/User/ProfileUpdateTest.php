<?php

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_update_profile(): void
    {
        $this->patchJson('/api/profile', ['name' => 'あたらしい名前'])->assertUnauthorized();
    }

    public function test_user_can_update_own_name_and_bio(): void
    {
        $user = User::factory()->create(['name' => '旧名', 'bio' => null]);

        $this->actingAs($user)->patchJson('/api/profile', [
            'name' => 'はるか',
            'bio' => '和食多めです',
        ])->assertOk()
            ->assertJsonPath('data.name', 'はるか')
            ->assertJsonPath('data.bio', '和食多めです');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'はるか',
            'bio' => '和食多めです',
        ]);
    }

    public function test_profile_validation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patchJson('/api/profile', ['name' => ''])
            ->assertJsonValidationErrors('name');

        $this->actingAs($user)->patchJson('/api/profile', [
            'name' => 'ok',
            'bio' => str_repeat('あ', 161),
        ])->assertJsonValidationErrors('bio');
    }
}
