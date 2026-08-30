<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Resources\UserResource;

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
}
