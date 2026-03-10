import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getLocalDb, schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// DELETE /api/feed/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const db = getLocalDb();

  const feed = await db
    .select()
    .from(schema.feeds)
    .where(eq(schema.feeds.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!feed) {
    return Response.json(
      { success: false, error: "피드를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (feed.userId !== user.id && user.role !== "admin") {
    return Response.json(
      { success: false, error: "삭제 권한이 없습니다." },
      { status: 403 }
    );
  }

  // cascade로 미디어/좋아요/댓글도 자동 삭제
  await db.delete(schema.feeds).where(eq(schema.feeds.id, id));

  return Response.json({ success: true });
}
