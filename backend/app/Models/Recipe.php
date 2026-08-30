<?php

namespace App\Models;

use Database\Factories\RecipeFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    /** @use HasFactory<RecipeFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'title'];

    /**
     * 指定ユーザーがお気に入り登録済みかを is_favorited として付与する。
     * 未ログイン（null）の場合は何もしない。
     */
    public function scopeWithIsFavorited(Builder $query, ?User $user): void
    {
        $query->when($user, fn (Builder $q) => $q->withExists([
            'favorites as is_favorited' => fn ($favoriteQuery) => $favoriteQuery->where('user_id', $user->id),
        ]));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RecipeImage::class)->orderBy('sort_order');
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class)->orderBy('sort_order');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(RecipeStep::class)->orderBy('step_number');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'recipe_categories');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoredBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withPivot('created_at');
    }
}
