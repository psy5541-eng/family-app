// FCM 서버 전송 유틸 (Firebase Cloud Messaging HTTP V1 API)
// 서비스 계정 자격증명으로 OAuth2 액세스 토큰 발급 후 V1 API 호출

const FCM_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "";
const FCM_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "";
const FCM_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

function isConfigured(): boolean {
  return !!FCM_PROJECT_ID && !!FCM_CLIENT_EMAIL && !!FCM_PRIVATE_KEY;
}

// 서비스 계정으로 JWT 생성 (RS256)
async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: FCM_CLIENT_EMAIL,
      sub: FCM_CLIENT_EMAIL,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
  ).toString("base64url");

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(FCM_PRIVATE_KEY, "base64url");

  return `${header}.${payload}.${signature}`;
}

// OAuth2 액세스 토큰 발급
async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("FCM 액세스 토큰 발급 실패");
  return json.access_token;
}

type FCMPayload = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * FCM 단일 기기 푸시 전송 (V1 API)
 */
export async function sendPush({ token, title, body, data }: FCMPayload): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: { notification: { icon: "/icons/icon-192.png" } },
            data: data ?? {},
          },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 여러 기기에 푸시 전송 (V1 API - 개별 전송, 최대 500개 병렬)
 */
export async function sendMulticastPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!isConfigured() || tokens.length === 0) return;

  try {
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

    await Promise.allSettled(
      tokens.slice(0, 500).map((token) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              webpush: { notification: { icon: "/icons/icon-192.png" } },
              data: data ?? {},
            },
          }),
        })
      )
    );
  } catch {
    // 전송 실패는 무시 (푸시는 부가 기능)
  }
}
