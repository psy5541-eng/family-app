import { NextRequest } from "next/server";

type GeoAddress = {
  roadAddress: string;
  jibunAddress: string;
  x: string; // longitude
  y: string; // latitude
  addressElements: { longName: string; shortName: string; code: string }[];
};

// GET /api/naver/place?query=검색어
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ success: false, error: "검색어를 입력해주세요." }, { status: 400 });
  }

  // Cloudflare Workers에서 env var는 요청 시점에 읽어야 안정적
  const NCP_KEY_ID = process.env.NAVER_MAP_CLIENT_ID;
  const NCP_KEY = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!NCP_KEY_ID || !NCP_KEY) {
    console.error("NCP API keys not found:", { hasId: !!NCP_KEY_ID, hasKey: !!NCP_KEY });
    return Response.json({
      success: true,
      data: {
        items: [{
          id: "mock-1",
          name: query,
          address: "API 키가 설정되지 않았습니다",
          roadAddress: "환경변수를 확인해주세요",
          latitude: "37.5000",
          longitude: "127.0000",
          category: "",
        }],
      },
    });
  }

  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": NCP_KEY_ID,
        "X-NCP-APIGW-API-KEY": NCP_KEY,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("NCP Geocoding error:", res.status, text);
      return Response.json({ success: false, error: `장소 검색 실패 (${res.status})` }, { status: 502 });
    }

    const json = await res.json() as { status: string; addresses: GeoAddress[] };

    if (!json.addresses || json.addresses.length === 0) {
      return Response.json({
        success: true,
        data: {
          items: [],
          message: "검색 결과가 없습니다. 도로명/지번 주소로 검색해보세요.",
        },
      });
    }

    const items = json.addresses.map((addr, i) => ({
      id: `ncp-${i}-${addr.x}-${addr.y}`,
      name: addr.roadAddress || addr.jibunAddress || query,
      address: addr.jibunAddress,
      roadAddress: addr.roadAddress,
      latitude: addr.y,
      longitude: addr.x,
      category: "",
    }));

    return Response.json({ success: true, data: { items } });
  } catch (err) {
    console.error("Place search error:", err);
    return Response.json({ success: false, error: "장소 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
