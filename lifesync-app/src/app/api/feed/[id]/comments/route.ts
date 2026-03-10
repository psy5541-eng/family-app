import { NextRequest } from "next/server";
import { eq, asc, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import { schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// GET /api/feed/[id]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedId } = await params;
  const db = getServerDb();

  const comments = await db
    .select({
      id: schema.feedComments.id,
      content: schema.feedComments.content,
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

  return Response.json({
    success: true,
    data: { comments },
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

  const body = await request.json() as { content?: string };

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

  const commentId = crypto.randomUUID();
  await db.insert(schema.feedComments).values({
    id: commentId,
    feedId,
    userId: user.id,
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
