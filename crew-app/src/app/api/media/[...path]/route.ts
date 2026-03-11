import { NextRequest } from "next/server";
import { getFromR2 } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const key = segments.join("/");

  // 경로 탈출 방지
  if (key.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await getFromR2(key);
  if (!result) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(result.buffer, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
