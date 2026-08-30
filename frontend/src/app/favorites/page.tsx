"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { RecipeCard } from "@/components/RecipeCard";
import { LoadMore } from "@/components/LoadMore";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { Recipe } from "@/lib/types";

function FavoritesView() {
  const { items, loading, loadingMore, error, hasMore, loadMore } =
    usePaginatedList<Recipe>("/favorites");

  return (
    <div>
      <h1 className="mb-3 text-[22px] font-bold">お気に入り一覧</h1>
      {loading ? (
        <p className="py-16 text-center text-sm text-muted">読み込み中…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-accent-strong">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          お気に入り登録したレシピはまだありません。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {items.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
          <LoadMore show={hasMore} loading={loadingMore} onClick={loadMore} />
        </>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesView />
    </RequireAuth>
  );
}
