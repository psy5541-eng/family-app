import { NextRequest } from "next/server";
import { findOrCreateSocialUser } from "@/lib/auth/social";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID ?? "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET ?? "";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("네이버 로그인이 취소되었습니다.")}`);
  }

  try {
    // 1. code → access_token 교환
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        code,
        state: state ?? "",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("네이버 인증에 실패했습니다.")}`);
    }

    // 2. 유저 정보 가져오기
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const naverData = await userRes.json() as {
      response: {
        email: string;
        nickname: string;
        profile_image: string;
        name: string;
      };
    };

    const naverUser = naverData.response;
    if (!naverUser?.email) {
      return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("이메일 정보를 가져올 수 없습니다. 네이버 계정에 이메일이 등록되어 있는지 확인해주세요.")}`);
    }

    // 3. 유저 찾기/생성 + 세션 토큰
    const token = await findOrCreateSocialUser(
      naverUser.email,
      naverUser.nickname || naverUser.name || naverUser.email.split("@")[0],
      naverUser.profile_image || null
    );

    return Response.redirect(`${BASE_URL}/login?token=${token}`);
  } catch {
    return Response.redirect(`${BASE_URL}/login?error=${encodeURIComponent("네이버 로그인 처리 중 오류가 발생했습니다.")}`);
  }
}
