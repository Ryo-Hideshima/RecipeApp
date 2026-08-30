// Laravel API との通信をまとめた薄いクライアント。
// - ベースURLは NEXT_PUBLIC_API_URL
// - Bearer トークンは localStorage("recipe.token") から自動付与
// - 失敗時は ApiError を throw(422 の場合は errors にフィールド別メッセージ)

import type { Paginated } from "./types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

const TOKEN_KEY = "recipe.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage 不可の環境では何もしない */
  }
}

export type ValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors: ValidationErrors;

  constructor(status: number, message: string, errors: ValidationErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** フィールドの最初のエラーメッセージ。 */
  first(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON ボディ。FormData を渡した場合はそのまま送る。 */
  body?: unknown;
  /** クエリパラメータ。配列は key[]=v で展開。 */
  query?: Record<string, string | number | boolean | Array<string | number> | undefined | null>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(`${key}[]`, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    signal,
    body:
      body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (payload && payload.message) || `リクエストに失敗しました (${res.status})`,
      (payload && payload.errors) || {},
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    apiFetch<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "DELETE", body }),
};

export type { Paginated };
