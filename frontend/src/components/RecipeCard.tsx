import Link from "next/link";
import type { Recipe } from "@/lib/types";

/** レシピカード。一覧・お気に入り・プロフィールで共通利用する。 */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const thumb = recipe.images?.[0]?.url ?? null;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-[#f3c9a8] to-accent">
        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="px-3 py-2.5">
        <div className="line-clamp-2 text-[15px] font-bold">{recipe.title}</div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
          <span className="truncate">{recipe.user ? `@${recipe.user.name}` : ""}</span>
          <span className="shrink-0">
            ♡ {recipe.favorites_count ?? 0}・💬 {recipe.comments_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
