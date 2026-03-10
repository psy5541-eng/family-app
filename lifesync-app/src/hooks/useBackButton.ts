"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Android 뒤로가기 버튼 2회 누르면 앱 종료
 * - 첫 번째: 토스트 표시
 * - 2초 내 두 번째: 앱 종료
 */
export function useBackButton() {
  const router = useRouter();
  const lastBackRef = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback(() => {
    // 이미 떠있으면 제거
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }

    const toast = document.createElement("div");
    toast.textContent = "뒤로 한번 더 누르면 종료됩니다";
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-medium shadow-lg transition-opacity duration-300";
    document.body.appendChild(toast);
    toastRef.current = toast;

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }
      if (toastRef.current === toast) toastRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");

        const listener = await App.addListener("backButton", () => {
          const now = Date.now();

          // 메인 탭 경로 (이 화면들에서는 뒤로갈 곳이 없음)
          const mainTabs = ["/dashboard", "/feed", "/calendar", "/settings"];
          const isMainTab = mainTabs.includes(window.location.pathname);

          // 메인 탭이 아니면 히스토리 뒤로가기
          if (!isMainTab) {
            router.back();
            return;
          }

          // 메인 탭: 2초 내 두 번째 뒤로가기 → 앱 종료
          if (now - lastBackRef.current < 2000) {
            App.exitApp();
            return;
          }

          // 첫 번째 뒤로가기 → 토스트
          lastBackRef.current = now;
          showToast();
        });

        cleanup = () => listener.remove();
      } catch {
        // 웹 환경에서는 Capacitor App 플러그인 없으므로 무시
      }
    }

    setup();

    return () => {
      cleanup?.();
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [router, showToast]);
}
