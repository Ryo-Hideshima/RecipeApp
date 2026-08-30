"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Category, Paginated, Recipe } from "@/lib/types";
import { RecipeCard } from "@/components/RecipeCard";

type SearchType = "keyword" | "ingredient";

function RecipeListView() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const searchType: SearchType = params.get("ingredient") ? "ingredient" : "keyword";
  const term = params.get(searchType) ?? "";
  const categoryIds = (params.get("category_ids") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);

  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  // 入力中のローカル状態(URLへは検索実行時に反映)
  const [draftType, setDraftType] = useState<SearchType>(searchType);
  const [draftTerm, setDraftTerm] = useState(term);

  useEffect(() => {
    api
      .get<{ data: Category[] }>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const filterKey = `${searchType}:${term}:${categoryIds.join(",")}`;

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(undefined);
      try {
        const res = await api.get<Paginated<Recipe>>("/recipes", {
          [searchType]: term || undefined,
          category_ids: categoryIds.length ? categoryIds : undefined,
          page: nextPage,
        });
        setRecipes((prev) => (append ? [...prev, ...res.data] : res.data));
        setPage(res.meta.current_page);
        setLastPage(res.meta.last_page);
      } catch {
        setError("レシピの取得に失敗しました。");
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  );

  useEffect(() => {
    // フィルタ変更のたびに1ページ目から取り直す。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, false);
  }, [fetchPage]);

  function submitSearch(nextType: SearchType, nextTerm: string, nextCategories: number[]) {
    const q = new URLSearchParams();
    if (nextTerm.trim()) q.set(nextType, nextTerm.trim());
    if (nextCategories.length) q.set("category_ids", nextCategories.join(","));
    router.replace(q.toString() ? `/recipes?${q}` : "/recipes");
  }

  function toggleCategory(id: number) {
    const next = categoryIds.includes(id)
      ? categoryIds.filter((c) => c !== id)
      : [...categoryIds, id];
    submitSearch(searchType, term, next);
  }

  return (
    <div>
      <h1 className="mb-3 text-[22px] font-bold">レシピ一覧</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(draftType, draftTerm, categoryIds);
        }}
      >
        <select
          value={draftType}
          onChange={(e) => setDraftType(e.target.value as SearchType)}
          className="rounded-[10px] border border-line bg-white px-2 text-sm"
        >
          <option value="keyword">タイトル</option>
          <option value="ingredient">材料名</option>
        </select>
        <input
          value={draftTerm}
          onChange={(e) => setDraftTerm(e.target.value)}
          placeholder="キーワードで検索"
          className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[10px] bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent-strong"
        >
          検索
        </button>
      </form>

      <div className="my-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submitSearch(searchType, term, [])}
          className={chipClass(categoryIds.length === 0)}
        >
          すべて
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleCategory(c.id)}
            className={chipClass(categoryIds.includes(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      {user ? (
        <p className="mb-3">
          <Link
            href="/recipes/new"
            className="inline-block rounded-[8px] bg-accent px-3 py-1.5 text-[13px] font-bold text-white hover:bg-accent-strong"
          >
            ＋ レシピを投稿
          </Link>
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">読み込み中…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-accent-strong">{error}</p>
      ) : recipes.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">該当するレシピが見つかりません。</p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
          {page < lastPage ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => fetchPage(page + 1, true)}
                disabled={loadingMore}
                className="rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-accent disabled:opacity-60"
              >
                {loadingMore ? "読み込み中…" : "もっと見る"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function chipClass(active: boolean) {
  return [
    "rounded-full border px-3 py-1.5 text-[13px]",
    active ? "border-accent bg-accent text-white" : "border-line bg-chip text-muted hover:text-fg",
  ].join(" ");
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-muted">読み込み中…</p>}>
      <RecipeListView />
    </Suspense>
  );
}
