import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import * as schema from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";

// POST /api/feed/[id]/comments/like  →  댓글 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  // feedId는 URL에서 가져오지만 실제로는 commentId만 사용
  await params; // consume params
  const db = getServerDb();
  const body = await request.json() as { commentId?: string };

  if (!body.commentId) {
    return Response.json(
      { success: false, error: "commentId가 필요합니다." },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(schema.commentLikes)
    .where(
      and(
        eq(schema.commentLikes.commentId, body.commentId),
        eq(schema.commentLikes.userId, user.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    await db
      .delete(schema.commentLikes)
      .where(
        and(
          eq(schema.commentLikes.commentId, body.commentId),
          eq(schema.commentLikes.userId, user.id)
        )
      );
    return Response.json({ success: true, data: { liked: false } });
  } else {
    await db.insert(schema.commentLikes).values({
      id: crypto.randomUUID(),
      commentId: body.commentId,
      userId: user.id,
      createdAt: new Date(),
    });
    return Response.json({ success: true, data: { liked: true } });
  }
}
