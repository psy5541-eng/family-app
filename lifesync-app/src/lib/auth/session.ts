import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import type { User } from "@/types/db";

const SESSION_COOKIE = "lifesync-session";

/**
 * 현재 요청의 세션 토큰을 가져옴
 * 1. Authorization: Bearer <token> 헤더
 * 2. lifesync-session 쿠키
 */
function extractToken(request?: Request): string | null {
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
  }
  return null;
}

/**
 * 토큰으로 사용자 조회 (세션 유효성 검사 포함)
 */
async function getUserByToken(token: string): Promise<User | null> {
  const db = getServerDb();
  const now = new Date();

  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.token, token))
    .limit(1);

  if (!rows.length) return null;

  // 세션 만료 체크
  const session = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.token, token))
    .limit(1)
    .then((r: { expiresAt: Date }[]) => r[0]);

  if (!session || session.expiresAt < now) return null;

  return rows[0].user;
}

/**
 * API Route에서 현재 로그인 사용자 가져오기
 * - Authorization 헤더 또는 쿠키에서 토큰 추출
 * - 없으면 null 반환
 */
export async function getCurrentUser(request?: Request): Promise<User | null> {
  // 1. 헤더에서 추출 (API 호출 시)
  const headerToken = extractToken(request);
  if (headerToken) {
    return getUserByToken(headerToken);
  }

  // 2. 쿠키에서 추출 (브라우저 접근 시)
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (cookieToken) {
      return getUserByToken(cookieToken);
    }
  } catch {
    // cookies()는 Server Component/API Route에서만 동작
  }

  return null;
}

/**
 * 인증 필요 API에서 사용 - 인증 실패 시 Response 반환
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User } | Response> {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  return { user };
}

/**
 * 세션 토큰 생성 (로그인 시 사용)
 */
export async function createSession(userId: string): Promise<string> {
  const db = getServerDb();
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    createdAt: now,
  });

  return token;
}

/**
 * 세션 삭제 (로그아웃 시 사용)
 */
export async function deleteSession(token: string): Promise<void> {
  const db = getServerDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

/**
 * 관리자 권한 필요 API에서 사용 - 일반 사용자는 403 반환
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User } | Response> {
  const result = await requireAuth(request);
  if (result instanceof Response) return result;
  if (result.user.role !== "admin") {
    return Response.json(
      { success: false, error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }
  return result;
}

export { SESSION_COOKIE };
