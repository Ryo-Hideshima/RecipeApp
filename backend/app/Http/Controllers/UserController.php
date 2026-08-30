<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\SearchUserRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\RecipeResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    /**
     * 表示名の部分一致でユーザーを検索する（大文字小文字を区別しない）。
     */
    public function index(SearchUserRequest $request): AnonymousResourceCollection
    {
        $keyword = $request->validated('keyword');

        $users = User::query()
            ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($keyword).'%'])
            ->withCount(['following', 'followers'])
            ->withIsFollowedBy($request->user())
            ->orderBy('name')
            ->paginate(20);

        return UserSummaryResource::collection($users);
    }

    public function show(Request $request, User $user): ProfileResource
    {
        $user->loadCount(['recipes', 'following', 'followers']);

        if ($viewer = $request->user()) {
            $user->setAttribute(
                'is_following',
                $viewer->following()->whereKey($user->id)->exists(),
            );
        }

        return new ProfileResource($user);
    }

    /**
     * 指定ユーザーの投稿レシピを新着順で一覧する。
     */
    public function recipes(Request $request, User $user): AnonymousResourceCollection
    {
        $recipes = $user->recipes()
            ->with(['user', 'categories', 'images'])
            ->withCount(['favorites', 'comments'])
            ->withIsFavorited($request->user())
            ->latest()
            ->paginate(15);

        return RecipeResource::collection($recipes);
    }
}
