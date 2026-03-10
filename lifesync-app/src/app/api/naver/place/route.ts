import { NextRequest } from "next/server";

const CLIENT_ID = process.env.NAVER_MAP_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET;

type NaverLocalItem = {
  title: string;
  link: string;
  category: string;
  description: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

// GET /api/naver/place?query=검색어
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ success: false, error: "검색어를 입력해주세요." }, { status: 400 });
  }

  // Naver API 키 미설정 시 mock 데이터 반환
  if (!CLIENT_ID || CLIENT_ID.includes("your_naver")) {
    const mockItems = [
      {
        id: "mock-1",
        name: query + " 카페",
        address: "서울특별시 강남구 테헤란로 123",
        roadAddress: "서울특별시 강남구 테헤란로 123",
        latitude: "37.5000",
        longitude: "127.0000",
        category: "음식점>카페",
      },
      {
        id: "mock-2",
        name: query + " 레스토랑",
        address: "서울특별시 강남구 역삼동 456",
        roadAddress: "서울특별시 강남구 강남대로 456",
        latitude: "37.5010",
        longitude: "127.0010",
        category: "음식점>한식",
      },
    ];
    return Response.json({ success: true, data: { items: mockItems } });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&sort=random`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET!,
      },
    });

    if (!res.ok) {
      return Response.json({ success: false, error: "장소 검색에 실패했습니다." }, { status: 502 });
    }

    const json = await res.json() as { items: NaverLocalItem[] };

    const items = json.items.map((item, i) => ({
      id: `naver-${i}-${item.mapx}`,
      name: item.title.replace(/<[^>]+>/g, ""), // HTML 태그 제거
      address: item.address,
      roadAddress: item.roadAddress,
      // Naver mapx/mapy는 카텍 좌표 (EPSG:5181) → 소수점 변환
      latitude: (Number(item.mapy) / 1e7).toFixed(6),
      longitude: (Number(item.mapx) / 1e7).toFixed(6),
      category: item.category,
    }));

    return Response.json({ success: true, data: { items } });
  } catch {
    return Response.json({ success: false, error: "장소 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
