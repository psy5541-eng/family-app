"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useFCM } from "@/hooks/useFCM";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";

// SSR 제외 — Capacitor 네이티브 브릿지 필요, 클라이언트에서만 로드
const BackButtonHandler = dynamic(
  () => import("@/components/layout/BackButtonHandler"),
  { ssr: false }
);

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  useFCM(); // FCM 토큰 등록 + 포그라운드 메시지 처리

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);
  usePullToRefresh({ onRefresh: handleRefresh }); // Pull-to-Refresh

  // 비로그인 시 로그인 페이지로 이동
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // 인증 확인 중 스피너
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <BackButtonHandler />
      <Header />
      <main className="flex-1 pb-bottom-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
