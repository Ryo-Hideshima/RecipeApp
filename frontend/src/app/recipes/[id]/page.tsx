"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Comment, Paginated, Recipe } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/format";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  const [favBusy, setFavBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [r, c] = await Promise.all([
        api.get<{ data: Recipe }>(`/recipes/${id}`),
        api.get<Paginated<Comment>>(`/recipes/${id}/comments`),
      ]);
      setRecipe(r.data);
      setComments(c.data);
      setStatus("ready");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleFavorite() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/recipes/${id}`)}`);
      return;
    }
    if (!recipe) return;
    setFavBusy(true);
    try {
      const res = await api[recipe.is_favorited ? "delete" : "post"]<{
        favorites_count: number;
        is_favorited: boolean;
      }>(`/recipes/${id}/favorite`);
      setRecipe({ ...recipe, favorites_count: res.favorites_count, is_favorited: res.is_favorited });
    } catch {
      /* 失敗時はそのまま */
    } finally {
      setFavBusy(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    setCommentBusy(true);
    try {
      const res = await api.post<{ data: Comment }>(`/recipes/${id}/comments`, { content });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      if (recipe) setRecipe({ ...recipe, comments_count: (recipe.comments_count ?? 0) + 1 });
    } catch {
      /* noop */
    } finally {
      setCommentBusy(false);
    }
  }

  async function deleteComment(commentId: number) {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (recipe) {
        setRecipe({ ...recipe, comments_count: Math.max(0, (recipe.comments_count ?? 1) - 1) });
      }
    } catch {
      /* noop */
    }
  }

  async function deleteRecipe() {
    if (!confirm("このレシピを削除しますか?")) return;
    setDeleting(true);
    try {
      await api.delete(`/recipes/${id}`);
      router.push("/recipes");
    } catch {
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return <p className="py-16 text-center text-sm text-muted">読み込み中…</p>;
  }
  if (status === "notfound") {
    return (
      <div className="py-16 text-center text-sm text-muted">
        <p>レシピが見つかりません。</p>
        <Link href="/recipes" className="mt-2 inline-block text-accent-strong">
          一覧へ戻る
        </Link>
      </div>
    );
  }
  if (status === "error" || !recipe) {
    return <p className="py-16 text-center text-sm text-accent-strong">読み込みに失敗しました。</p>;
  }

  const isOwner = !!user && recipe.user?.id === user.id;

  return (
    <article>
      <Link href="/recipes" className="mb-2.5 inline-block text-[13px] text-muted">
        ← 一覧へ戻る
      </Link>

      <div className="mb-3.5 grid gap-2 sm:grid-cols-2">
        {(recipe.images ?? []).length > 0 ? (
          recipe.images!.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-[14px] bg-gradient-to-br from-[#f3c9a8] to-accent">
              {img.url ? (
                <img src={img.url} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="aspect-[16/10]" />
              )}
            </div>
          ))
        ) : (
          <div className="aspect-[16/10] rounded-[14px] bg-gradient-to-br from-[#f3c9a8] to-accent sm:col-span-2" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[22px] font-bold">{recipe.title}</h1>
        {isOwner ? (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px]"
            >
              編集
            </Link>
            <button
              type="button"
              onClick={deleteRecipe}
              disabled={deleting}
              className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px] disabled:opacity-60"
            >
              削除
            </button>
          </div>
        ) : null}
      </div>

      <div className="my-2.5 flex flex-wrap gap-2">
        {(recipe.categories ?? []).map((c) => (
          <span key={c.id} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-muted">
            {c.name}
          </span>
        ))}
      </div>

      {recipe.user ? (
        <Link href={`/users/${recipe.user.id}`} className="my-3 flex items-center gap-3">
          <Avatar src={recipe.user.avatar_url} name={recipe.user.name} size="sm" />
          <b>{recipe.user.name}</b>
        </Link>
      ) : null}

      <button
        type="button"
        onClick={toggleFavorite}
        disabled={favBusy}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-bold disabled:opacity-60",
          recipe.is_favorited
            ? "border-accent bg-[#ffe9e0] text-accent-strong"
            : "border-line bg-white",
        ].join(" ")}
      >
        {recipe.is_favorited ? "♥ お気に入り済み" : "♡ お気に入り"} ({recipe.favorites_count ?? 0})
      </button>

      <h2 className="mb-1.5 mt-6 text-base font-bold">材料</h2>
      <ul>
        {(recipe.ingredients ?? []).map((ing, i) => (
          <li key={i} className="flex justify-between border-b border-dashed border-line py-1.5">
            <span>{ing.name}</span>
            <span className="text-muted">{ing.quantity}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-1.5 mt-6 text-base font-bold">手順</h2>
      <ol className="space-y-0">
        {(recipe.steps ?? []).map((step) => (
          <li key={step.step_number} className="flex gap-3 border-b border-line py-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-white">
              {step.step_number}
            </span>
            <span>{step.description}</span>
          </li>
        ))}
      </ol>

      <h2 className="mb-1.5 mt-6 text-base font-bold">コメント ({recipe.comments_count ?? comments.length})</h2>
      {user ? (
        <form onSubmit={submitComment} className="mb-1 flex items-end gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="コメントを書く"
            maxLength={200}
            className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={commentBusy}
            className="shrink-0 rounded-[8px] bg-accent px-3 py-2 text-[13px] font-bold text-white hover:bg-accent-strong disabled:opacity-60"
          >
            送信
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          コメントするには{" "}
          <Link href="/login" className="text-accent-strong">
            ログイン
          </Link>{" "}
          が必要です
        </p>
      )}

      {comments.length === 0 ? (
        <p className="py-3 text-sm text-muted">まだコメントはありません</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 border-b border-line py-3">
            <Avatar src={c.user?.avatar_url} name={c.user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                {c.user ? (
                  <Link href={`/users/${c.user.id}`} className="font-bold">
                    {c.user.name}
                  </Link>
                ) : (
                  <span className="font-bold">退会ユーザー</span>
                )}
                <span className="flex items-center gap-2 text-xs text-muted">
                  {formatDate(c.created_at)}
                  {user && c.user?.id === user.id ? (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="text-accent-strong"
                    >
                      削除
                    </button>
                  ) : null}
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words">{c.content}</div>
            </div>
          </div>
        ))
      )}
    </article>
  );
}
