import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server"
import { schema } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// GET /api/calendar/dday  - D-day 일정 목록 (최대 10개, 날짜순)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = getServerDb();

  const events = await db
    .select()
    .from(schema.calendarEvents)
    .where(
      and(
        eq(schema.calendarEvents.userId, user.id),
        eq(schema.calendarEvents.isDday, true)
      )
    )
    .orderBy(schema.calendarEvents.startDate)
    .limit(10);

  return Response.json({ success: true, data: { events } });
}
