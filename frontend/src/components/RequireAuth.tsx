"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * 認証必須ページのラッパー。未ログインなら /login へ退避する。
 * 認証確認中とリダイレクト中は控えめなプレースホルダを表示する。
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return <p className="py-16 text-center text-sm text-muted">読み込み中…</p>;
  }

  return <>{children}</>;
}
