import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 전체 상점 아이템 (관리자용 - 비활성 포함)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const db = getServerDb();
  const items = await db.select().from(schema.shopItems);

  return Response.json({ success: true, data: items });
}

// POST: 아이템 추가
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json() as {
    category: "hat" | "top" | "bottom" | "shoes" | "char_effect" | "text_effect";
    gender?: "unisex" | "male" | "female";
    name: string;
    price: number;
    rarity?: "common" | "rare" | "epic";
    previewImage?: string;
    assetFileName?: string;
    effectType?: string;
    effectColors?: string;
  };

  if (!body.category || !body.name || body.price == null) {
    return Response.json({ success: false, error: "카테고리, 이름, 가격은 필수입니다." }, { status: 400 });
  }

  const db = getServerDb();
  const now = new Date();

  const id = crypto.randomUUID();
  await db.insert(schema.shopItems).values({
    id,
    category: body.category,
    gender: body.gender ?? "unisex",
    name: body.name,
    price: body.price,
    rarity: body.rarity ?? "common",
    previewImage: body.previewImage ?? null,
    assetFileName: body.assetFileName ?? null,
    effectType: body.effectType ?? null,
    effectColors: body.effectColors ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ success: true, data: { id } });
}

// PATCH: 아이템 수정
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json() as {
    id: string;
    name?: string;
    gender?: "unisex" | "male" | "female";
    price?: number;
    rarity?: "common" | "rare" | "epic";
    previewImage?: string;
    effectType?: string;
    effectColors?: string;
    isActive?: boolean;
  };

  if (!body.id) {
    return Response.json({ success: false, error: "아이템 ID가 필요합니다." }, { status: 400 });
  }

  const db = getServerDb();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.rarity !== undefined) updateData.rarity = body.rarity;
  if (body.previewImage !== undefined) updateData.previewImage = body.previewImage;
  if (body.effectType !== undefined) updateData.effectType = body.effectType;
  if (body.effectColors !== undefined) updateData.effectColors = body.effectColors;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  await db.update(schema.shopItems).set(updateData).where(eq(schema.shopItems.id, body.id));

  return Response.json({ success: true });
}

// DELETE: 아이템 삭제
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "admin") {
    return Response.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ success: false, error: "아이템 ID가 필요합니다." }, { status: 400 });
  }

  const db = getServerDb();
  await db.delete(schema.shopItems).where(eq(schema.shopItems.id, id));

  return Response.json({ success: true });
}
