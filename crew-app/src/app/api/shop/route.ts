import { NextRequest } from "next/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 상점 아이템 목록
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category"); // hat, top, bottom, shoes, char_effect, text_effect

  const db = getServerDb();

  // 유저 캐릭터 성별 조회 (공용 + 내 성별 아이템만 표시)
  const character = await db
    .select({ base: schema.userCharacters.base })
    .from(schema.userCharacters)
    .where(eq(schema.userCharacters.userId, user.id))
    .limit(1)
    .then((r) => r[0]);
  const userGender = character?.base ?? "male";

  // 성별 필터: unisex + 내 성별
  const genderFilter = sql`(${schema.shopItems.gender} = 'unisex' OR ${schema.shopItems.gender} = ${userGender})`;

  // 전체 아이템 조회
  const items = category
    ? await db
        .select()
        .from(schema.shopItems)
        .where(
          and(
            eq(schema.shopItems.isActive, true),
            eq(schema.shopItems.category, category as "hat" | "top" | "bottom" | "shoes" | "char_effect" | "text_effect"),
            genderFilter
          )
        )
    : await db
        .select()
        .from(schema.shopItems)
        .where(and(eq(schema.shopItems.isActive, true), genderFilter));

  // 유저 인벤토리 (소유 여부)
  const inventory = await db
    .select({ itemId: schema.userInventory.itemId })
    .from(schema.userInventory)
    .where(eq(schema.userInventory.userId, user.id));
  const ownedIds = new Set(inventory.map((i) => i.itemId));

  // 유저 캐릭터 (장착 여부)
  const character = await db
    .select()
    .from(schema.userCharacters)
    .where(eq(schema.userCharacters.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  const equippedIds = new Set<string>();
  if (character) {
    if (character.equippedHat) equippedIds.add(character.equippedHat);
    if (character.equippedTop) equippedIds.add(character.equippedTop);
    if (character.equippedBottom) equippedIds.add(character.equippedBottom);
    if (character.equippedShoes) equippedIds.add(character.equippedShoes);
    if (character.equippedCharEffect) equippedIds.add(character.equippedCharEffect);
  }

  // 유저 포인트
  const points = await db
    .select({ currentPoints: schema.userPoints.currentPoints })
    .from(schema.userPoints)
    .where(eq(schema.userPoints.userId, user.id))
    .limit(1)
    .then((r) => r[0]?.currentPoints ?? 0);

  const itemsWithOwnership = items.map((item) => ({
    ...item,
    owned: ownedIds.has(item.id),
    equipped: equippedIds.has(item.id),
  }));

  return Response.json({
    success: true,
    data: {
      items: itemsWithOwnership,
      currentPoints: points,
    },
  });
}
