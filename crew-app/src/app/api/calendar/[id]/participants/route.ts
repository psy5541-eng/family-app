import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/calendar/[id]/participants — 참석자 목록
export async function GET(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { id } = await params;
  const db = getServerDb();

  const participants = await db
    .select({
      id: schema.eventParticipants.id,
      userId: schema.eventParticipants.userId,
      status: schema.eventParticipants.status,
      createdAt: schema.eventParticipants.createdAt,
      nickname: schema.users.nickname,
      profileImage: schema.users.profileImage,
    })
    .from(schema.eventParticipants)
    .leftJoin(schema.users, eq(schema.eventParticipants.userId, schema.users.id))
    .where(eq(schema.eventParticipants.eventId, id));

  return Response.json({ success: true, data: { participants } });
}

// POST /api/calendar/[id]/participants — 참석
export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: eventId } = await params;
  const db = getServerDb();

  // 일정 존재 + 공유 일정인지 확인
  const event = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, eventId))
    .limit(1)
    .then((r) => r[0]);

  if (!event) {
    return Response.json({ success: false, error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!event.isShared) {
    return Response.json({ success: false, error: "공유 일정만 참석할 수 있습니다." }, { status: 400 });
  }

  // 이미 참석 중인지 확인
  const existing = await db
    .select()
    .from(schema.eventParticipants)
    .where(
      and(
        eq(schema.eventParticipants.eventId, eventId),
        eq(schema.eventParticipants.userId, user.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    // 이미 있으면 상태를 joined로 업데이트
    await db
      .update(schema.eventParticipants)
      .set({ status: "joined", createdAt: new Date() })
      .where(eq(schema.eventParticipants.id, existing.id));
  } else {
    await db.insert(schema.eventParticipants).values({
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      status: "joined",
      createdAt: new Date(),
    });
  }

  return Response.json({ success: true, data: null }, { status: 201 });
}

// DELETE /api/calendar/[id]/participants — 참석 취소
export async function DELETE(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: eventId } = await params;
  const db = getServerDb();

  await db
    .delete(schema.eventParticipants)
    .where(
      and(
        eq(schema.eventParticipants.eventId, eventId),
        eq(schema.eventParticipants.userId, user.id)
      )
    );

  return Response.json({ success: true, data: null });
}
