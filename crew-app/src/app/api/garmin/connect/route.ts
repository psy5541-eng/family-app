import { NextRequest } from "next/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { encryptPassword } from "@/lib/garmin/crypto";
import { GarminConnect } from "garmin-connect";

// POST: 가민 계정 연동 (로그인 검증 후 저장)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json() as { garminEmail?: string; garminPassword?: string };

  if (!body.garminEmail || !body.garminPassword) {
    return Response.json({ success: false, error: "가민 이메일과 비밀번호를 입력해주세요." }, { status: 400 });
  }

  // 가민 로그인 검증 — 실패하면 저장하지 않음
  try {
    const GC = new GarminConnect({
      username: body.garminEmail,
      password: body.garminPassword,
    });
    await GC.login();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("MFA") || msg.includes("Ticket")) {
      return Response.json({
        success: false,
        error: "가민 로그인 실패: 2단계 인증(MFA)이 활성화되어 있거나 이메일/비밀번호가 잘못되었습니다.",
      }, { status: 400 });
    }
    return Response.json({
      success: false,
      error: "가민 로그인 실패: 이메일 또는 비밀번호를 확인해주세요.",
    }, { status: 400 });
  }

  const db = getServerDb();

  // 기존 연동 확인
  const existing = await db
    .select({ id: schema.garminAccounts.id })
    .from(schema.garminAccounts)
    .where(eq(schema.garminAccounts.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  const encrypted = encryptPassword(body.garminPassword);
  const now = new Date();

  if (existing) {
    await db
      .update(schema.garminAccounts)
      .set({
        garminEmail: body.garminEmail,
        encryptedPassword: encrypted,
      })
      .where(eq(schema.garminAccounts.id, existing.id));
  } else {
    await db.insert(schema.garminAccounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      garminEmail: body.garminEmail,
      encryptedPassword: encrypted,
      createdAt: now,
    });
  }

  return Response.json({ success: true });
}

// DELETE: 가민 연동 해제 (관련 데이터 전부 삭제)
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getServerDb();

  // 1. 가민에서 동기화된 활동 ID 목록 조회
  const garminActivities = await db
    .select({ id: schema.activities.id, pointsEarned: schema.activities.pointsEarned })
    .from(schema.activities)
    .where(
      and(
        eq(schema.activities.userId, user.id),
        sql`${schema.activities.garminActivityId} IS NOT NULL`
      )
    );

  // 2. 해당 활동의 포인트 트랜잭션 삭제
  if (garminActivities.length > 0) {
    const activityIds = garminActivities.map((a) => a.id);
    await db
      .delete(schema.pointTransactions)
      .where(
        and(
          eq(schema.pointTransactions.userId, user.id),
          inArray(schema.pointTransactions.referenceId, activityIds)
        )
      );

    // 3. 가민 동기화 활동 삭제
    await db
      .delete(schema.activities)
      .where(
        and(
          eq(schema.activities.userId, user.id),
          sql`${schema.activities.garminActivityId} IS NOT NULL`
        )
      );

    // 4. 유저 포인트에서 가민 포인트 차감
    const totalGarminPoints = garminActivities.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
    if (totalGarminPoints > 0) {
      const userPoints = await db
        .select()
        .from(schema.userPoints)
        .where(eq(schema.userPoints.userId, user.id))
        .limit(1)
        .then((r) => r[0]);

      if (userPoints) {
        await db
          .update(schema.userPoints)
          .set({
            currentPoints: Math.max(0, userPoints.currentPoints - totalGarminPoints),
            totalEarned: Math.max(0, userPoints.totalEarned - totalGarminPoints),
          })
          .where(eq(schema.userPoints.id, userPoints.id));
      }
    }
  }

  // 5. 가민 계정 삭제
  await db
    .delete(schema.garminAccounts)
    .where(eq(schema.garminAccounts.userId, user.id));

  return Response.json({ success: true, data: { deletedActivities: garminActivities.length } });
}
