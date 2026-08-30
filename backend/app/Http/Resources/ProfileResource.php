<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * プロフィール画面向けのユーザー情報（公開・メールアドレスは含めない）。
 *
 * @mixin User
 */
class ProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'bio' => $this->bio,
            'avatar_path' => $this->avatar_path,
            'recipes_count' => $this->whenCounted('recipes'),
            'following_count' => $this->whenCounted('following'),
            'followers_count' => $this->whenCounted('followers'),
            'is_following' => $this->when(
                ! is_null($this->is_following),
                fn () => (bool) $this->is_following,
            ),
            'is_me' => $request->user()?->is($this->resource) ?? false,
            'created_at' => $this->created_at,
        ];
    }
}
