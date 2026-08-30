<?php

namespace Tests\Feature\Recipe;

use App\Models\Recipe;
use App\Models\RecipeImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RecipeImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_upload_images(): void
    {
        $recipe = Recipe::factory()->create();

        $this->postJson("/api/recipes/{$recipe->id}/images", [
            'images' => [UploadedFile::fake()->image('a.jpg')],
        ])->assertUnauthorized();
    }

    public function test_non_owner_cannot_upload_images(): void
    {
        $recipe = Recipe::factory()->create();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/recipes/{$recipe->id}/images", [
                'images' => [UploadedFile::fake()->image('a.jpg')],
            ])->assertForbidden();
    }

    public function test_owner_can_upload_multiple_images_and_they_append(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/images", [
            'images' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.png'),
            ],
        ])->assertOk()
            ->assertJsonCount(2, 'data.images')
            ->assertJsonPath('data.images.0.url', fn ($url) => is_string($url) && $url !== '');

        $this->assertSame([1, 2], $recipe->images()->orderBy('sort_order')->pluck('sort_order')->all());
        foreach ($recipe->images as $image) {
            Storage::disk('public')->assertExists($image->image_path);
        }

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/images", [
            'images' => [UploadedFile::fake()->image('three.jpg')],
        ])->assertOk()->assertJsonCount(3, 'data.images');

        $this->assertSame([1, 2, 3], $recipe->images()->orderBy('sort_order')->pluck('sort_order')->all());
    }

    public function test_upload_validation(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/images", [
            'images' => [UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')],
        ])->assertJsonValidationErrors('images.0');

        $this->actingAs($user)->postJson("/api/recipes/{$recipe->id}/images", [
            'images' => collect(range(1, 11))->map(fn () => UploadedFile::fake()->image('x.jpg'))->all(),
        ])->assertJsonValidationErrors('images');
    }

    public function test_owner_can_delete_an_image_and_file_is_removed(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();
        $path = UploadedFile::fake()->image('a.jpg')->store('recipe-images', 'public');
        $image = $recipe->images()->create(['image_path' => $path, 'sort_order' => 1]);

        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}/images/{$image->id}")
            ->assertOk();

        $this->assertModelMissing($image);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_cannot_delete_image_belonging_to_another_recipe(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();
        $otherImage = RecipeImage::factory()->create();

        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}/images/{$otherImage->id}")
            ->assertNotFound();
    }

    public function test_deleting_recipe_removes_image_files(): void
    {
        $user = User::factory()->create();
        $recipe = Recipe::factory()->for($user)->create();
        $path = UploadedFile::fake()->image('a.jpg')->store('recipe-images', 'public');
        $recipe->images()->create(['image_path' => $path, 'sort_order' => 1]);

        $this->actingAs($user)->deleteJson("/api/recipes/{$recipe->id}")->assertOk();

        Storage::disk('public')->assertMissing($path);
    }
}
