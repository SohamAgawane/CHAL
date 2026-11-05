import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, tokenStore } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import type { User } from "@/types";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  city: string;
  avatar?: File | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStore.get()));

  const reset = useCallback(() => {
    tokenStore.clear();
    disconnectSocket();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    api.auth
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && tokenStore.clear())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.addEventListener("chal:logout", reset);
    return () => window.removeEventListener("chal:logout", reset);
  }, [reset]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: me, accessToken } = await api.auth.login(email, password);
    tokenStore.set(accessToken);
    setUser(me);
  }, []);

  const register = useCallback(
    async ({ name, email, password, city, avatar }: RegisterInput) => {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("password", password);
      form.append("city", city);
      if (avatar) form.append("avatar", avatar);
      await api.auth.register(form);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* session is cleared locally either way */
    }
    reset();
  }, [reset]);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
