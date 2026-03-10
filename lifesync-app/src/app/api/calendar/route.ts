import { NextRequest } from "next/server";
import { eq, and, or, gte, lt, lte, isNotNull } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import * as schema from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { sendMulticastPush } from "@/lib/fcm/server";

// GET /api/calendar?year=YYYY&month=MM
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = getServerDb();
  const { searchParams } = request.nextUrl;

  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  // 해당 월 범위
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  // 내 일정 + 공유된 일정 (startDate가 이 달에 포함되거나, endDate가 이 달에 걸치는 일정)
  const events = await db
    .select({
      id: schema.calendarEvents.id,
      userId: schema.calendarEvents.userId,
      title: schema.calendarEvents.title,
      description: schema.calendarEvents.description,
      startDate: schema.calendarEvents.startDate,
      endDate: schema.calendarEvents.endDate,
      isAllDay: schema.calendarEvents.isAllDay,
      isDday: schema.calendarEvents.isDday,
      placeName: schema.calendarEvents.placeName,
      placeAddress: schema.calendarEvents.placeAddress,
      latitude: schema.calendarEvents.latitude,
      longitude: schema.calendarEvents.longitude,
      naverPlaceId: schema.calendarEvents.naverPlaceId,
      notifyBefore: schema.calendarEvents.notifyBefore,
      isShared: schema.calendarEvents.isShared,
      color: schema.calendarEvents.color,
      createdAt: schema.calendarEvents.createdAt,
      updatedAt: schema.calendarEvents.updatedAt,
      ownerNickname: schema.users.nickname,
      ownerProfileImage: schema.users.profileImage,
    })
    .from(schema.calendarEvents)
    .leftJoin(schema.users, eq(schema.calendarEvents.userId, schema.users.id))
    .where(
      and(
        or(
          eq(schema.calendarEvents.userId, user.id),
          eq(schema.calendarEvents.isShared, true)
        ),
        // startDate가 이 달 범위이거나, endDate가 이 달에 걸치는 일정
        or(
          and(
            gte(schema.calendarEvents.startDate, startOfMonth),
            lt(schema.calendarEvents.startDate, startOfNextMonth)
          ),
          and(
            lte(schema.calendarEvents.startDate, startOfNextMonth),
            gte(schema.calendarEvents.endDate, startOfMonth)
          )
        )
      )
    )
    .orderBy(schema.calendarEvents.startDate);

  return Response.json({ success: true, data: { events } });
}

// POST /api/calendar
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = getServerDb();
  const body = await request.json() as {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    isDday?: boolean;
    placeName?: string;
    placeAddress?: string;
    latitude?: string;
    longitude?: string;
    naverPlaceId?: string;
    notifyBefore?: number;
    isShared?: boolean;
    color?: string;
  };

  if (!body.title?.trim()) {
    return Response.json({ success: false, error: "제목을 입력해주세요." }, { status: 400 });
  }
  if (!body.startDate) {
    return Response.json({ success: false, error: "시작 날짜를 입력해주세요." }, { status: 400 });
  }

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(schema.calendarEvents).values({
    id,
    userId: user.id,
    title: body.title.trim(),
    description: body.description?.trim() ?? null,
    startDate: new Date(body.startDate),
    endDate: body.endDate ? new Date(body.endDate) : null,
    isAllDay: body.isAllDay ?? false,
    isDday: body.isDday ?? false,
    placeName: body.placeName ?? null,
    placeAddress: body.placeAddress ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    naverPlaceId: body.naverPlaceId ?? null,
    notifyBefore: body.notifyBefore ?? null,
    isShared: body.isShared ?? false,
    color: body.color ?? "primary",
    createdAt: now,
    updatedAt: now,
  });

  const event = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, id))
    .limit(1)
    .then((r) => r[0]);

  // FCM 푸시 알림: 모든 사용자에게 일정 등록 알림
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
      "새 일정",
      `${body.title!.trim()} 일정이 등록되었습니다.`,
      { type: "calendar", eventId: id }
    ).catch(() => {});
  }

  return Response.json({ success: true, data: { event } }, { status: 201 });
}
