"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Category, Recipe } from "@/lib/types";

interface IngredientRow {
  name: string;
  quantity: string;
}

/** レシピ投稿・編集フォーム。initialRecipe があれば編集モード。 */
export function RecipeForm({ initialRecipe }: { initialRecipe?: Recipe }) {
  const router = useRouter();
  const editing = !!initialRecipe;
  const recipeId = initialRecipe?.id;

  const [title, setTitle] = useState(initialRecipe?.title ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialRecipe?.ingredients?.map((i) => ({ name: i.name, quantity: i.quantity ?? "" })) ?? [
      { name: "", quantity: "" },
    ],
  );
  const [steps, setSteps] = useState<string[]>(
    initialRecipe?.steps?.map((s) => s.description) ?? [""],
  );
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initialRecipe?.categories?.map((c) => c.id) ?? [],
  );
  const [categories, setCategories] = useState<Category[]>([]);

  const [existingImages, setExistingImages] = useState(initialRecipe?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ data: Category[] }>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  function fieldError(prefix: string): string | undefined {
    const key = Object.keys(errors).find((k) => k === prefix || k.startsWith(`${prefix}.`));
    return key ? errors[key] : undefined;
  }

  function toggleCategory(id: number) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function removeExistingImage(imageId: number) {
    if (!recipeId) return;
    try {
      await api.delete(`/recipes/${recipeId}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      /* noop */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(undefined);

    const payload = {
      title,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() || null })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      category_ids: categoryIds,
    };

    try {
      const res =
        editing && recipeId
          ? await api.put<{ data: Recipe }>(`/recipes/${recipeId}`, payload)
          : await api.post<{ data: Recipe }>("/recipes", payload);
      const id = res.data.id;

      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach((f) => fd.append("images[]", f));
        await api.post(`/recipes/${id}/images`, fd);
      }

      router.push(`/recipes/${id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(
          Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])),
        );
        if (Object.keys(err.errors).length === 0) setMessage(err.message);
        else setMessage("入力内容を確認してください。");
      } else {
        setMessage("保存に失敗しました。時間をおいて再度お試しください。");
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href={editing ? `/recipes/${recipeId}` : "/recipes"}
        className="mb-2.5 inline-block text-[13px] text-muted"
      >
        ← 戻る
      </Link>
      <h1 className="mb-4 text-[22px] font-bold">{editing ? "レシピを編集" : "レシピを投稿"}</h1>

      {message ? (
        <p className="mb-3 rounded-[10px] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {message}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-[13px] font-bold">タイトル</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        {fieldError("title") ? (
          <span className="mt-1 block text-xs text-accent-strong">{fieldError("title")}</span>
        ) : null}
      </label>

      <fieldset className="mt-4">
        <legend className="mb-1 text-[13px] font-bold">写真</legend>
        <div className="flex flex-wrap gap-2">
          {existingImages.map((img) => (
            <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-[10px] border border-line">
              {img.url ? <img src={img.url} alt="" className="h-full w-full object-cover" /> : null}
              <button
                type="button"
                onClick={() => removeExistingImage(img.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {newFiles.map((file, idx) => (
            <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-[10px] border border-line">
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="grid h-24 w-24 place-items-center rounded-[10px] border border-dashed border-line text-sm text-muted"
          >
            ＋ 追加
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>
        {fieldError("images") ? (
          <span className="mt-1 block text-xs text-accent-strong">{fieldError("images")}</span>
        ) : null}
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1 text-[13px] font-bold">カテゴリ(複数選択可)</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCategory(c.id)}
              className={[
                "rounded-full border px-3 py-1.5 text-[13px]",
                categoryIds.includes(c.id)
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-chip text-muted",
              ].join(" ")}
            >
              {c.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1 text-[13px] font-bold">材料</legend>
        {fieldError("ingredients") ? (
          <span className="mb-1 block text-xs text-accent-strong">{fieldError("ingredients")}</span>
        ) : null}
        <div className="space-y-1.5">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={ing.name}
                onChange={(e) =>
                  setIngredients((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)),
                  )
                }
                placeholder="材料名"
                className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                value={ing.quantity}
                onChange={(e) =>
                  setIngredients((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r)),
                  )
                }
                placeholder="分量"
                className="w-28 shrink-0 rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                className="shrink-0 rounded-[8px] border border-line bg-white px-2.5 py-2 text-[13px]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { name: "", quantity: "" }])}
          className="mt-2 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px]"
        >
          ＋ 材料を追加
        </button>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1 text-[13px] font-bold">手順</legend>
        {fieldError("steps") ? (
          <span className="mb-1 block text-xs text-accent-strong">{fieldError("steps")}</span>
        ) : null}
        <div className="space-y-1.5">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="pt-2 text-sm text-muted">{idx + 1}.</span>
              <textarea
                value={step}
                onChange={(e) =>
                  setSteps((prev) => prev.map((s, i) => (i === idx ? e.target.value : s)))
                }
                rows={2}
                className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                className="shrink-0 rounded-[8px] border border-line bg-white px-2.5 py-2 text-[13px]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, ""])}
          className="mt-2 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px]"
        >
          ＋ 手順を追加
        </button>
      </fieldset>

      <div className="mt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[10px] bg-accent px-5 py-2.5 font-bold text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
      </div>
    </form>
  );
}
