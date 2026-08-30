"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Recipe } from "@/lib/types";
import { RequireAuth } from "@/components/RequireAuth";
import { RecipeForm } from "@/components/RecipeForm";

function EditRecipeLoader() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await api.get<{ data: Recipe }>(`/recipes/${id}`);
      if (user && res.data.user?.id !== user.id) {
        router.replace(`/recipes/${id}`);
        return;
      }
      setRecipe(res.data);
      setStatus("ready");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }, [id, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (status === "loading") {
    return <p className="py-16 text-center text-sm text-muted">読み込み中…</p>;
  }
  if (status === "notfound") {
    return (
      <div className="py-16 text-center text-sm text-muted">
        <p>レシピが見つかりません。</p>
        <Link href="/recipes" className="mt-2 inline-block text-accent-strong">
          一覧へ戻る
        </Link>
      </div>
    );
  }
  if (status === "error" || !recipe) {
    return <p className="py-16 text-center text-sm text-accent-strong">読み込みに失敗しました。</p>;
  }

  return <RecipeForm initialRecipe={recipe} />;
}

export default function EditRecipePage() {
  return (
    <RequireAuth>
      <EditRecipeLoader />
    </RequireAuth>
  );
}
