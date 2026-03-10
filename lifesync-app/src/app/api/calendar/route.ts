import { NextRequest } from "next/server";
import { eq, and, gte, lt } from "drizzle-orm";
import { getLocalDb, schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// GET /api/calendar?year=YYYY&month=MM
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = getLocalDb();
  const { searchParams } = request.nextUrl;

  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  // 해당 월 범위
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const events = await db
    .select()
    .from(schema.calendarEvents)
    .where(
      and(
        eq(schema.calendarEvents.userId, user.id),
        gte(schema.calendarEvents.startDate, startOfMonth),
        lt(schema.calendarEvents.startDate, startOfNextMonth)
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

  const db = getLocalDb();
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
    createdAt: now,
    updatedAt: now,
  });

  const event = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, id))
    .limit(1)
    .then((r) => r[0]);

  return Response.json({ success: true, data: { event } }, { status: 201 });
}
