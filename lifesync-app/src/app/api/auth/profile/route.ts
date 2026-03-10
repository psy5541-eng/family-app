import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import { schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { isValidNickname } from "@/lib/utils/validation";

// PATCH /api/auth/profile — 프로필 수정
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = await request.json() as {
    nickname?: string;
    profileImage?: string | null;
    biometricEnabled?: boolean;
  };

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.nickname !== undefined) {
    const check = isValidNickname(body.nickname);
    if (!check.valid) {
      return Response.json({ success: false, error: check.message }, { status: 400 });
    }
    // 닉네임 중복 체크 (본인 제외)
    const db = getServerDb();
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.nickname, body.nickname))
      .limit(1)
      .then((r) => r[0]);
    if (existing && existing.id !== user.id) {
      return Response.json({ success: false, error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }
    updates.nickname = body.nickname;
  }

  if (body.profileImage !== undefined) {
    updates.profileImage = body.profileImage;
  }

  if (body.biometricEnabled !== undefined) {
    updates.biometricEnabled = body.biometricEnabled;
  }

  const db = getServerDb();
  await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id));

  const updated = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1)
    .then((r) => r[0]);

  return Response.json({
    success: true,
    data: {
      user: {
        id: updated.id,
        email: updated.email,
        nickname: updated.nickname,
        profileImage: updated.profileImage,
        role: updated.role,
        biometricEnabled: updated.biometricEnabled,
      },
    },
  });
}
