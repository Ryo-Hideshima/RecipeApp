"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Profile, UserSummary } from "@/lib/types";
import { UserRow } from "@/components/UserRow";
import { LoadMore } from "@/components/LoadMore";
import { usePaginatedList } from "@/lib/usePaginatedList";

/** /users/[id]/following と /followers で共通の一覧ビュー。 */
export function FollowListView({ kind }: { kind: "following" | "followers" }) {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Profile | null>(null);
  const [subjectError, setSubjectError] = useState(false);

  const loadSubject = useCallback(async () => {
    try {
      const res = await api.get<{ data: Profile }>(`/users/${id}`);
      setSubject(res.data);
    } catch (err) {
      setSubjectError(err instanceof ApiError);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubject();
  }, [loadSubject]);

  const { items, loading, loadingMore, error, hasMore, loadMore } = usePaginatedList<
    UserSummary
  >(`/users/${id}/${kind}`);

  const heading = kind === "followers" ? "フォロワー" : "フォロー中";

  if (subjectError) {
    return <p className="py-16 text-center text-sm text-muted">ユーザーが見つかりません。</p>;
  }

  return (
    <div>
      {subject ? (
        <Link href={`/users/${subject.id}`} className="mb-2.5 inline-block text-[13px] text-muted">
          ← {subject.name} のプロフィール
        </Link>
      ) : null}
      <h1 className="mb-3 text-[22px] font-bold">{heading}</h1>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">読み込み中…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-accent-strong">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">ユーザーがいません。</p>
      ) : (
        <>
          {items.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
          <LoadMore show={hasMore} loading={loadingMore} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
