"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];
const GUARD_STATE = { __backGuard: true };

// 팝업/모달 닫기 콜백 스택 (LIFO)
const backHandlers: (() => void)[] = [];

/** 모달/팝업이 열릴 때 등록, 닫힐 때 해제 */
export function registerBackHandler(handler: () => void) {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.indexOf(handler);
    if (idx !== -1) backHandlers.splice(idx, 1);
  };
}

/**
 * Android 뒤로가기 버튼 처리
 *
 * 핵심: Capacitor server URL 모드에서는 WebView가 히스토리를 직접 관리.
 * 히스토리가 없으면 Android가 네이티브로 Activity를 종료시켜 JS 이벤트가 발생하지 않음.
 * → history.pushState로 가드를 항상 유지하여 WebView canGoBack=true 보장.
 *
 * - 메인 탭: 첫 번째 → 토스트, 2초 내 두 번째 → 앱 종료
 * - 서브 페이지: 브라우저 뒤로가기
 */
export function useBackButton() {
  const pathname = usePathname();
  const lastBackRef = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const skipNextPopRef = useRef(false);

  const isMainTab = useCallback((path: string) => {
    return MAIN_TABS.some(
      (tab) => path === tab || path === tab + "/"
    );
  }, []);

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

  const exitApp = useCallback(() => {
    import("@capacitor/app")
      .then(({ App }) => App.exitApp())
      .catch(() => {});
  }, []);

  // 페이지 전환 시마다 히스토리 가드 push
  useEffect(() => {
    window.history.pushState(GUARD_STATE, "");
  }, [pathname]);

  // popstate 리스너: 뒤로가기 시 가드가 pop되면서 발생
  useEffect(() => {
    function handlePopState() {
      // 프로그래밍 방식 back() 호출 시 발생하는 이벤트는 무시
      if (skipNextPopRef.current) {
        skipNextPopRef.current = false;
        return;
      }

      // 팝업/모달이 열려있으면 닫기 우선
      if (backHandlers.length > 0) {
        window.history.pushState(GUARD_STATE, "");
        const handler = backHandlers.pop()!;
        handler();
        return;
      }

      const currentPath = window.location.pathname;

      if (isMainTab(currentPath)) {
        // 메인 탭: 가드 다시 push하고 종료 로직
        window.history.pushState(GUARD_STATE, "");

        const now = Date.now();
        if (now - lastBackRef.current < 2000) {
          exitApp();
          return;
        }

        lastBackRef.current = now;
        showToast();
      } else {
        // 서브 페이지: 실제 뒤로가기 수행
        // skipNextPop으로 다음 popstate 무시 (우리가 호출한 back())
        skipNextPopRef.current = true;
        window.history.back();
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [showToast, exitApp, isMainTab]);
}
