import { NextRequest } from "next/server";
import { eq, asc, and, sql } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import * as schema from "@/lib/db/schema";
import { requireAuth, getCurrentUser } from "@/lib/auth/session";

// GET /api/feed/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedId } = await params;
  const db = getServerDb();
  const currentUser = await getCurrentUser(request);

  const comments = await db
    .select({
      id: schema.feedComments.id,
      content: schema.feedComments.content,
      parentId: schema.feedComments.parentId,
      createdAt: schema.feedComments.createdAt,
      user: {
        id: schema.users.id,
        nickname: schema.users.nickname,
        profileImage: schema.users.profileImage,
      },
    })
    .from(schema.feedComments)
    .innerJoin(schema.users, eq(schema.feedComments.userId, schema.users.id))
    .where(eq(schema.feedComments.feedId, feedId))
    .orderBy(asc(schema.feedComments.createdAt));

  // 댓글별 좋아요 수 조회
  const commentIds = comments.map((c) => c.id);
  const [likeCounts, userLikes] = await Promise.all([
    commentIds.length
      ? db
          .select({
            commentId: schema.commentLikes.commentId,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(schema.commentLikes)
          .where(sql`${schema.commentLikes.commentId} IN (${sql.join(commentIds.map((id) => sql`${id}`), sql`, `)})`)
          .groupBy(schema.commentLikes.commentId)
      : [],
    currentUser && commentIds.length
      ? db
          .select({ commentId: schema.commentLikes.commentId })
          .from(schema.commentLikes)
          .where(
            sql`${schema.commentLikes.commentId} IN (${sql.join(commentIds.map((id) => sql`${id}`), sql`, `)}) AND ${schema.commentLikes.userId} = ${currentUser.id}`
          )
      : [],
  ]);

  const likeCountMap = new Map(likeCounts.map((r) => [r.commentId, Number(r.count)]));
  const likedIds = new Set(userLikes.map((r) => r.commentId));

  const enriched = comments.map((c) => ({
    ...c,
    likeCount: likeCountMap.get(c.id) ?? 0,
    isLiked: likedIds.has(c.id),
  }));

  return Response.json({
    success: true,
    data: { comments: enriched },
  });
}

// POST /api/feed/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: feedId } = await params;
  const db = getServerDb();

  const body = await request.json() as { content?: string; parentId?: string };

  if (!body.content?.trim()) {
    return Response.json(
      { success: false, error: "댓글 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  if (body.content.length > 500) {
    return Response.json(
      { success: false, error: "댓글은 500자 이하로 입력해주세요." },
      { status: 400 }
    );
  }

  // 대댓글인 경우 부모 댓글 존재 확인
  if (body.parentId) {
    const parent = await db
      .select({ id: schema.feedComments.id })
      .from(schema.feedComments)
      .where(and(eq(schema.feedComments.id, body.parentId), eq(schema.feedComments.feedId, feedId)))
      .limit(1)
      .then((r) => r[0]);

    if (!parent) {
      return Response.json(
        { success: false, error: "부모 댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
  }

  const commentId = crypto.randomUUID();
  await db.insert(schema.feedComments).values({
    id: commentId,
    feedId,
    userId: user.id,
    parentId: body.parentId ?? null,
    content: body.content.trim(),
    createdAt: new Date(),
  });

  return Response.json(
    { success: true, data: { commentId } },
    { status: 201 }
  );
}

// DELETE /api/feed/[id]/comments?commentId={id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: feedId } = await params;
  const { searchParams } = request.nextUrl;
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return Response.json(
      { success: false, error: "commentId가 필요합니다." },
      { status: 400 }
    );
  }

  const db = getServerDb();

  const comment = await db
    .select()
    .from(schema.feedComments)
    .where(
      and(
        eq(schema.feedComments.id, commentId),
        eq(schema.feedComments.feedId, feedId)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!comment) {
    return Response.json(
      { success: false, error: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (comment.userId !== user.id && user.role !== "admin") {
    return Response.json(
      { success: false, error: "삭제 권한이 없습니다." },
      { status: 403 }
    );
  }

  await db.delete(schema.feedComments).where(eq(schema.feedComments.id, commentId));

  return Response.json({ success: true });
}
