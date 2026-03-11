"use client";

import { useEffect, useRef, useCallback } from "react";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];

/**
 * Android 뒤로가기 버튼 처리 (Capacitor 전용)
 * - 메인 탭: 첫 번째 → 토스트, 2초 내 두 번째 → 앱 종료
 * - 서브 페이지: 브라우저 뒤로가기
 */
export function useBackButton() {
  const lastBackRef = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback(() => {
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }

    const toast = document.createElement("div");
    toast.textContent = "'뒤로'버튼 한번 더 누르시면 종료됩니다.";
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl bg-gray-800/90 text-white text-sm font-medium shadow-lg";
    document.body.appendChild(toast);
    toastRef.current = toast;

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
      }
      if (toastRef.current === toast) toastRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");

        listenerHandle = await App.addListener("backButton", ({ canGoBack }) => {
          const isMainTab = MAIN_TABS.some((tab) =>
            window.location.pathname === tab || window.location.pathname === tab + "/"
          );

          // 서브 페이지에서는 브라우저 히스토리 뒤로가기
          if (!isMainTab && canGoBack) {
            window.history.back();
            return;
          }

          // 메인 탭 또는 히스토리 없음: 더블 탭 종료 로직
          const now = Date.now();
          if (now - lastBackRef.current < 2000) {
            App.exitApp();
            return;
          }

          lastBackRef.current = now;
          showToast();
        });
      } catch {
        // 웹 환경에서는 Capacitor 없음 — 무시
      }
    }

    setup();

    return () => {
      listenerHandle?.remove();
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [showToast]);
}
