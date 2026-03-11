import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 포인트 설정 조회
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const db = getServerDb();
  const settings = await db.select().from(schema.pointSettings).limit(1).then((r) => r[0]);

  if (!settings) {
    // 기본값 반환
    return Response.json({
      success: true,
      data: {
        pointsPerKm: 10,
        bonus10km: 50,
        bonusHalfMarathon: 200,
        bonusFullMarathon: 500,
        multiplierRunning: 1.0,
        multiplierTrail: 1.5,
        multiplierWalking: 0.5,
        pointsPer100mElevation: 10,
      },
    });
  }

  return Response.json({ success: true, data: settings });
}

// PUT: 포인트 설정 수정
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json() as {
    pointsPerKm?: number;
    bonus10km?: number;
    bonusHalfMarathon?: number;
    bonusFullMarathon?: number;
    multiplierRunning?: number;
    multiplierTrail?: number;
    multiplierWalking?: number;
    pointsPer100mElevation?: number;
  };

  const db = getServerDb();
  const existing = await db.select({ id: schema.pointSettings.id }).from(schema.pointSettings).limit(1).then((r) => r[0]);
  const now = new Date();

  const data = {
    pointsPerKm: body.pointsPerKm ?? 10,
    bonus10km: body.bonus10km ?? 50,
    bonusHalfMarathon: body.bonusHalfMarathon ?? 200,
    bonusFullMarathon: body.bonusFullMarathon ?? 500,
    multiplierRunning: body.multiplierRunning ?? 1.0,
    multiplierTrail: body.multiplierTrail ?? 1.5,
    multiplierWalking: body.multiplierWalking ?? 0.5,
    pointsPer100mElevation: body.pointsPer100mElevation ?? 10,
    updatedAt: now,
    updatedBy: user.id,
  };

  if (existing) {
    await db.update(schema.pointSettings).set(data).where(eq(schema.pointSettings.id, existing.id));
  } else {
    await db.insert(schema.pointSettings).values({ id: crypto.randomUUID(), ...data });
  }

  return Response.json({ success: true });
}
