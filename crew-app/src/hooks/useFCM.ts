"use client";

import { useEffect, useRef } from "react";
import { getFCMToken, onForegroundMessage } from "@/lib/fcm";
import { useAuth } from "@/hooks/useAuth";

/**
 * FCM 초기화 훅
 * - 로그인 상태에서 토큰 획득 후 서버에 등록
 * - 포그라운드 메시지 수신 시 브라우저 알림 표시
 */
export function useFCM() {
  const { user, getAuthHeader } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || registeredRef.current) return;

    async function init() {
      const token = await getFCMToken();
      if (!token) return;

      // 서버에 FCM 토큰 등록
      await fetch("/api/fcm/token", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ token }),
      }).catch(() => {});

      registeredRef.current = true;

      // 포그라운드 메시지 수신
      const unsubscribe = await onForegroundMessage(({ title, body }) => {
        if (Notification.permission === "granted") {
          new Notification(title ?? "RunningCrew", {
            body,
            icon: "/icons/icon-192.png",
          });
        }
      });

      return unsubscribe;
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, [user, getAuthHeader]);
}
