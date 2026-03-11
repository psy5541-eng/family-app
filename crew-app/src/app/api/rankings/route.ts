import { NextRequest } from "next/server";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 랭킹 조회
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "monthly") as "monthly" | "yearly";
  const periodKey = url.searchParams.get("periodKey") ?? getCurrentPeriodKey(period);
  const sortBy = (url.searchParams.get("sortBy") ?? "distance") as "distance" | "elevation" | "count";

  const db = getServerDb();

  // 랭킹 캐시 확인
  const cached = await db
    .select()
    .from(schema.rankings)
    .where(
      and(
        eq(schema.rankings.period, period),
        eq(schema.rankings.periodKey, periodKey)
      )
    )
    .orderBy(
      sortBy === "elevation"
        ? desc(schema.rankings.totalElevation)
        : sortBy === "count"
          ? desc(schema.rankings.activityCount)
          : desc(schema.rankings.totalDistance)
    );

  // 캐시가 있으면 유저 정보 포함하여 반환
  if (cached.length > 0) {
    const userIds = cached.map((r) => r.userId);
    const users = await db
      .select({
        id: schema.users.id,
        nickname: schema.users.nickname,
        profileImage: schema.users.profileImage,
      })
      .from(schema.users);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const rankingsWithUser = cached.map((r, idx) => ({
      ...r,
      rank:
        sortBy === "elevation"
          ? r.elevationRank ?? idx + 1
          : sortBy === "count"
            ? idx + 1
            : r.distanceRank ?? idx + 1,
      user: userMap.get(r.userId) ?? { id: r.userId, nickname: "알 수 없음", profileImage: null },
    }));

    return Response.json({
      success: true,
      data: {
        rankings: rankingsWithUser,
        period,
        periodKey,
        sortBy,
      },
    });
  }

  // 캐시가 없으면 활동 데이터에서 직접 계산
  const { startDate, endDate } = getPeriodDates(period, periodKey);

  const rawRankings = await db
    .select({
      userId: schema.activities.userId,
      totalDistance: sql<number>`COALESCE(SUM(${schema.activities.distance}), 0)`,
      totalElevation: sql<number>`COALESCE(SUM(${schema.activities.elevation}), 0)`,
      totalTime: sql<number>`COALESCE(SUM(${schema.activities.duration}), 0)`,
      activityCount: sql<number>`COUNT(*)`,
    })
    .from(schema.activities)
    .where(
      and(
        gte(schema.activities.startTime, startDate),
        lte(schema.activities.startTime, endDate)
      )
    )
    .groupBy(schema.activities.userId)
    .orderBy(
      sortBy === "elevation"
        ? desc(sql`SUM(${schema.activities.elevation})`)
        : sortBy === "count"
          ? desc(sql`COUNT(*)`)
          : desc(sql`SUM(${schema.activities.distance})`)
    );

  // 유저 정보 가져오기
  const users = await db
    .select({
      id: schema.users.id,
      nickname: schema.users.nickname,
      profileImage: schema.users.profileImage,
    })
    .from(schema.users);
  const userMap = new Map(users.map((u) => [u.id, u]));

  // 순위 매기기
  const distanceSorted = [...rawRankings].sort((a, b) => b.totalDistance - a.totalDistance);
  const elevationSorted = [...rawRankings].sort((a, b) => b.totalElevation - a.totalElevation);

  const rankingsWithUser = rawRankings.map((r, idx) => ({
    userId: r.userId,
    totalDistance: Math.round(r.totalDistance * 100) / 100,
    totalElevation: Math.round(r.totalElevation * 10) / 10,
    totalTime: r.totalTime,
    activityCount: r.activityCount,
    distanceRank: distanceSorted.findIndex((d) => d.userId === r.userId) + 1,
    elevationRank: elevationSorted.findIndex((e) => e.userId === r.userId) + 1,
    rank: idx + 1,
    user: userMap.get(r.userId) ?? { id: r.userId, nickname: "알 수 없음", profileImage: null },
  }));

  // 랭킹 캐시 저장 (비동기)
  const now = new Date();
  for (const r of rankingsWithUser) {
    await db
      .insert(schema.rankings)
      .values({
        id: crypto.randomUUID(),
        period,
        periodKey,
        userId: r.userId,
        totalDistance: r.totalDistance,
        totalElevation: r.totalElevation,
        totalTime: r.totalTime,
        activityCount: r.activityCount,
        distanceRank: r.distanceRank,
        elevationRank: r.elevationRank,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  return Response.json({
    success: true,
    data: {
      rankings: rankingsWithUser,
      period,
      periodKey,
      sortBy,
    },
  });
}

// POST: 랭킹 갱신 (캐시 리셋)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getServerDb();
  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "monthly") as "monthly" | "yearly";
  const periodKey = url.searchParams.get("periodKey") ?? getCurrentPeriodKey(period);

  // 해당 기간 캐시 삭제
  await db
    .delete(schema.rankings)
    .where(
      and(
        eq(schema.rankings.period, period),
        eq(schema.rankings.periodKey, periodKey)
      )
    );

  return Response.json({ success: true, data: { message: "랭킹이 갱신됩니다." } });
}

// 유틸리티 함수
function getCurrentPeriodKey(period: "monthly" | "yearly"): string {
  const now = new Date();
  if (period === "yearly") return String(now.getFullYear());
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodDates(period: "monthly" | "yearly", periodKey: string) {
  if (period === "yearly") {
    const year = parseInt(periodKey);
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }
  const [year, month] = periodKey.split("-").map(Number);
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0, 23, 59, 59),
  };
}
