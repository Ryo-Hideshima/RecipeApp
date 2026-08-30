"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserSummary } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

/** ユーザー一覧の1行(アイコン・表示名・フォローボタン)。検索/フォロー一覧で共通利用。 */
export function UserRow({ user: initial }: { user: UserSummary }) {
  const { user: me } = useAuth();
  const [following, setFollowing] = useState(!!initial.is_following);
  const [busy, setBusy] = useState(false);

  const isSelf = me?.id === initial.id;

  async function toggle() {
    setBusy(true);
    try {
      const res = await api[following ? "delete" : "post"]<{ is_following: boolean }>(
        `/users/${initial.id}/follow`,
      );
      setFollowing(res.is_following);
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-line py-3">
      <Link href={`/users/${initial.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={initial.avatar_url} name={initial.name} size="md" />
        <span className="truncate font-bold">{initial.name}</span>
      </Link>
      {isSelf ? null : (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={[
            "shrink-0 rounded-[8px] px-3 py-1.5 text-[13px] font-bold disabled:opacity-60",
            following ? "border border-line bg-white" : "bg-accent text-white hover:bg-accent-strong",
          ].join(" ")}
        >
          {following ? "フォロー中" : "＋ フォロー"}
        </button>
      )}
    </div>
  );
}
