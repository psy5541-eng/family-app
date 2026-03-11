import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 운동 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const db = getServerDb();

  const activity = await db
    .select()
    .from(schema.activities)
    .where(eq(schema.activities.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!activity) {
    return Response.json({ success: false, error: "운동 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  // 본인 또는 공개 활동만 조회 가능
  if (activity.userId !== user.id && activity.visibility === "private") {
    return Response.json({ success: false, error: "접근 권한이 없습니다." }, { status: 403 });
  }

  return Response.json({ success: true, data: activity });
}

// PATCH: 운동 기록 수정 (제목, 공개 여부)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { title?: string; visibility?: "public" | "private" };
  const db = getServerDb();

  const activity = await db
    .select({ id: schema.activities.id, userId: schema.activities.userId })
    .from(schema.activities)
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, user.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!activity) {
    return Response.json({ success: false, error: "운동 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(schema.activities)
      .set(updateData)
      .where(eq(schema.activities.id, id));
  }

  return Response.json({ success: true });
}

// DELETE: 운동 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const db = getServerDb();

  const activity = await db
    .select({
      id: schema.activities.id,
      userId: schema.activities.userId,
      pointsEarned: schema.activities.pointsEarned,
    })
    .from(schema.activities)
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, user.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!activity) {
    return Response.json({ success: false, error: "운동 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  // 포인트 차감 (활동 삭제 시)
  if (activity.pointsEarned && activity.pointsEarned > 0) {
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
          currentPoints: Math.max(0, existingPoints.currentPoints - activity.pointsEarned),
          totalEarned: Math.max(0, existingPoints.totalEarned - activity.pointsEarned),
        })
        .where(eq(schema.userPoints.id, existingPoints.id));
    }

    // 포인트 트랜잭션 기록
    await db.insert(schema.pointTransactions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      amount: -activity.pointsEarned,
      type: "spend",
      referenceId: activity.id,
      description: "운동 기록 삭제로 포인트 차감",
      createdAt: new Date(),
    });
  }

  // 활동 삭제
  await db.delete(schema.activities).where(eq(schema.activities.id, id));

  return Response.json({ success: true });
}
