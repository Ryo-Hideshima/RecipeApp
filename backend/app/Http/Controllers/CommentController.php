<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    /**
     * レシピのコメントを投稿日時の昇順（スレッド順）で一覧。
     */
    public function index(Recipe $recipe): AnonymousResourceCollection
    {
        $comments = $recipe->comments()
            ->with('user')
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate(20);

        return CommentResource::collection($comments);
    }

    public function store(StoreCommentRequest $request, Recipe $recipe): JsonResponse
    {
        $comment = $recipe->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $request->validated('content'),
        ]);

        return (new CommentResource($comment->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'コメントを削除しました。']);
    }
}
