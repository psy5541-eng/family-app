import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getLocalDb, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import {
  checkLoginAttempt,
  recordFailedAttempt,
  resetLoginAttempts,
} from "@/lib/utils/rateLimit";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return Response.json(
      { success: false, error: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase();

  // ── 로그인 시도 횟수 체크 ─────────────────────────────────────
  const rateCheck = checkLoginAttempt(email);
  if (!rateCheck.allowed) {
    return Response.json(
      { success: false, error: rateCheck.message },
      { status: 429 }
    );
  }

  const db = getLocalDb();

  // ── 사용자 조회 ───────────────────────────────────────────────
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (!user) {
    // 보안: 사용자 존재 여부를 노출하지 않음
    recordFailedAttempt(email);
    return Response.json(
      { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  // ── 비밀번호 검증 ─────────────────────────────────────────────
  const isValid = await bcrypt.compare(body.password, user.password);

  if (!isValid) {
    const result = recordFailedAttempt(email);
    const message =
      result.locked
        ? "로그인 시도 횟수 초과. 5분 후 다시 시도해주세요."
        : `이메일 또는 비밀번호가 올바르지 않습니다. (남은 시도: ${result.remaining}회)`;

    return Response.json(
      { success: false, error: message },
      { status: 401 }
    );
  }

  // ── 로그인 성공 ───────────────────────────────────────────────
  resetLoginAttempts(email);
  const token = await createSession(user.id);

  return Response.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
        role: user.role,
        biometricEnabled: user.biometricEnabled,
      },
    },
  });
}
