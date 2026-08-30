<?php

namespace App\Http\Controllers;

use App\Http\Requests\Recipe\RecipeRequest;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function show(Recipe $recipe): RecipeResource
    {
        $recipe->load(['user', 'ingredients', 'steps', 'images', 'categories'])
            ->loadCount(['favorites', 'comments']);

        return new RecipeResource($recipe);
    }

    public function store(RecipeRequest $request): JsonResponse
    {
        $recipe = DB::transaction(function () use ($request) {
            $recipe = $request->user()->recipes()->create([
                'title' => $request->validated('title'),
            ]);

            $this->syncChildren($recipe, $request);

            return $recipe;
        });

        return (new RecipeResource($this->loadForResponse($recipe)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(RecipeRequest $request, Recipe $recipe): RecipeResource
    {
        $this->authorize('update', $recipe);

        DB::transaction(function () use ($request, $recipe) {
            $recipe->update(['title' => $request->validated('title')]);

            $recipe->ingredients()->delete();
            $recipe->steps()->delete();

            $this->syncChildren($recipe, $request);
        });

        return new RecipeResource($this->loadForResponse($recipe));
    }

    public function destroy(Recipe $recipe): JsonResponse
    {
        $this->authorize('delete', $recipe);

        $recipe->delete();

        return response()->json(['message' => 'レシピを削除しました。']);
    }

    /**
     * 材料・手順・カテゴリを送信内容で作り直す。配列の並びがそのまま表示順になる。
     */
    private function syncChildren(Recipe $recipe, RecipeRequest $request): void
    {
        $ingredients = collect($request->validated('ingredients'))
            ->values()
            ->map(fn (array $ingredient, int $index) => [
                'name' => $ingredient['name'],
                'quantity' => $ingredient['quantity'] ?? null,
                'sort_order' => $index + 1,
            ]);
        $recipe->ingredients()->createMany($ingredients);

        $steps = collect($request->validated('steps'))
            ->values()
            ->map(fn (string $description, int $index) => [
                'step_number' => $index + 1,
                'description' => $description,
            ]);
        $recipe->steps()->createMany($steps);

        $recipe->categories()->sync($request->validated('category_ids', []));
    }

    private function loadForResponse(Recipe $recipe): Recipe
    {
        return $recipe->fresh()
            ->load(['user', 'ingredients', 'steps', 'categories'])
            ->loadCount(['favorites', 'comments']);
    }
}
