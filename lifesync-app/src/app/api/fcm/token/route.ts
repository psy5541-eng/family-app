import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getLocalDb, schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// POST /api/fcm/token — FCM 토큰 등록
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = await request.json() as { token?: string };
  if (!body.token) {
    return Response.json({ success: false, error: "토큰이 필요합니다." }, { status: 400 });
  }

  const db = getLocalDb();
  await db
    .update(schema.users)
    .set({ fcmToken: body.token, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  return Response.json({ success: true });
}

// DELETE /api/fcm/token — FCM 토큰 삭제 (로그아웃 시)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const db = getLocalDb();
  await db
    .update(schema.users)
    .set({ fcmToken: null, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  return Response.json({ success: true });
}
