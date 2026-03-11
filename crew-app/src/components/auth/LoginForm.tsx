"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";

const BiometricButton = dynamic(() => import("./BiometricButton"), {
  ssr: false,
});

const AUTO_LOGIN_PREF_KEY = "crew_auto_login_asked";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setTokenAndUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAutoLoginPrompt, setShowAutoLoginPrompt] = useState(false);

  // 소셜 로그인 콜백 처리 (?token=xxx)
  useEffect(() => {
    const callbackToken = searchParams.get("token");
    const callbackError = searchParams.get("error");
    if (callbackError) {
      setError(decodeURIComponent(callbackError));
      window.history.replaceState({}, "", "/login");
      return;
    }
    if (callbackToken) {
      window.history.replaceState({}, "", "/login");
      setIsLoading(true);
      setTokenAndUser(callbackToken).then((ok) => {
        if (ok) {
          const alreadyAsked = localStorage.getItem(AUTO_LOGIN_PREF_KEY);
          if (!alreadyAsked) {
            setShowAutoLoginPrompt(true);
            setIsLoading(false);
          } else {
            router.replace("/dashboard");
          }
        } else {
          setError("소셜 로그인에 실패했습니다.");
          setIsLoading(false);
        }
      });
    }
  }, [searchParams, setTokenAndUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    const result = await login(email.trim(), password);
    if (result.success) {
      const alreadyAsked = localStorage.getItem(AUTO_LOGIN_PREF_KEY);
      if (!alreadyAsked) {
        setShowAutoLoginPrompt(true);
        setIsLoading(false);
      } else {
        router.replace("/dashboard");
      }
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  }

  function handleAutoLoginChoice(keepLoggedIn: boolean) {
    localStorage.setItem(AUTO_LOGIN_PREF_KEY, "true");
    if (!keepLoggedIn) localStorage.setItem("crew_no_auto_login", "true");
    else localStorage.removeItem("crew_no_auto_login");
    setShowAutoLoginPrompt(false);
    router.replace("/dashboard");
  }

  function handleSocialLogin(provider: "google" | "naver") {
    setIsLoading(true);
    window.location.href = `/api/auth/${provider}`;
  }

  // 자동 로그인 프롬프트
  if (showAutoLoginPrompt) {
    return (
      <div className="p-8 space-y-6 text-center">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">자동 로그인</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">다음에도 자동으로 로그인할까요?</p>
        </div>
        <div className="space-y-2.5">
          <button onClick={() => handleAutoLoginChoice(true)} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors">
            네, 자동 로그인할게요
          </button>
          <button onClick={() => handleAutoLoginChoice(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors">
            아니요, 매번 로그인할게요
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 상단: 타이틀 + 캐릭터 */}
      <div className="pt-8 pb-4 text-center">
        <h1 className="text-4xl font-black italic text-gray-900 dark:text-white tracking-tight leading-tight">
          RUNNING<br />CREW
        </h1>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1.5 tracking-[0.2em] uppercase">
          Level Up Your Run
        </p>

        {/* 캐릭터 + 트랙 */}
        <div className="mt-5 mx-5 rounded-2xl overflow-hidden relative h-36">
          {/* 하늘 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-400 dark:from-sky-600 dark:to-sky-700" />
          {/* 구름 */}
          <div className="absolute top-3 left-6 w-12 h-4 bg-white/60 rounded-full" />
          <div className="absolute top-6 right-8 w-16 h-5 bg-white/40 rounded-full" />
          {/* 잔디 */}
          <div className="absolute bottom-10 left-0 right-0 h-4 bg-green-500" />
          {/* 트랙 */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#D2691E]" />
          <div className="absolute bottom-4 left-0 right-0 h-[2px] bg-white/40" />
          <div className="absolute bottom-6 left-0 right-0 h-[2px] bg-white/40" />
          {/* 트랙 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-around px-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-4 h-[2px] bg-white/50" />
            ))}
          </div>

          {/* 달리는 캐릭터 SVG */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <svg viewBox="0 0 48 64" className="w-14 h-[72px]" fill="none">
              {/* 머리 */}
              <circle cx="24" cy="12" r="9" fill="#FFDBB4" />
              {/* 머리카락 */}
              <ellipse cx="24" cy="7" rx="9" ry="5" fill="#8B4513" />
              {/* 눈 */}
              <circle cx="21" cy="11" r="1.2" fill="#333" />
              <circle cx="27" cy="11" r="1.2" fill="#333" />
              {/* 미소 */}
              <path d="M22 15 Q24 17 26 15" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
              {/* 몸통 (흰색 러닝셔츠) */}
              <path d="M16 21 L32 21 L30 38 L18 38 Z" fill="white" />
              <path d="M16 21 L32 21 L30 38 L18 38 Z" stroke="#E5E7EB" strokeWidth="0.5" fill="none" />
              {/* 뒷팔 */}
              <path d="M30 24 L38 18" stroke="#FFDBB4" strokeWidth="4" strokeLinecap="round" />
              {/* 앞팔 */}
              <path d="M18 24 L10 30" stroke="#FFDBB4" strokeWidth="4" strokeLinecap="round" />
              {/* 바지 */}
              <path d="M18 37 L15 50" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" />
              <path d="M30 37 L34 48" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" />
              {/* 신발 */}
              <ellipse cx="13" cy="52" rx="5" ry="3" fill="#FF4500" />
              <ellipse cx="36" cy="50" rx="5" ry="3" fill="#FF4500" />
              {/* 신발 줄 */}
              <line x1="11" y1="52" x2="15" y2="52" stroke="white" strokeWidth="0.8" />
              <line x1="34" y1="50" x2="38" y2="50" stroke="white" strokeWidth="0.8" />
            </svg>
          </div>
        </div>
      </div>

      {/* 하단: 로그인 폼 */}
      <div className="px-6 pb-6 pt-4 space-y-3.5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 이메일 */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm"
            />
          </div>

          {/* 비밀번호 */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
              className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold text-sm rounded-xl transition-colors tracking-wide"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="bg-white dark:bg-gray-800 px-3 text-gray-400">또는</span>
          </div>
        </div>

        {/* 소셜 로그인 - 원형 아이콘 */}
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:shadow-lg transition-all active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </button>

          <button
            onClick={() => handleSocialLogin("naver")}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-[#03C75A] flex items-center justify-center hover:shadow-lg transition-all active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
            </svg>
          </button>
        </div>

        {/* 지문 인증 */}
        <BiometricButton />

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-1">
          계정이 없으신가요?{" "}
          <Link href="/register" className="text-orange-500 font-bold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
