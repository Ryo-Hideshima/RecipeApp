"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const linkClass = (active: boolean) =>
  [
    "rounded-full px-3 py-1.5 text-[13px] transition-colors",
    active ? "bg-accent text-white" : "text-muted hover:text-fg",
  ].join(" ");

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/recipes" ? pathname === "/" || pathname.startsWith("/recipes") : pathname.startsWith(href);

  async function handleLogout() {
    await logout();
    router.push("/recipes");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
        <Link href="/recipes" className="text-lg font-extrabold tracking-wide text-accent-strong">
          🍳 Recipe
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-1.5">
          <Link href="/recipes" className={linkClass(isActive("/recipes"))}>
            レシピ
          </Link>
          {loading ? null : user ? (
            <>
              <Link href="/recipes/new" className={linkClass(isActive("/recipes/new"))}>
                投稿
              </Link>
              <Link href="/users" className={linkClass(isActive("/users"))}>
                ユーザー検索
              </Link>
              <Link href="/favorites" className={linkClass(isActive("/favorites"))}>
                お気に入り
              </Link>
              <Link href={`/users/${user.id}`} className={linkClass(isActive(`/users/${user.id}`))}>
                マイページ
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3 py-1.5 text-[13px] text-muted hover:text-fg"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass(isActive("/login"))}>
                ログイン
              </Link>
              <Link href="/register" className={linkClass(isActive("/register"))}>
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
