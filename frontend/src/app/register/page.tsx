"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormError, FormField, SubmitButton, TextInput } from "@/components/form";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/recipes");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(undefined);
    try {
      await register(name, email, password);
      router.replace("/recipes");
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
      <h1 className="mb-4 text-center text-xl font-bold">新規登録</h1>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            required
          />
        </FormField>
        <FormField label="表示名" error={errors.name}>
          <TextInput
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <div className="pt-2">
          <SubmitButton pending={pending}>登録する</SubmitButton>
        </div>
      </form>
      <p className="mt-4 text-center text-[13px] text-muted">
        すでに登録済みの方は{" "}
        <Link href="/login" className="font-bold text-accent-strong">
          ログイン
        </Link>
      </p>
    </div>
  );
}
