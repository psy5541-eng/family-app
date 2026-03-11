import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import * as schema from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { isValidEmail, isValidPassword, isValidNickname } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    email?: string;
    password?: string;
    nickname?: string;
    profileImage?: string;
    characterBase?: "male" | "female";
  };

  // ── 유효성 검사 ────────────────────────────────────────────
  if (!body.email || !body.password || !body.nickname) {
    return Response.json(
      { success: false, error: "이메일, 비밀번호, 닉네임을 모두 입력해주세요." },
      { status: 400 }
    );
  }

  if (!isValidEmail(body.email)) {
    return Response.json(
      { success: false, error: "올바른 이메일 형식이 아닙니다." },
      { status: 400 }
    );
  }

  const pwCheck = isValidPassword(body.password);
  if (!pwCheck.valid) {
    return Response.json({ success: false, error: pwCheck.message }, { status: 400 });
  }

  const nicknameCheck = isValidNickname(body.nickname);
  if (!nicknameCheck.valid) {
    return Response.json({ success: false, error: nicknameCheck.message }, { status: 400 });
  }

  const db = getServerDb();

  // ── 중복 체크 ────────────────────────────────────────────────
  const existingEmail = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, body.email.toLowerCase()))
    .limit(1)
    .then((r) => r[0]);

  if (existingEmail) {
    return Response.json(
      { success: false, error: "이미 사용 중인 이메일입니다." },
      { status: 409 }
    );
  }

  const existingNickname = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.nickname, body.nickname))
    .limit(1)
    .then((r) => r[0]);

  if (existingNickname) {
    return Response.json(
      { success: false, error: "이미 사용 중인 닉네임입니다." },
      { status: 409 }
    );
  }

  // ── 사용자 생성 ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(body.password, 10);
  const userId = crypto.randomUUID();
  const now = new Date();

  await db.insert(schema.users).values({
    id: userId,
    email: body.email.toLowerCase(),
    password: hashedPassword,
    nickname: body.nickname,
    profileImage: body.profileImage ?? null,
    role: "member",
    createdAt: now,
    updatedAt: now,
  });

  // ── 기본 캐릭터 생성 ──────────────────────────────────────────
  await db.insert(schema.userCharacters).values({
    id: crypto.randomUUID(),
    userId,
    base: body.characterBase ?? "unknown",
    skinTone: "#FFDBB4",
  });

  // ── 기본 포인트 레코드 생성 ──────────────────────────────────
  await db.insert(schema.userPoints).values({
    id: crypto.randomUUID(),
    userId,
    currentPoints: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  // ── 자동 로그인 (세션 생성) ──────────────────────────────────
  const token = await createSession(userId);

  return Response.json(
    {
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email: body.email.toLowerCase(),
          nickname: body.nickname,
          profileImage: body.profileImage ?? null,
          role: "member",
        },
      },
    },
    { status: 201 }
  );
}
