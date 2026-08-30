<?php

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_upload_avatar(): void
    {
        $this->postJson('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('me.jpg'),
        ])->assertUnauthorized();
    }

    public function test_user_can_upload_avatar(): void
    {
        $user = User::factory()->create(['avatar_path' => null]);

        $response = $this->actingAs($user)->postJson('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('me.jpg'),
        ])->assertOk();

        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
        $this->assertNotNull($response->json('data.avatar_url'));
    }

    public function test_uploading_new_avatar_replaces_and_deletes_the_old_one(): void
    {
        $user = User::factory()->create();
        $oldPath = UploadedFile::fake()->image('old.jpg')->store('avatars', 'public');
        $user->update(['avatar_path' => $oldPath]);

        $this->actingAs($user)->postJson('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('new.jpg'),
        ])->assertOk();

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($user->fresh()->avatar_path);
    }

    public function test_user_can_remove_avatar(): void
    {
        $user = User::factory()->create();
        $path = UploadedFile::fake()->image('me.jpg')->store('avatars', 'public');
        $user->update(['avatar_path' => $path]);

        $this->actingAs($user)->deleteJson('/api/profile/avatar')
            ->assertOk()
            ->assertJsonPath('data.avatar_path', null);

        $this->assertNull($user->fresh()->avatar_path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_avatar_must_be_an_image(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ])->assertJsonValidationErrors('avatar');
    }
}
