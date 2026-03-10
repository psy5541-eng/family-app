import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getLocalDb, schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// POST /api/feed/[id]/like  →  좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: feedId } = await params;
  const db = getLocalDb();

  // 피드 존재 확인
  const feed = await db
    .select()
    .from(schema.feeds)
    .where(eq(schema.feeds.id, feedId))
    .limit(1)
    .then((r) => r[0]);

  if (!feed) {
    return Response.json(
      { success: false, error: "피드를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 이미 좋아요 여부 확인
  const existing = await db
    .select()
    .from(schema.feedLikes)
    .where(
      and(
        eq(schema.feedLikes.feedId, feedId),
        eq(schema.feedLikes.userId, user.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    // 좋아요 취소
    await db
      .delete(schema.feedLikes)
      .where(
        and(
          eq(schema.feedLikes.feedId, feedId),
          eq(schema.feedLikes.userId, user.id)
        )
      );
    return Response.json({
      success: true,
      data: { liked: false },
    });
  } else {
    // 좋아요 추가
    await db.insert(schema.feedLikes).values({
      id: crypto.randomUUID(),
      feedId,
      userId: user.id,
      createdAt: new Date(),
    });
    return Response.json({
      success: true,
      data: { liked: true },
    });
  }
}
