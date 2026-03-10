"use client";

import { createContext, useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "lifesync_token";

type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  profileImage: string | null;
  role: "admin" | "user";
  biometricEnabled: boolean | null;
};

type LoginResult = { success: true; user: AuthUser } | { success: false; error: string };
type RegisterResult = LoginResult;

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, nickname: string, profileImage?: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthHeader: () => Record<string, string>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 토큰으로 사용자 정보 조회
  const fetchMe = useCallback(async (sessionToken: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const json = await res.json();
      if (json.success) return json.data.user;
      return null;
    } catch {
      return null;
    }
  }, []);

  // 앱 시작 시 localStorage 토큰으로 자동 로그인
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    setToken(stored);
    fetchMe(stored).then((u) => {
      if (u) {
        setUser(u);
      } else {
        // 토큰 만료 또는 무효
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setIsLoading(false);
    });
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();

        if (!json.success) {
          return { success: false, error: json.error ?? "로그인 실패" };
        }

        const { token: newToken, user: newUser } = json.data;
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser };
      } catch {
        return { success: false, error: "네트워크 오류가 발생했습니다." };
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, nickname: string, profileImage?: string): Promise<RegisterResult> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nickname, profileImage }),
        });
        const json = await res.json();

        if (!json.success) {
          return { success: false, error: json.error ?? "회원가입 실패" };
        }

        const { token: newToken, user: newUser } = json.data;
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser };
      } catch {
        return { success: false, error: "네트워크 오류가 발생했습니다." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {}); // 실패해도 로컬에서 삭제
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;
    const updated = await fetchMe(currentToken);
    if (updated) setUser(updated);
  }, [fetchMe]);

  // API 호출 시 Authorization 헤더 생성 헬퍼
  const getAuthHeader = useCallback((): Record<string, string> => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
