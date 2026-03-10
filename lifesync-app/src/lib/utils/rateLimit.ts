/**
 * 로그인 시도 횟수 제한
 * - 5회 실패 시 5분 잠금 (PRD 명세)
 * - 서버 재시작 시 초기화됨 (개발용). 프로덕션에서는 D1/Redis로 교체 권장.
 */

type AttemptRecord = {
  count: number;
  lockedUntil?: number;
};

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5분

const attempts = new Map<string, AttemptRecord>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; message: string; remainingMs: number };

/**
 * 로그인 허용 여부 확인
 */
export function checkLoginAttempt(email: string): RateLimitResult {
  const record = attempts.get(email.toLowerCase());
  const now = Date.now();

  if (record?.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      allowed: false,
      message: `로그인 시도 횟수 초과. ${remainingMin}분 후 다시 시도해주세요.`,
      remainingMs,
    };
  }

  return { allowed: true };
}

/**
 * 로그인 실패 기록
 */
export function recordFailedAttempt(email: string): { locked: boolean; remaining: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = attempts.get(key);

  // 잠금 만료 후 첫 시도면 카운트 초기화
  if (record?.lockedUntil && now >= record.lockedUntil) {
    attempts.set(key, { count: 1 });
    return { locked: false, remaining: MAX_ATTEMPTS - 1 };
  }

  const newCount = (record?.count ?? 0) + 1;
  const locked = newCount >= MAX_ATTEMPTS;

  attempts.set(key, {
    count: newCount,
    lockedUntil: locked ? now + LOCK_DURATION_MS : undefined,
  });

  return { locked, remaining: Math.max(0, MAX_ATTEMPTS - newCount) };
}

/**
 * 로그인 성공 시 시도 기록 초기화
 */
export function resetLoginAttempts(email: string): void {
  attempts.delete(email.toLowerCase());
}
