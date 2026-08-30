"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { RecipeForm } from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <RequireAuth>
      <RecipeForm />
    </RequireAuth>
  );
}
