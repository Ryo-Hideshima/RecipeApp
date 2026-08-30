<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UpdateAvatarRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Support\MediaStorage;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * ログイン中ユーザー自身のプロフィール（表示名・自己紹介）を更新する。
     */
    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->safe()->only('name', 'bio'));

        return new UserResource($user);
    }

    /**
     * アイコン画像をアップロードする。既存アイコンは差し替えて削除する。
     */
    public function updateAvatar(UpdateAvatarRequest $request): UserResource
    {
        $user = $request->user();

        MediaStorage::delete($user->avatar_path);
        $user->update([
            'avatar_path' => MediaStorage::store($request->file('avatar'), 'avatars'),
        ]);

        return new UserResource($user);
    }

    /**
     * アイコン画像を解除する。
     */
    public function destroyAvatar(Request $request): UserResource
    {
        $user = $request->user();

        MediaStorage::delete($user->avatar_path);
        $user->update(['avatar_path' => null]);

        return new UserResource($user);
    }
}
