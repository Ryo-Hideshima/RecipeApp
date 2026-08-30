"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/Avatar";
import { FormError, FormField, SubmitButton, TextInput } from "@/components/form";

function ProfileSettings() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(undefined);
    try {
      const res = await api.patch<{ data: AuthUser }>("/profile", { name, bio: bio || null });
      setUser(res.data);
      router.push(`/users/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
        if (Object.keys(err.errors).length === 0) setMessage(err.message);
      } else {
        setMessage("保存に失敗しました。");
      }
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    setMessage(undefined);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post<{ data: AuthUser }>("/profile/avatar", fd);
      setUser(res.data);
    } catch (err) {
      setMessage(err instanceof ApiError ? (err.first("avatar") ?? err.message) : "アップロードに失敗しました。");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    try {
      const res = await api.delete<{ data: AuthUser }>("/profile/avatar");
      setUser(res.data);
    } catch {
      /* noop */
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-[22px] font-bold">プロフィール編集</h1>

      <div className="mb-5 flex items-center gap-4">
        <Avatar src={user?.avatar_url} name={user?.name} size="lg" />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={avatarBusy}
            className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px] disabled:opacity-60"
          >
            画像を変更
          </button>
          {user?.avatar_path ? (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={avatarBusy}
              className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13px] text-muted disabled:opacity-60"
            >
              画像を削除
            </button>
          ) : null}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <FormError message={message} />
        <FormField label="表示名" error={errors.name}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
        </FormField>
        <FormField label="自己紹介" error={errors.bio}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </FormField>
        <div className="pt-2">
          <SubmitButton pending={saving}>保存する</SubmitButton>
        </div>
      </form>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <RequireAuth>
      <ProfileSettings />
    </RequireAuth>
  );
}
