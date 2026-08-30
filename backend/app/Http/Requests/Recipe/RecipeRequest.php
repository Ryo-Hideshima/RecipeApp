<?php

namespace App\Http\Requests\Recipe;

use Illuminate\Foundation\Http\FormRequest;

/**
 * レシピの作成・編集で共通の入力ルール。材料・手順はいずれも1件以上必須で、
 * 送信された配列の並びがそのまま表示順（sort_order / step_number）になる。
 */
class RecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],

            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.name' => ['required', 'string', 'max:50'],
            'ingredients.*.quantity' => ['nullable', 'string', 'max:30'],

            'steps' => ['required', 'array', 'min:1'],
            'steps.*' => ['required', 'string', 'max:500'],

            'category_ids' => ['array'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],
        ];
    }
}
