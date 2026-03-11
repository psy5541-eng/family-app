import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

// GET: 내 캐릭터 조회
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getServerDb();

  const character = await db
    .select()
    .from(schema.userCharacters)
    .where(eq(schema.userCharacters.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!character) {
    return Response.json({
      success: true,
      data: {
        base: "unknown",
        skinTone: "#FFDBB4",
        equippedHat: null,
        equippedTop: null,
        equippedBottom: null,
        equippedShoes: null,
        equippedCharEffect: null,
        nicknameEffectType: null,
        nicknameEffectColors: null,
      },
    });
  }

  return Response.json({ success: true, data: character });
}

// PATCH: 캐릭터 수정 (기본 설정 + 장착)
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json() as {
    base?: "unknown" | "male" | "female";
    skinTone?: string;
    equippedHat?: string | null;
    equippedTop?: string | null;
    equippedBottom?: string | null;
    equippedShoes?: string | null;
    equippedCharEffect?: string | null;
    nicknameEffectType?: string | null;
    nicknameEffectColors?: string | null;
  };

  const db = getServerDb();

  const existing = await db
    .select({ id: schema.userCharacters.id })
    .from(schema.userCharacters)
    .where(eq(schema.userCharacters.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  const updateData: Record<string, unknown> = {};
  if (body.base !== undefined) updateData.base = body.base;
  if (body.skinTone !== undefined) updateData.skinTone = body.skinTone;
  if (body.equippedHat !== undefined) updateData.equippedHat = body.equippedHat;
  if (body.equippedTop !== undefined) updateData.equippedTop = body.equippedTop;
  if (body.equippedBottom !== undefined) updateData.equippedBottom = body.equippedBottom;
  if (body.equippedShoes !== undefined) updateData.equippedShoes = body.equippedShoes;
  if (body.equippedCharEffect !== undefined) updateData.equippedCharEffect = body.equippedCharEffect;
  if (body.nicknameEffectType !== undefined) updateData.nicknameEffectType = body.nicknameEffectType;
  if (body.nicknameEffectColors !== undefined) updateData.nicknameEffectColors = body.nicknameEffectColors;

  if (existing) {
    await db
      .update(schema.userCharacters)
      .set(updateData)
      .where(eq(schema.userCharacters.id, existing.id));
  } else {
    await db.insert(schema.userCharacters).values({
      id: crypto.randomUUID(),
      userId: user.id,
      base: body.base ?? "male",
      skinTone: body.skinTone ?? "#FFDBB4",
      equippedHat: body.equippedHat ?? null,
      equippedTop: body.equippedTop ?? null,
      equippedBottom: body.equippedBottom ?? null,
      equippedShoes: body.equippedShoes ?? null,
      equippedCharEffect: body.equippedCharEffect ?? null,
      nicknameEffectType: body.nicknameEffectType ?? null,
      nicknameEffectColors: body.nicknameEffectColors ?? null,
    });
  }

  return Response.json({ success: true });
}
