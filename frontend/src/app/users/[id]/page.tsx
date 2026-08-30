"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Paginated, Profile, Recipe } from "@/lib/types";
import { RequireAuth } from "@/components/RequireAuth";
import { RecipeCard } from "@/components/RecipeCard";
import { Avatar } from "@/components/Avatar";

function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [p, r] = await Promise.all([
        api.get<{ data: Profile }>(`/users/${id}`),
        api.get<Paginated<Recipe>>(`/users/${id}/recipes`),
      ]);
      setProfile(p.data);
      setRecipes(r.data);
      setStatus("ready");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleFollow() {
    if (!profile) return;
    setFollowBusy(true);
    try {
      const res = await api[profile.is_following ? "delete" : "post"]<{
        is_following: boolean;
        followers_count: number;
        following_count: number;
      }>(`/users/${id}/follow`);
      setProfile({
        ...profile,
        is_following: res.is_following,
        followers_count: res.followers_count,
        following_count: res.following_count,
      });
    } catch {
      /* noop */
    } finally {
      setFollowBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="py-16 text-center text-sm text-muted">読み込み中…</p>;
  }
  if (status === "notfound") {
    return <p className="py-16 text-center text-sm text-muted">ユーザーが見つかりません。</p>;
  }
  if (status === "error" || !profile) {
    return <p className="py-16 text-center text-sm text-accent-strong">読み込みに失敗しました。</p>;
  }

  const isMe = profile.is_me || profile.id === user?.id;

  return (
    <div>
      <div className="flex items-start gap-4">
        <Avatar src={profile.avatar_url} name={profile.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold">{profile.name}</h1>
          {profile.bio ? <p className="text-sm text-muted">{profile.bio}</p> : null}
        </div>
      </div>

      <div className="my-3 flex gap-6 text-sm">
        <Link href={`/users/${profile.id}/following`}>
          <b>{profile.following_count}</b> <span className="text-muted">フォロー中</span>
        </Link>
        <Link href={`/users/${profile.id}/followers`}>
          <b>{profile.followers_count}</b> <span className="text-muted">フォロワー</span>
        </Link>
      </div>

      {isMe ? (
        <div className="flex gap-2">
          <Link
            href="/settings/profile"
            className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px]"
          >
            プロフィール編集
          </Link>
          <Link
            href="/favorites"
            className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px]"
          >
            お気に入り一覧
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleFollow}
          disabled={followBusy}
          className={[
            "rounded-[8px] px-3 py-1.5 text-[13px] font-bold disabled:opacity-60",
            profile.is_following
              ? "border border-line bg-white"
              : "bg-accent text-white hover:bg-accent-strong",
          ].join(" ")}
        >
          {profile.is_following ? "フォロー中" : "＋ フォロー"}
        </button>
      )}

      <h2 className="mb-2 mt-6 text-base font-bold">投稿レシピ ({profile.recipes_count})</h2>
      {recipes.length === 0 ? (
        <p className="text-sm text-muted">まだ投稿がありません。</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <RequireAuth>
      <ProfileView />
    </RequireAuth>
  );
}
