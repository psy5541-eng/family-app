"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];

/**
 * Android 뒤로가기 버튼 처리
 * - Capacitor server URL 모드에서는 WebView가 히스토리 관리
 * - popstate + history guard로 메인 탭 뒤로가기 인터셉트
 * - 메인 탭 첫 번째 뒤로가기: 토스트
 * - 2초 내 두 번째: 앱 종료
 */
export function useBackButton() {
  const pathname = usePathname();
  const lastBackRef = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const guardPushedRef = useRef(false);
  const appRef = useRef<{ exitApp: () => void; minimizeApp: () => void } | null>(null);

  const showToast = useCallback(() => {
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

  // 메인 탭에 진입할 때마다 history guard를 push
  useEffect(() => {
    const isMainTab = MAIN_TABS.includes(pathname);
    if (isMainTab && !guardPushedRef.current) {
      // guard state를 push → 뒤로가기 시 popstate가 발생하고 이 guard가 pop됨
      window.history.pushState({ backGuard: true }, "");
      guardPushedRef.current = true;
    }
    if (!isMainTab) {
      guardPushedRef.current = false;
    }
  }, [pathname]);

  // popstate로 뒤로가기 감지 (WebView 히스토리 기반)
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const isMainTab = MAIN_TABS.includes(window.location.pathname);

      if (!isMainTab) {
        // 메인 탭이 아니면 기본 브라우저 뒤로가기 동작 허용
        return;
      }

      // 메인 탭에서 뒤로가기: guard를 다시 push하고 종료 판단
      window.history.pushState({ backGuard: true }, "");
      guardPushedRef.current = true;

      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        // 2초 내 두 번째 → 앱 종료
        if (appRef.current) {
          appRef.current.exitApp();
        }
        return;
      }

      lastBackRef.current = now;
      showToast();
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showToast]);

  // Capacitor App 플러그인 로드 (exitApp 용)
  useEffect(() => {
    async function loadApp() {
      try {
        const { App } = await import("@capacitor/app");
        appRef.current = App;

        // Capacitor backButton 이벤트도 등록 (히스토리가 없을 때 발생)
        const listener = await App.addListener("backButton", () => {
          const isMainTab = MAIN_TABS.includes(window.location.pathname);

          if (!isMainTab) {
            window.history.back();
            return;
          }

          const now = Date.now();
          if (now - lastBackRef.current < 2000) {
            App.exitApp();
            return;
          }

          lastBackRef.current = now;
          showToast();
        });

        return () => listener.remove();
      } catch {
        // 웹 환경에서는 Capacitor 없음
      }
    }

    let cleanupFn: (() => void) | undefined;
    loadApp().then((fn) => { cleanupFn = fn; });

    return () => {
      cleanupFn?.();
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [showToast]);
}
