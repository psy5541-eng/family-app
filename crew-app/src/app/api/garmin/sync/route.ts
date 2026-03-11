import { NextRequest } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchGarminActivities } from "@/lib/garmin/client";
import { calculatePoints } from "@/lib/garmin/points";

// POST: 가민 동기화 실행
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getServerDb();

  // 1. 가민 계정 조회
  const garminAccount = await db
    .select()
    .from(schema.garminAccounts)
    .where(eq(schema.garminAccounts.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!garminAccount) {
    return Response.json({ success: false, error: "가민 계정이 연동되지 않았습니다." }, { status: 400 });
  }

  try {
    // 2. 가민에서 활동 데이터 가져오기
    const sinceDate = garminAccount.lastSyncAt ?? undefined;
    const { activities: garminActivities } = await fetchGarminActivities(
      garminAccount.garminEmail,
      garminAccount.encryptedPassword,
      sinceDate
    );

    if (garminActivities.length === 0) {
      // lastSyncAt 업데이트
      await db
        .update(schema.garminAccounts)
        .set({ lastSyncAt: new Date() })
        .where(eq(schema.garminAccounts.id, garminAccount.id));

      return Response.json({
        success: true,
        data: { synced: 0, totalPoints: 0 },
      });
    }

    // 3. 이미 저장된 활동 ID 확인 (중복 방지)
    const garminIds = garminActivities.map((a) => a.garminActivityId);
    const existingActivities = await db
      .select({ garminActivityId: schema.activities.garminActivityId })
      .from(schema.activities)
      .where(
        and(
          eq(schema.activities.userId, user.id),
          inArray(schema.activities.garminActivityId, garminIds)
        )
      );
    const existingIds = new Set(existingActivities.map((a) => a.garminActivityId));

    // 4. 포인트 설정 조회
    const pointSetting = await db
      .select()
      .from(schema.pointSettings)
      .limit(1)
      .then((r) => r[0] ?? null);

    // 5. 새 활동 저장 + 포인트 계산
    const newActivities = garminActivities.filter((a) => !existingIds.has(a.garminActivityId));
    let totalNewPoints = 0;
    const now = new Date();

    for (const activity of newActivities) {
      const points = calculatePoints(
        {
          activityType: activity.activityType,
          distance: activity.distance,
          elevation: activity.elevation,
        },
        pointSetting
      );
      totalNewPoints += points;

      const activityId = crypto.randomUUID();

      // 활동 저장
      await db.insert(schema.activities).values({
        id: activityId,
        userId: user.id,
        garminActivityId: activity.garminActivityId,
        activityType: activity.activityType,
        title: activity.title,
        startTime: activity.startTime,
        duration: activity.duration,
        distance: activity.distance,
        pace: activity.pace,
        heartRate: activity.heartRate,
        calories: activity.calories,
        elevation: activity.elevation,
        elevationLoss: activity.elevationLoss,
        pointsEarned: points,
        createdAt: now,
      });

      // 포인트 트랜잭션 기록
      if (points > 0) {
        await db.insert(schema.pointTransactions).values({
          id: crypto.randomUUID(),
          userId: user.id,
          amount: points,
          type: "earn",
          referenceId: activityId,
          description: `${activity.activityType === "running" ? "러닝" : activity.activityType === "trail_running" ? "트레일 러닝" : "걷기"} ${activity.distance}km`,
          createdAt: now,
        });
      }
    }

    // 6. 유저 포인트 업데이트
    if (totalNewPoints > 0) {
      const existingPoints = await db
        .select()
        .from(schema.userPoints)
        .where(eq(schema.userPoints.userId, user.id))
        .limit(1)
        .then((r) => r[0]);

      if (existingPoints) {
        await db
          .update(schema.userPoints)
          .set({
            currentPoints: existingPoints.currentPoints + totalNewPoints,
            totalEarned: existingPoints.totalEarned + totalNewPoints,
          })
          .where(eq(schema.userPoints.id, existingPoints.id));
      } else {
        await db.insert(schema.userPoints).values({
          id: crypto.randomUUID(),
          userId: user.id,
          currentPoints: totalNewPoints,
          totalEarned: totalNewPoints,
          totalSpent: 0,
        });
      }
    }

    // 7. lastSyncAt 업데이트
    await db
      .update(schema.garminAccounts)
      .set({ lastSyncAt: now })
      .where(eq(schema.garminAccounts.id, garminAccount.id));

    return Response.json({
      success: true,
      data: {
        synced: newActivities.length,
        totalPoints: totalNewPoints,
      },
    });
  } catch (error) {
    console.error("Garmin sync error:", error);
    const message =
      error instanceof Error ? error.message : "가민 동기화 중 오류가 발생했습니다.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
