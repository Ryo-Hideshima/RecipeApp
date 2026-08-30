"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { UserRow } from "@/components/UserRow";
import { LoadMore } from "@/components/LoadMore";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { UserSummary } from "@/lib/types";

function UserSearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const keyword = params.get("keyword") ?? "";

  const [draft, setDraft] = useState(keyword);

  const { items, loading, loadingMore, error, hasMore, loadMore } = usePaginatedList<UserSummary>(
    "/users",
    { keyword },
    keyword.trim().length > 0,
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = draft.trim();
    router.replace(q ? `/users?keyword=${encodeURIComponent(q)}` : "/users");
  }

  return (
    <div>
      <h1 className="mb-3 text-[22px] font-bold">ユーザー検索</h1>
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="表示名で検索"
          className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-[10px] bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent-strong disabled:opacity-60"
        >
          検索
        </button>
      </form>

      {keyword.trim().length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">表示名を入力して検索してください。</p>
      ) : loading ? (
        <p className="py-16 text-center text-sm text-muted">読み込み中…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-accent-strong">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">該当するユーザーが見つかりません。</p>
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

export default function UserSearchPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="py-16 text-center text-sm text-muted">読み込み中…</p>}>
        <UserSearchView />
      </Suspense>
    </RequireAuth>
  );
}
