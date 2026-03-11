import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getServerDb } from "@/lib/db/server";
import * as schema from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getServerDb();
  const account = await db
    .select({
      garminEmail: schema.garminAccounts.garminEmail,
      lastSyncAt: schema.garminAccounts.lastSyncAt,
    })
    .from(schema.garminAccounts)
    .where(eq(schema.garminAccounts.userId, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!account) {
    return Response.json({ success: true, data: { connected: false } });
  }

  return Response.json({
    success: true,
    data: {
      connected: true,
      garminEmail: account.garminEmail,
      lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
    },
  });
}
