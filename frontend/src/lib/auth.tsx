"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";
import type { AuthResponse, AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  /** 起動時の GET /user が完了するまで true。 */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** プロフィール更新後などにローカルの user を差し替える。 */
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // トークンが無ければ API を叩かずに未ログイン確定
      if (!getToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await api.get<{ data: AuthUser }>("/user");
        if (!cancelled) setUserState(me.data);
      } catch {
        if (!cancelled) {
          setToken(null);
          setUserState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuth = useCallback((res: AuthResponse) => {
    setToken(res.token);
    setUserState(res.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      applyAuth(await api.post<AuthResponse>("/login", { email, password }));
    },
    [applyAuth],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      applyAuth(await api.post<AuthResponse>("/register", { name, email, password }));
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      /* トークンが既に無効でもクライアント側はログアウト扱いにする */
    }
    setToken(null);
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, setUser: setUserState }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は <AuthProvider> の内側で使ってください");
  return ctx;
}
