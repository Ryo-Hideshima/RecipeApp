<?php

namespace App\Http\Requests\Recipe;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreRecipeImagesRequest extends FormRequest
{
    /** 1レシピあたりの写真の上限枚数。 */
    public const MAX_PER_RECIPE = 20;

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
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $existing = $this->route('recipe')->images()->count();
            $incoming = is_array($this->file('images')) ? count($this->file('images')) : 0;

            if ($existing + $incoming > self::MAX_PER_RECIPE) {
                $validator->errors()->add('images', '写真は1レシピにつき'.self::MAX_PER_RECIPE.'枚までです。');
            }
        });
    }
}
