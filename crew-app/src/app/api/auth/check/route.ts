import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";

// GET /api/auth/check?email=xxx or ?nickname=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const nickname = searchParams.get("nickname");

  if (!email && !nickname) {
    return Response.json({ success: false, error: "email 또는 nickname 파라미터가 필요합니다." }, { status: 400 });
  }

  const db = getServerDb();

  if (email) {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1)
      .then((r: { id: string }[]) => r[0]);

    return Response.json({
      success: true,
      data: { available: !existing, field: "email" },
    });
  }

  if (nickname) {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.nickname, nickname))
      .limit(1)
      .then((r: { id: string }[]) => r[0]);

    return Response.json({
      success: true,
      data: { available: !existing, field: "nickname" },
    });
  }

  return Response.json({ success: false, error: "잘못된 요청" }, { status: 400 });
}
