<?php

namespace App\Http\Resources;

use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Recipe
 */
class RecipeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'user' => new UserSummaryResource($this->whenLoaded('user')),
            'ingredients' => $this->whenLoaded('ingredients', fn () => $this->ingredients->map(fn ($i) => [
                'name' => $i->name,
                'quantity' => $i->quantity,
            ])),
            'steps' => $this->whenLoaded('steps', fn () => $this->steps->map(fn ($s) => [
                'step_number' => $s->step_number,
                'description' => $s->description,
            ])),
            'images' => $this->whenLoaded('images', fn () => $this->images->pluck('image_path')),
            'categories' => $this->whenLoaded('categories', fn () => $this->categories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])),
            'favorites_count' => $this->whenCounted('favorites'),
            'comments_count' => $this->whenCounted('comments'),
            'is_favorited' => $this->when(
                ! is_null($this->is_favorited),
                fn () => (bool) $this->is_favorited,
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
