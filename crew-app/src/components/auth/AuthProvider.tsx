"use client";

import { createContext, useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "crew_token";

type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  profileImage: string | null;
  role: "admin" | "member";
  biometricEnabled: boolean | null;
};

type LoginResult = { success: true; user: AuthUser; token: string } | { success: false; error: string };
type RegisterResult = LoginResult;

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, nickname: string, characterBase?: "male" | "female") => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthHeader: () => Record<string, string>;
  setTokenAndUser: (token: string) => Promise<boolean>;
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
    // "매번 로그인" 선택 시: 새 세션이면 토큰 제거
    const noAutoLogin = localStorage.getItem("crew_no_auto_login");
    const sessionActive = sessionStorage.getItem("crew_active");
    if (noAutoLogin && !sessionActive) {
      // 새 세션 (앱 재시작) → 토큰 제거
      localStorage.removeItem(TOKEN_KEY);
    }
    sessionStorage.setItem("crew_active", "true");

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
        return { success: true, user: newUser, token: newToken };
      } catch {
        return { success: false, error: "네트워크 오류가 발생했습니다." };
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, nickname: string, characterBase?: "male" | "female"): Promise<RegisterResult> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nickname, characterBase }),
        });
        const json = await res.json();

        if (!json.success) {
          return { success: false, error: json.error ?? "회원가입 실패" };
        }

        const { token: newToken, user: newUser } = json.data;
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser, token: newToken };
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

  // 소셜 로그인 콜백용: 토큰을 받아서 저장 + 유저 정보 조회
  const setTokenAndUser = useCallback(
    async (newToken: string): Promise<boolean> => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      const u = await fetchMe(newToken);
      if (u) {
        setUser(u);
        return true;
      }
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      return false;
    },
    [fetchMe]
  );

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
        setTokenAndUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
