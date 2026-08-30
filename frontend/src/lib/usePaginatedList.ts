"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Paginated } from "./types";

type Query = Record<string, string | number | boolean | Array<string | number> | undefined | null>;

/**
 * `{data, links, meta}` を返すエンドポイント用の一覧フック。
 * 「もっと見る」でページを繋いで表示する。query を変えると1ページ目から取り直す。
 */
export function usePaginatedList<T>(path: string, query: Query = {}, enabled = true) {
  const queryKey = JSON.stringify(query);

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [fetching, setFetching] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setFetching(true);
      setError(undefined);
      try {
        const res = await api.get<Paginated<T>>(path, {
          ...(JSON.parse(queryKey) as Query),
          page: nextPage,
        });
        setItems((prev) => (append ? [...prev, ...res.data] : res.data));
        setPage(res.meta.current_page);
        setLastPage(res.meta.last_page);
      } catch {
        setError("読み込みに失敗しました。");
      } finally {
        if (append) setLoadingMore(false);
        else setFetching(false);
      }
    },
    [path, queryKey],
  );

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, false);
  }, [fetchPage, enabled]);

  return {
    items: enabled ? items : [],
    loading: enabled && fetching,
    loadingMore,
    error: enabled ? error : undefined,
    hasMore: enabled && page < lastPage,
    loadMore: () => fetchPage(page + 1, true),
  };
}
