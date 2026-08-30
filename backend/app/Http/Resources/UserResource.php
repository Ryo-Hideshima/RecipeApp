<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'bio' => $this->bio,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => MediaStorage::url($this->avatar_path),
            'created_at' => $this->created_at,
        ];
    }
}
