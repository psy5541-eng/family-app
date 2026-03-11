import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

/**
 * 소셜 로그인으로 받은 이메일/닉네임/프로필로 유저 찾기 또는 생성 후 세션 토큰 반환
 */
export async function findOrCreateSocialUser(
  email: string,
  nickname: string,
  profileImage: string | null
): Promise<string> {
  const db = getServerDb();

  // 1. 기존 유저 찾기
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    // 기존 유저 → 세션 생성
    return createSession(existing.id);
  }

  // 2. 새 유저 생성 (소셜 로그인은 랜덤 비밀번호)
  const userId = crypto.randomUUID();
  const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
  const now = new Date();

  // 닉네임 중복 방지
  let finalNickname = nickname;
  const existingNick = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.nickname, nickname))
    .limit(1)
    .then((r) => r[0]);

  if (existingNick) {
    finalNickname = `${nickname}_${Date.now().toString(36).slice(-4)}`;
  }

  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    password: randomPassword,
    nickname: finalNickname,
    profileImage,
    role: "member",
    createdAt: now,
    updatedAt: now,
  });

  return createSession(userId);
}
