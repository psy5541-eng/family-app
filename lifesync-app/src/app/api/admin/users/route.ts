import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/users — 전체 사용자 목록 (관리자 전용)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = getServerDb();
  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      nickname: schema.users.nickname,
      profileImage: schema.users.profileImage,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(schema.users.createdAt);

  return Response.json({ success: true, data: { users } });
}

// PATCH /api/admin/users — 사용자 역할 변경 (관리자 전용)
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = getServerDb();
  const body = await request.json() as { userId?: string; role?: string };

  if (!body.userId || !body.role || !["admin", "user"].includes(body.role)) {
    return Response.json(
      { success: false, error: "유효하지 않은 요청입니다." },
      { status: 400 }
    );
  }

  await db
    .update(schema.users)
    .set({ role: body.role as "admin" | "user", updatedAt: new Date() })
    .where(eq(schema.users.id, body.userId));

  return Response.json({ success: true });
}
