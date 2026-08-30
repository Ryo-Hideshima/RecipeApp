<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 公開向けのユーザー要約（メールアドレスなどは含めない）。
 *
 * @mixin User
 */
class UserSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar_path' => $this->avatar_path,
            'following_count' => $this->whenCounted('following'),
            'followers_count' => $this->whenCounted('followers'),
            'is_following' => $this->when(
                ! is_null($this->is_following),
                fn () => (bool) $this->is_following,
            ),
        ];
    }
}
