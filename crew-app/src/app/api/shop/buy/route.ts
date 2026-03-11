import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// POST: 아이템 구매
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json() as { itemId?: string };
  if (!body.itemId) {
    return Response.json({ success: false, error: "아이템 ID가 필요합니다." }, { status: 400 });
  }

  const db = getServerDb();

  // 아이템 조회
  const item = await db
    .select()
    .from(schema.shopItems)
    .where(and(eq(schema.shopItems.id, body.itemId), eq(schema.shopItems.isActive, true)))
    .limit(1)
    .then((r) => r[0]);

  if (!item) {
    return Response.json({ success: false, error: "아이템을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 소유 확인
  const existing = await db
    .select({ id: schema.userInventory.id })
    .from(schema.userInventory)
    .where(
      and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.itemId, body.itemId))
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return Response.json({ success: false, error: "이미 소유한 아이템입니다." }, { status: 400 });
  }

  // 포인트 확인
  const userPoint = await db
    .select()
    .from(schema.userPoints)
    .where(eq(schema.userPoints.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  const currentPoints = userPoint?.currentPoints ?? 0;
  if (currentPoints < item.price) {
    return Response.json({ success: false, error: "포인트가 부족합니다." }, { status: 400 });
  }

  const now = new Date();

  // 포인트 차감
  if (userPoint) {
    await db
      .update(schema.userPoints)
      .set({
        currentPoints: currentPoints - item.price,
        totalSpent: userPoint.totalSpent + item.price,
      })
      .where(eq(schema.userPoints.id, userPoint.id));
  }

  // 포인트 트랜잭션 기록
  await db.insert(schema.pointTransactions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    amount: -item.price,
    type: "spend",
    referenceId: item.id,
    description: `${item.name} 구매`,
    createdAt: now,
  });

  // 인벤토리에 추가
  await db.insert(schema.userInventory).values({
    id: crypto.randomUUID(),
    userId: user.id,
    itemId: body.itemId,
    purchasedAt: now,
  });

  return Response.json({
    success: true,
    data: { remainingPoints: currentPoints - item.price },
  });
}
