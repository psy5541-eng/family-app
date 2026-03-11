"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];

/**
 * Android 뒤로가기 제어 (Capacitor 전용)
 * - @capacitor/app이 네이티브 back 이벤트를 가로채서 Android 기본 동작(앱 종료)을 차단
 * - 메인 탭: 토스트 → 2초 내 재클릭 → 앱 종료
 * - 서브 페이지: router.back()
 */
export default function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const lastBackPress = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const pathnameRef = useRef(pathname);

  // pathname을 ref로 유지 (리스너 내부에서 최신값 참조)
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const listenerPromise = App.addListener("backButton", () => {
      const current = pathnameRef.current;
      const isMainTab = MAIN_TABS.some(
        (tab) => current === tab || current === tab + "/"
      );

      // 서브 페이지: Next.js 라우터로 뒤로가기
      if (!isMainTab) {
        router.back();
        return;
      }

      // 메인 탭: 더블 탭 종료
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        App.exitApp();
        return;
      }

      lastBackPress.current = now;
      showToast();
    });

    function showToast() {
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }

      const toast = document.createElement("div");
      toast.textContent = "'뒤로' 버튼을 한 번 더 누르면 종료됩니다.";
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
    }

    return () => {
      listenerPromise.then((listener) => listener.remove());
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [router]);

  return null;
}
