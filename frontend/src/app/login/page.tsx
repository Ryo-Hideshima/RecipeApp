"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormError, FormField, SubmitButton, TextInput } from "@/components/form";

function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/recipes";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(undefined);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(
          Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])),
        );
        if (Object.keys(err.errors).length === 0) setMessage(err.message);
      } else {
        setMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-[6vh] max-w-sm rounded-[14px] border border-line bg-white p-7">
      <h1 className="mb-4 text-center text-xl font-bold">ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormError message={message} />
        <FormField label="メールアドレス" error={errors.email}>
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="パスワード" error={errors.password}>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <div className="pt-2">
          <SubmitButton pending={pending}>ログイン</SubmitButton>
        </div>
      </form>
      <p className="mt-4 text-center text-[13px] text-muted">
        アカウントがない方は{" "}
        <Link href="/register" className="font-bold text-accent-strong">
          新規登録
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-muted">読み込み中…</p>}>
      <LoginForm />
    </Suspense>
  );
}
