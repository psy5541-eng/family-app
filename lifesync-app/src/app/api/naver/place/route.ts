import { NextRequest } from "next/server";

// NCP (Naver Cloud Platform) Maps API 키
const NCP_KEY_ID = process.env.NAVER_MAP_CLIENT_ID;
const NCP_KEY = process.env.NAVER_MAP_CLIENT_SECRET;

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

  // NCP API 키 미설정 시 mock 데이터 반환
  if (!NCP_KEY_ID || NCP_KEY_ID.includes("your_naver")) {
    const mockItems = [
      {
        id: "mock-1",
        name: query + " 카페",
        address: "서울특별시 강남구 테헤란로 123",
        roadAddress: "서울특별시 강남구 테헤란로 123",
        latitude: "37.5000",
        longitude: "127.0000",
        category: "",
      },
      {
        id: "mock-2",
        name: query + " 레스토랑",
        address: "서울특별시 강남구 역삼동 456",
        roadAddress: "서울특별시 강남구 강남대로 456",
        latitude: "37.5010",
        longitude: "127.0010",
        category: "",
      },
    ];
    return Response.json({ success: true, data: { items: mockItems } });
  }

  try {
    // NCP Geocoding API 사용 (NCP 키로 인증)
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": NCP_KEY_ID,
        "X-NCP-APIGW-API-KEY": NCP_KEY!,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("NCP Geocoding error:", res.status, text);
      return Response.json({ success: false, error: "장소 검색에 실패했습니다." }, { status: 502 });
    }

    const json = await res.json() as { status: string; addresses: GeoAddress[] };

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
