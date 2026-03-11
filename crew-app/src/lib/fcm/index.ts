// FCM 초기화 및 토큰 관리 (클라이언트 전용)

// Firebase config는 NEXT_PUBLIC_ 환경변수로 관리
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

function isConfigured(): boolean {
  return !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("your_");
}

/**
 * FCM 토큰을 가져옵니다.
 * - Notification 권한이 없으면 요청
 * - 서비스워커 등록 필요
 * - Firebase 미설정 시 null 반환
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !isConfigured()) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Firebase 동적 import (SSR 방지)
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (e) {
    console.warn("FCM 토큰 획득 실패:", e);
    return null;
  }
}

/**
 * FCM 포그라운드 메시지 리스너 등록
 */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): Promise<() => void> {
  if (typeof window === "undefined" || !isConfigured()) return () => {};

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getMessaging, onMessage } = await import("firebase/messaging");

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data as Record<string, string> | undefined,
      });
    });

    return unsubscribe;
  } catch {
    return () => {};
  }
}
