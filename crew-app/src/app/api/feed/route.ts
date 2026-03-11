import { NextRequest } from "next/server";
import { eq, desc, lt, sql, isNotNull } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import * as schema from "@/lib/db/schema";
import { requireAuth, getCurrentUser } from "@/lib/auth/session";
import { sendMulticastPush } from "@/lib/fcm/server";
import type { FeedWithRelations, FeedMedia } from "@/types/db";

// GET /api/feed?cursor={lastId}&limit=10
export async function GET(request: NextRequest) {
  const db = getServerDb();
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor"); // 마지막 피드 ID
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 30);

  // 현재 사용자 (좋아요 여부 판단용, 없어도 OK)
  const currentUser = await getCurrentUser(request);

  // 피드 목록 조회 (커서 기반 페이지네이션)
  const feeds = await db
    .select({
      feed: schema.feeds,
      user: {
        id: schema.users.id,
        nickname: schema.users.nickname,
        profileImage: schema.users.profileImage,
      },
    })
    .from(schema.feeds)
    .innerJoin(schema.users, eq(schema.feeds.userId, schema.users.id))
    .where(cursor ? lt(schema.feeds.id, cursor) : undefined)
    .orderBy(desc(schema.feeds.createdAt))
    .limit(limit + 1); // +1로 다음 페이지 존재 여부 확인

  const hasMore = feeds.length > limit;
  const items = hasMore ? feeds.slice(0, limit) : feeds;
  const nextCursor = hasMore ? items[items.length - 1].feed.id : null;

  // 각 피드의 미디어, 좋아요 수, 댓글 수 조회
  const feedIds = items.map((r) => r.feed.id);

  const [mediaRows, likeRows, commentRows, userLikeRows] = await Promise.all([
    feedIds.length
      ? db
          .select()
          .from(schema.feedMedia)
          .where(sql`${schema.feedMedia.feedId} IN (${sql.join(feedIds.map((id) => sql`${id}`), sql`, `)})`)
      : [],
    feedIds.length
      ? db
          .select({
            feedId: schema.feedLikes.feedId,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(schema.feedLikes)
          .where(sql`${schema.feedLikes.feedId} IN (${sql.join(feedIds.map((id) => sql`${id}`), sql`, `)})`)
          .groupBy(schema.feedLikes.feedId)
      : [],
    feedIds.length
      ? db
          .select({
            feedId: schema.feedComments.feedId,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(schema.feedComments)
          .where(sql`${schema.feedComments.feedId} IN (${sql.join(feedIds.map((id) => sql`${id}`), sql`, `)})`)
          .groupBy(schema.feedComments.feedId)
      : [],
    // 현재 사용자의 좋아요 여부
    currentUser && feedIds.length
      ? db
          .select({ feedId: schema.feedLikes.feedId })
          .from(schema.feedLikes)
          .where(
            sql`${schema.feedLikes.feedId} IN (${sql.join(feedIds.map((id) => sql`${id}`), sql`, `)}) AND ${schema.feedLikes.userId} = ${currentUser.id}`
          )
      : [],
  ]);

  const mediaMap = new Map<string, FeedMedia[]>();
  for (const m of mediaRows) {
    if (!mediaMap.has(m.feedId)) mediaMap.set(m.feedId, []);
    mediaMap.get(m.feedId)!.push(m as FeedMedia);
  }

  const likeCountMap = new Map(likeRows.map((r) => [r.feedId, Number(r.count)]));
  const commentCountMap = new Map(commentRows.map((r) => [r.feedId, Number(r.count)]));
  const likedFeedIds = new Set(userLikeRows.map((r) => r.feedId));

  const result: FeedWithRelations[] = items.map(({ feed, user }) => ({
    ...feed,
    user,
    media: (mediaMap.get(feed.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    likes: [],
    comments: [],
    likeCount: likeCountMap.get(feed.id) ?? 0,
    commentCount: commentCountMap.get(feed.id) ?? 0,
    isLiked: likedFeedIds.has(feed.id),
  }));

  return Response.json({
    success: true,
    data: { feeds: result, nextCursor },
  });
}

// POST /api/feed
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = getServerDb();
  const body = await request.json() as {
    content?: string;
    mediaUrls?: Array<{ url: string; type: "image" | "video"; order: number }>;
  };

  if (!body.content?.trim() && (!body.mediaUrls || body.mediaUrls.length === 0)) {
    return Response.json(
      { success: false, error: "내용 또는 미디어를 입력해주세요." },
      { status: 400 }
    );
  }

  const feedId = crypto.randomUUID();
  const now = new Date();

  await db.insert(schema.feeds).values({
    id: feedId,
    userId: user.id,
    content: body.content?.trim() ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // 미디어 저장
  if (body.mediaUrls?.length) {
    await db.insert(schema.feedMedia).values(
      body.mediaUrls.map((m, i) => ({
        id: crypto.randomUUID(),
        feedId,
        mediaUrl: m.url,
        mediaType: m.type,
        order: m.order ?? i,
      }))
    );
  }

  const feed = await db
    .select()
    .from(schema.feeds)
    .where(eq(schema.feeds.id, feedId))
    .limit(1)
    .then((r) => r[0]);

  // FCM 푸시 알림: 작성자 제외한 모든 사용자에게 전송
  const tokenRows = await db
    .select({ fcmToken: schema.users.fcmToken })
    .from(schema.users)
    .where(isNotNull(schema.users.fcmToken));
  const tokens = tokenRows
    .map((r) => r.fcmToken!)
    .filter((t) => t.length > 0);
  if (tokens.length > 0) {
    sendMulticastPush(
      tokens,
      "새 게시물",
      `${user.nickname}님이 새 게시물을 올렸습니다.`,
      { type: "feed", feedId }
    ).catch(() => {});
  }

  return Response.json(
    { success: true, data: { feedId: feed.id } },
    { status: 201 }
  );
}
