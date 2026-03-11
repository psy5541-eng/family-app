import { NextRequest } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    await deleteSession(token);
  }

  return Response.json({ success: true });
}
