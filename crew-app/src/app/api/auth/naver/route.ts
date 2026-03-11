import { NextRequest } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID ?? "";
const NAVER_REDIRECT_URI = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/naver/callback`;

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NAVER_REDIRECT_URI,
    state,
  });

  return Response.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}
