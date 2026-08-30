<?php

namespace App\Http\Controllers;

use App\Http\Requests\Recipe\StoreRecipeImagesRequest;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use App\Models\RecipeImage;
use App\Support\MediaStorage;
use Illuminate\Http\JsonResponse;

class RecipeImageController extends Controller
{
    /**
     * レシピ写真を複数アップロードし、既存写真の後ろに追加する。
     */
    public function store(StoreRecipeImagesRequest $request, Recipe $recipe): RecipeResource
    {
        $this->authorize('update', $recipe);

        $order = (int) $recipe->images()->max('sort_order');

        foreach (array_values($request->file('images')) as $file) {
            $recipe->images()->create([
                'image_path' => MediaStorage::store($file, 'recipe-images'),
                'sort_order' => ++$order,
            ]);
        }

        return new RecipeResource(
            $recipe->fresh()->load(['user', 'ingredients', 'steps', 'images', 'categories'])
                ->loadCount(['favorites', 'comments']),
        );
    }

    public function destroy(Recipe $recipe, RecipeImage $image): JsonResponse
    {
        $this->authorize('update', $recipe);
        abort_unless($image->recipe_id === $recipe->id, 404);

        MediaStorage::delete($image->image_path);
        $image->delete();

        return response()->json(['message' => '写真を削除しました。']);
    }
}
