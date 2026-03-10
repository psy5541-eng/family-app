// FCM 서버 전송 유틸 (Next.js API Route에서 사용)
// Firebase Admin SDK 대신 FCM HTTP v1 API 직접 호출
// 환경변수가 설정된 경우에만 동작

const FCM_SERVER_KEY = process.env.FIREBASE_SERVER_KEY ?? "";
const FCM_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

function isConfigured(): boolean {
  return !!FCM_SERVER_KEY && !FCM_SERVER_KEY.includes("your_") && !!FCM_PROJECT_ID;
}

type FCMPayload = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * FCM 단일 기기 푸시 전송 (Legacy HTTP API)
 * 실제 프로덕션에서는 Firebase Admin SDK 사용 권장
 */
export async function sendPush({ token, title, body, data }: FCMPayload): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body, icon: "/icons/icon-192.png" },
        data: data ?? {},
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 여러 기기에 푸시 전송 (최대 500개 토큰)
 */
export async function sendMulticastPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!isConfigured() || tokens.length === 0) return;

  try {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        registration_ids: tokens.slice(0, 500),
        notification: { title, body, icon: "/icons/icon-192.png" },
        data: data ?? {},
      }),
    });
  } catch {
    // 전송 실패는 무시 (푸시는 부가 기능)
  }
}
