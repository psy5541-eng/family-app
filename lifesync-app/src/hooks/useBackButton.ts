"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

const MAIN_TABS = ["/dashboard", "/feed", "/calendar", "/settings"];

// window 전역 변수로 백 핸들러 스택 관리
type BackHandlerStack = (() => void)[];
const BACK_HANDLER_KEY = "__lifesync_backHandlers";

function getBackHandlers(): BackHandlerStack {
  const win = window as unknown as Record<string, unknown>;
  if (!win[BACK_HANDLER_KEY]) {
    win[BACK_HANDLER_KEY] = [];
  }
  return win[BACK_HANDLER_KEY] as BackHandlerStack;
}

/** 모달/팝업이 열릴 때 등록, 닫힐 때 해제 */
export function registerBackHandler(handler: () => void) {
  const handlers = getBackHandlers();
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

/**
 * Android 뒤로가기 버튼 처리
 *
 * 1순위: 모달/팝업이 열려있으면 닫기
 * 2순위: 메인 탭이면 토스트 → 두 번째 누르면 앱 종료
 * 3순위: 서브 페이지면 브라우저 뒤로가기
 */
export function useBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const lastBackRef = useRef(0);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const pathnameRef = useRef(pathname);

  // 최신 pathname 유지
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const isMainTab = useCallback((path: string) => {
    return MAIN_TABS.some((tab) => path === tab || path === tab + "/");
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

  // Capacitor 네이티브 back button 리스너
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    import("@capacitor/app")
      .then(({ App }) => {
        const listener = App.addListener("backButton", () => {
          // 1순위: 모달/팝업 닫기
          const handlers = getBackHandlers();
          if (handlers.length > 0) {
            const handler = handlers.pop()!;
            handler();
            return;
          }

          // 2순위: 메인 탭 → 종료 로직
          const currentPath = pathnameRef.current;
          if (isMainTab(currentPath)) {
            const now = Date.now();
            if (now - lastBackRef.current < 2000) {
              App.exitApp();
              return;
            }
            lastBackRef.current = now;
            showToast();
            return;
          }

          // 3순위: 서브 페이지 → 뒤로가기
          router.back();
        });

        // listener는 Promise<PluginListenerHandle>
        listener.then((handle) => {
          removeListener = () => handle.remove();
        });
      })
      .catch(() => {
        // Capacitor 없는 환경 (웹 브라우저) → popstate fallback
        setupPopstateFallback();
      });

    function setupPopstateFallback() {
      // 히스토리 가드 push
      window.history.pushState({ __backGuard: true }, "");

      function handlePopState() {
        // 1순위: 모달/팝업 닫기
        const handlers = getBackHandlers();
        if (handlers.length > 0) {
          window.history.pushState({ __backGuard: true }, "");
          const handler = handlers.pop()!;
          handler();
          return;
        }

        // 2순위: 메인 탭 → 종료 로직
        const currentPath = window.location.pathname;
        if (isMainTab(currentPath)) {
          window.history.pushState({ __backGuard: true }, "");
          const now = Date.now();
          if (now - lastBackRef.current < 2000) {
            return; // 웹에서는 종료 불가
          }
          lastBackRef.current = now;
          showToast();
        }
        // 서브 페이지는 브라우저 기본 동작 (history.back)
      }

      window.addEventListener("popstate", handlePopState);
      removeListener = () => window.removeEventListener("popstate", handlePopState);
    }

    return () => {
      removeListener?.();
      if (toastRef.current) {
        toastRef.current.remove();
        toastRef.current = null;
      }
    };
  }, [isMainTab, showToast, router]);
}
