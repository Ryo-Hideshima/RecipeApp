"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-bold">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-accent-strong">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm text-fg",
        "outline-none focus:border-accent",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function SubmitButton({
  children,
  pending,
  ...props
}: InputHTMLAttributes<HTMLButtonElement> & { pending?: boolean; children: ReactNode }) {
  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className="w-full rounded-[10px] bg-accent px-4 py-2.5 font-bold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
    >
      {pending ? "送信中…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-[10px] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-strong">
      {message}
    </p>
  );
}
