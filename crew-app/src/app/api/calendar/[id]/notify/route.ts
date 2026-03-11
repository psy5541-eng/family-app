import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { sendMulticastPush } from "@/lib/fcm/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/calendar/[id]/notify — 참석자에게 FCM 알림 전송
// 일정 알림 시간이 되면 클라이언트에서 호출
export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { id: eventId } = await params;
  const db = getServerDb();

  // 일정 조회
  const event = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, eventId))
    .limit(1)
    .then((r) => r[0]);

  if (!event) {
    return Response.json({ success: false, error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }

  // 참석자 목록 조회 (joined 상태만)
  const participants = await db
    .select({
      userId: schema.eventParticipants.userId,
      fcmToken: schema.users.fcmToken,
    })
    .from(schema.eventParticipants)
    .leftJoin(schema.users, eq(schema.eventParticipants.userId, schema.users.id))
    .where(
      and(
        eq(schema.eventParticipants.eventId, eventId),
        eq(schema.eventParticipants.status, "joined")
      )
    );

  // 참석자 FCM 토큰만 수집 (이벤트 작성자 제외 - 작성자는 로컬 알림으로 처리)
  const tokens = participants
    .filter((p) => p.fcmToken && p.userId !== event.userId)
    .map((p) => p.fcmToken!);

  if (tokens.length > 0) {
    await sendMulticastPush(
      tokens,
      `📅 ${event.title}`,
      "참석 중인 일정이 곧 시작됩니다.",
      { type: "calendar", eventId }
    ).catch(() => {});
  }

  return Response.json({ success: true, data: { sent: tokens.length } });
}
