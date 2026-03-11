import { NextRequest } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_REDIRECT_URI = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
