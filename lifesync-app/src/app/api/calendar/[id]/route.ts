import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import { schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/calendar/[id]
export async function GET(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const db = getServerDb();

  const event = await db
    .select()
    .from(schema.calendarEvents)
    .where(and(eq(schema.calendarEvents.id, id), eq(schema.calendarEvents.userId, user.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!event) {
    return Response.json({ success: false, error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }

  return Response.json({ success: true, data: { event } });
}

// PUT /api/calendar/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const db = getServerDb();

  const existing = await db
    .select()
    .from(schema.calendarEvents)
    .where(and(eq(schema.calendarEvents.id, id), eq(schema.calendarEvents.userId, user.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return Response.json({ success: false, error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }

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

  if (body.title !== undefined && !body.title.trim()) {
    return Response.json({ success: false, error: "제목을 입력해주세요." }, { status: 400 });
  }

  await db
    .update(schema.calendarEvents)
    .set({
      title: body.title?.trim() ?? existing.title,
      description: body.description !== undefined ? body.description?.trim() ?? null : existing.description,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,
      isAllDay: body.isAllDay !== undefined ? body.isAllDay : existing.isAllDay,
      isDday: body.isDday !== undefined ? body.isDday : existing.isDday,
      placeName: body.placeName !== undefined ? body.placeName ?? null : existing.placeName,
      placeAddress: body.placeAddress !== undefined ? body.placeAddress ?? null : existing.placeAddress,
      latitude: body.latitude !== undefined ? body.latitude ?? null : existing.latitude,
      longitude: body.longitude !== undefined ? body.longitude ?? null : existing.longitude,
      naverPlaceId: body.naverPlaceId !== undefined ? body.naverPlaceId ?? null : existing.naverPlaceId,
      notifyBefore: body.notifyBefore !== undefined ? body.notifyBefore ?? null : existing.notifyBefore,
      updatedAt: new Date(),
    })
    .where(eq(schema.calendarEvents.id, id));

  const updated = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, id))
    .limit(1)
    .then((r) => r[0]);

  return Response.json({ success: true, data: { event: updated } });
}

// DELETE /api/calendar/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const db = getServerDb();

  const existing = await db
    .select()
    .from(schema.calendarEvents)
    .where(and(eq(schema.calendarEvents.id, id), eq(schema.calendarEvents.userId, user.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return Response.json({ success: false, error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }

  await db.delete(schema.calendarEvents).where(eq(schema.calendarEvents.id, id));

  return Response.json({ success: true, data: null });
}
