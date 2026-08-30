<?php

namespace Tests\Feature\Recipe;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecipeListTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_recipes_newest_first(): void
    {
        $old = Recipe::factory()->create(['created_at' => now()->subDay()]);
        $new = Recipe::factory()->create(['created_at' => now()]);

        $response = $this->getJson('/api/recipes')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta']);

        $this->assertSame(
            [$new->id, $old->id],
            array_column($response->json('data'), 'id'),
        );
    }

    public function test_keyword_filters_by_title(): void
    {
        Recipe::factory()->create(['title' => '肉じゃが']);
        Recipe::factory()->create(['title' => 'ポテトサラダ']);

        $response = $this->getJson('/api/recipes?keyword='.urlencode('じゃが'))->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('肉じゃが', $response->json('data.0.title'));
    }

    public function test_ingredient_filters_via_ingredients_relation(): void
    {
        $match = Recipe::factory()->create();
        Ingredient::factory()->create(['recipe_id' => $match->id, 'name' => '鶏むね肉']);

        $other = Recipe::factory()->create();
        Ingredient::factory()->create(['recipe_id' => $other->id, 'name' => '豚バラ肉']);

        $response = $this->getJson('/api/recipes?ingredient='.urlencode('鶏'))->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($match->id, $response->json('data.0.id'));
    }

    public function test_category_filter_uses_or_semantics(): void
    {
        [$washoku, $dessert, $chinese] = Category::factory()->count(3)->create();

        $a = Recipe::factory()->create();
        $a->categories()->attach($washoku);
        $b = Recipe::factory()->create();
        $b->categories()->attach($dessert);
        $c = Recipe::factory()->create();
        $c->categories()->attach($chinese);

        $response = $this->getJson("/api/recipes?category_ids[]={$washoku->id}&category_ids[]={$dessert->id}")
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');
        sort($ids);
        $expected = [$a->id, $b->id];
        sort($expected);
        $this->assertSame($expected, $ids);
    }

    public function test_filters_combine_with_and(): void
    {
        $washoku = Category::factory()->create();

        $hit = Recipe::factory()->create(['title' => '和風カレー']);
        $hit->categories()->attach($washoku);

        $missCategory = Recipe::factory()->create(['title' => '和風パスタ']);

        $response = $this->getJson('/api/recipes?keyword='.urlencode('和風')."&category_ids[]={$washoku->id}")
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($hit->id, $response->json('data.0.id'));
    }

    public function test_invalid_category_id_is_rejected(): void
    {
        $this->getJson('/api/recipes?category_ids[]=999999')
            ->assertJsonValidationErrors('category_ids.0');
    }
}
