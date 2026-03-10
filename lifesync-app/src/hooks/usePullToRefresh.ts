"use client";

import { useRef, useEffect, useCallback } from "react";

type PullToRefreshOptions = {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // 트리거 거리 (px), 기본 80
};

/**
 * Pull-to-Refresh: 화면 최상단에서 아래로 당기면 새로고침
 * - 스크롤 최상단일 때만 작동
 * - 당기는 거리에 비례한 인디케이터 표시
 * - threshold 이상 당기면 onRefresh 호출
 */
export function usePullToRefresh({ onRefresh, threshold = 80 }: PullToRefreshOptions) {
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const refreshingRef = useRef(false);

  const createIndicator = useCallback(() => {
    if (indicatorRef.current) return indicatorRef.current;
    const el = document.createElement("div");
    el.className = "fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none";
    el.innerHTML = `
      <div class="mt-2 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center transition-transform duration-150" style="transform: scale(0)">
        <svg class="w-5 h-5 text-primary-500 transition-transform duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </div>
    `;
    document.body.appendChild(el);
    indicatorRef.current = el;
    return el;
  }, []);

  const updateIndicator = useCallback((progress: number) => {
    const el = createIndicator();
    const circle = el.firstElementChild as HTMLElement;
    const arrow = circle.querySelector("svg") as SVGElement;
    const scale = Math.min(progress, 1);
    circle.style.transform = `scale(${scale})`;
    // 화살표를 위로 회전 (threshold 도달 시)
    arrow.style.transform = progress >= 1 ? "rotate(180deg)" : "rotate(0deg)";
  }, [createIndicator]);

  const removeIndicator = useCallback(() => {
    if (indicatorRef.current) {
      indicatorRef.current.remove();
      indicatorRef.current = null;
    }
  }, []);

  const showRefreshing = useCallback(() => {
    const el = createIndicator();
    const circle = el.firstElementChild as HTMLElement;
    circle.style.transform = "scale(1)";
    circle.innerHTML = `
      <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    `;
  }, [createIndicator]);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pullingRef.current || refreshingRef.current) return;
      if (window.scrollY > 0) {
        pullingRef.current = false;
        removeIndicator();
        return;
      }

      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY < 0) {
        removeIndicator();
        return;
      }

      // 저항감 적용 (dampening)
      const dampened = deltaY * 0.4;
      const progress = dampened / threshold;
      updateIndicator(progress);

      if (dampened > 10) {
        e.preventDefault();
      }
    }

    async function onTouchEnd() {
      if (!pullingRef.current || refreshingRef.current) return;
      pullingRef.current = false;

      const el = indicatorRef.current;
      if (!el) return;

      const circle = el.firstElementChild as HTMLElement;
      const scale = parseFloat(circle.style.transform.replace(/[^0-9.]/g, "") || "0");

      if (scale >= 1) {
        refreshingRef.current = true;
        showRefreshing();
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          removeIndicator();
        }
      } else {
        removeIndicator();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      removeIndicator();
    };
  }, [onRefresh, threshold, updateIndicator, removeIndicator, showRefreshing]);
}
