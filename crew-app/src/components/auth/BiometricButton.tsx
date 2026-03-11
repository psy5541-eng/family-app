"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BIOMETRIC_TOKEN_KEY = "crew_biometric_token";
// Capacitor 플러그인 패키지명 — 문자열 연결으로 webpack/esbuild 정적 분석에서 제외
const BIOMETRIC_PLUGIN_ID = ["@capacitor-community", "biometric-auth"].join("/");

/**
 * 지문/Face ID 인증 버튼
 * - Capacitor 환경: @capacitor-community/biometric-auth 플러그인 사용
 * - 웹 환경: 자동 숨김 (isAvailable = false)
 */
export default function BiometricButton() {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlugin = useCallback(() => {
    // webpackIgnore: true → webpack이 이 import를 번들에 포함하지 않음
    // 런타임에서 Capacitor가 해당 모듈을 제공함
    return import(/* webpackIgnore: true */ BIOMETRIC_PLUGIN_ID);
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const isCapacitor = typeof window !== "undefined" && "Capacitor" in window;
      if (!isCapacitor) return;

      const storedToken = localStorage.getItem(BIOMETRIC_TOKEN_KEY);
      if (!storedToken) return;

      const { BiometricAuth } = await loadPlugin();
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
    } catch {
      setIsAvailable(false);
    }
  }, [loadPlugin]);

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  async function handleBiometricAuth() {
    setIsLoading(true);
    setError(null);

    try {
      const { BiometricAuth } = await loadPlugin();

      await BiometricAuth.authenticate({
        reason: "RunningCrew 로그인",
        title: "생체 인증",
        subtitle: "지문 또는 Face ID로 로그인",
        cancelTitle: "취소",
      });

      const storedToken = localStorage.getItem(BIOMETRIC_TOKEN_KEY);
      if (!storedToken) {
        setError("저장된 인증 정보가 없습니다. 먼저 이메일로 로그인하세요.");
        return;
      }

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        localStorage.setItem("crew_token", storedToken);
        router.replace("/dashboard");
      } else {
        localStorage.removeItem(BIOMETRIC_TOKEN_KEY);
        setError("인증이 만료되었습니다. 이메일로 다시 로그인해주세요.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("cancel")) return;
      setError("생체 인증에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAvailable) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <button
        onClick={handleBiometricAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading ? "인증 중..." : "지문 / Face ID로 로그인"}
        </span>
      </button>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
