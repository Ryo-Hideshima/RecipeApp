<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserSummaryResource;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    /**
     * {user} がフォロー中のユーザー一覧（フォローした日時の新着順）。
     */
    public function following(Request $request, User $user): AnonymousResourceCollection
    {
        $users = $user->following()
            ->withCount(['following', 'followers'])
            ->withIsFollowedBy($request->user())
            ->orderByPivot('created_at', 'desc')
            ->paginate(20);

        return UserSummaryResource::collection($users);
    }

    /**
     * {user} のフォロワー一覧（フォローされた日時の新着順）。
     */
    public function followers(Request $request, User $user): AnonymousResourceCollection
    {
        $users = $user->followers()
            ->withCount(['following', 'followers'])
            ->withIsFollowedBy($request->user())
            ->orderByPivot('created_at', 'desc')
            ->paginate(20);

        return UserSummaryResource::collection($users);
    }

    public function store(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => ['自分自身をフォローすることはできません。'],
            ]);
        }

        Follow::firstOrCreate([
            'follower_id' => $request->user()->id,
            'followee_id' => $user->id,
        ]);

        return $this->stateResponse($request, $user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        Follow::where('follower_id', $request->user()->id)
            ->where('followee_id', $user->id)
            ->delete();

        return $this->stateResponse($request, $user);
    }

    private function stateResponse(Request $request, User $user): JsonResponse
    {
        return response()->json([
            'is_following' => $request->user()->following()->whereKey($user->id)->exists(),
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
        ]);
    }
}
