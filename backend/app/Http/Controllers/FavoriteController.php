<?php

namespace App\Http\Controllers;

use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    /**
     * 自分がお気に入り登録したレシピを新着(登録日時)順で一覧。
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $recipes = $request->user()->favoriteRecipes()
            ->with(['user', 'categories', 'images'])
            ->withCount(['favorites', 'comments'])
            ->withIsFavorited($request->user())
            ->orderBy('favorites.created_at', 'desc')
            ->paginate(15);

        return RecipeResource::collection($recipes);
    }

    /**
     * お気に入り登録（登録済みなら何もしない）。
     */
    public function store(Request $request, Recipe $recipe): JsonResponse
    {
        $recipe->favorites()->firstOrCreate(['user_id' => $request->user()->id]);

        return $this->stateResponse($request, $recipe);
    }

    /**
     * お気に入り解除（未登録なら何もしない）。
     */
    public function destroy(Request $request, Recipe $recipe): JsonResponse
    {
        $recipe->favorites()->where('user_id', $request->user()->id)->delete();

        return $this->stateResponse($request, $recipe);
    }

    private function stateResponse(Request $request, Recipe $recipe): JsonResponse
    {
        return response()->json([
            'favorites_count' => $recipe->favorites()->count(),
            'is_favorited' => $recipe->favorites()->where('user_id', $request->user()->id)->exists(),
        ]);
    }
}
