import { NextRequest } from "next/server";
import { findOrCreateSocialUser } from "@/lib/auth/social";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const GOOGLE_REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("Google 로그인이 취소되었습니다.")}`);
  }

  try {
    // 1. code → access_token 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("Google 인증에 실패했습니다.")}`);
    }

    // 2. 유저 정보 가져오기
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json() as {
      email: string;
      name: string;
      picture: string;
    };

    if (!googleUser.email) {
      return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("이메일 정보를 가져올 수 없습니다.")}`);
    }

    // 3. 유저 찾기/생성 + 세션 토큰
    const token = await findOrCreateSocialUser(
      googleUser.email,
      googleUser.name || googleUser.email.split("@")[0],
      googleUser.picture || null
    );

    return Response.redirect(`${BASE_URL}/login?token=${token}`);
  } catch {
    return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("Google 로그인 처리 중 오류가 발생했습니다.")}`);
  }
}
