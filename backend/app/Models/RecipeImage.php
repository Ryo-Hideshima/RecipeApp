<?php

namespace App\Models;

use Database\Factories\RecipeImageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeImage extends Model
{
    /** @use HasFactory<RecipeImageFactory> */
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = ['recipe_id', 'image_path', 'sort_order'];

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
