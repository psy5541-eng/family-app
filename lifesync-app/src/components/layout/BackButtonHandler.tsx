"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];

/**
 * Android 뒤로가기 제어 (Capacitor 전용)
 *
 * 2중 방어 구조:
 * 1. popstate 가드: 마운트 시 더미 히스토리 1개 push → 뒤로가기 시 즉시 리필
 *    → Android OS가 WebView 히스토리 없음으로 판단해 앱을 죽이는 것을 방지
 * 2. Capacitor backButton 리스너: 실제 뒤로가기 동작 제어
 *    → 메인 탭: 토스트 → 2초 내 재클릭 → 앱 종료
 *    → 서브 페이지: router.back()
 */
export default function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const lastBackRef = useRef<number>(0);
  const toastRef = useRef<HTMLDivElement | null>(null);

  const isMainTab = useCallback((path: string) => {
    return MAIN_TABS.some((tab) => path === tab || path === tab + "/");
  }, []);

  const showToast = useCallback(() => {
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }

    const toast = document.createElement("div");
    toast.textContent = "'뒤로' 버튼을 한 번 더 누르시면 종료됩니다.";
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl bg-gray-800/90 text-white text-sm font-medium shadow-lg transition-opacity duration-300";
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

  // 1. [OS 방어] 마운트 시 더미 히스토리 1회 push + 뒤로가기 시 즉시 리필
  useEffect(() => {
    window.history.pushState({ isGuard: true }, "");

    const handlePopState = () => {
      // 방패가 깨지면 즉시 새 방패 리필 → OS가 앱을 종료하지 못하게 함
      window.history.pushState({ isGuard: true }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 2. [실제 동작 제어] Capacitor 네이티브 이벤트로 라우팅 제어
  useEffect(() => {
    const backListener = App.addListener("backButton", () => {
      if (isMainTab(pathname)) {
        const now = Date.now();
        if (now - lastBackRef.current < 2000) {
          App.exitApp();
        } else {
          lastBackRef.current = now;
          showToast();
        }
      } else {
        // 서브 페이지: Next.js 라우터로 뒤로가기 (히스토리 스택 꼬임 방지)
        router.back();
      }
    });

    return () => {
      backListener.then((listener) => listener.remove());
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [pathname, isMainTab, router, showToast]);

  return null;
}
