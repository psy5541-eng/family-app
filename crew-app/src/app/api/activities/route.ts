import { NextRequest } from "next/server";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 전체 크루 운동 목록 (월 기준, 유저 정보 포함)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 200);
  const month = url.searchParams.get("month"); // "2026-03" 형식

  const db = getServerDb();

  // 월 범위 계산
  const now = new Date();
  const [year, m] = month
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 0, 23, 59, 59);

  // 해당 월의 전체 활동 (public + 본인)
  const activities = await db
    .select({
      id: schema.activities.id,
      userId: schema.activities.userId,
      garminActivityId: schema.activities.garminActivityId,
      activityType: schema.activities.activityType,
      title: schema.activities.title,
      startTime: schema.activities.startTime,
      duration: schema.activities.duration,
      distance: schema.activities.distance,
      pace: schema.activities.pace,
      heartRate: schema.activities.heartRate,
      calories: schema.activities.calories,
      elevation: schema.activities.elevation,
      elevationLoss: schema.activities.elevationLoss,
      pointsEarned: schema.activities.pointsEarned,
      visibility: schema.activities.visibility,
      createdAt: schema.activities.createdAt,
      userNickname: schema.users.nickname,
      userProfileImage: schema.users.profileImage,
    })
    .from(schema.activities)
    .leftJoin(schema.users, eq(schema.activities.userId, schema.users.id))
    .where(
      and(
        sql`(${schema.activities.visibility} = 'public' OR ${schema.activities.userId} = ${user.id})`,
        gte(schema.activities.startTime, monthStart),
        lte(schema.activities.startTime, monthEnd)
      )
    )
    .orderBy(desc(schema.activities.startTime))
    .limit(limit)
    .offset((page - 1) * limit);

  // 내 해당 월 통계
  const statsResult = await db
    .select({
      totalDistance: sql<number>`COALESCE(SUM(${schema.activities.distance}), 0)`,
      totalDuration: sql<number>`COALESCE(SUM(${schema.activities.duration}), 0)`,
      totalElevation: sql<number>`COALESCE(SUM(${schema.activities.elevation}), 0)`,
      activityCount: sql<number>`COUNT(*)`,
      totalPoints: sql<number>`COALESCE(SUM(${schema.activities.pointsEarned}), 0)`,
    })
    .from(schema.activities)
    .where(
      and(
        eq(schema.activities.userId, user.id),
        gte(schema.activities.startTime, monthStart),
        lte(schema.activities.startTime, monthEnd)
      )
    )
    .then((r) => r[0]);

  return Response.json({
    success: true,
    data: {
      activities,
      currentUserId: user.id,
      stats: {
        totalDistance: Math.round((statsResult?.totalDistance ?? 0) * 100) / 100,
        totalDuration: statsResult?.totalDuration ?? 0,
        totalElevation: Math.round((statsResult?.totalElevation ?? 0) * 10) / 10,
        activityCount: statsResult?.activityCount ?? 0,
        totalPoints: statsResult?.totalPoints ?? 0,
      },
      page,
      limit,
    },
  });
}
