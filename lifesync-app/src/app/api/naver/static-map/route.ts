import { NextRequest } from "next/server";

// GET /api/naver/static-map?lat=37.5&lng=127.0&w=400&h=200
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const w = searchParams.get("w") || "400";
  const h = searchParams.get("h") || "200";

  if (!lat || !lng) {
    return new Response("lat, lng required", { status: 400 });
  }

  const keyId = process.env.NAVER_MAP_CLIENT_ID;
  const key = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!keyId || !key) {
    // 키 없으면 빈 이미지 반환
    return new Response(null, { status: 204 });
  }

  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=${w}&h=${h}&center=${lng},${lat}&level=15&markers=type:d|size:mid|pos:${lng} ${lat}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": keyId,
        "X-NCP-APIGW-API-KEY": key,
      },
    });

    if (!res.ok) {
      return new Response(null, { status: 502 });
    }

    const imageBuffer = await res.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
