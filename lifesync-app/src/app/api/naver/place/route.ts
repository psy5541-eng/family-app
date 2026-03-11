import { NextRequest } from "next/server";

// GET /api/naver/place?query=검색어
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ success: false, error: "검색어를 입력해주세요." }, { status: 400 });
  }

  // 네이버 검색 API (Local Search) - 키워드 검색 지원
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Naver Search API keys not found");
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
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Naver Local Search error:", res.status, text);
      return Response.json({ success: false, error: `장소 검색 실패 (${res.status})` }, { status: 502 });
    }

    const json = await res.json() as {
      items: {
        title: string;
        link: string;
        category: string;
        description: string;
        telephone: string;
        address: string;
        roadAddress: string;
        mapx: string;
        mapy: string;
      }[];
    };

    if (!json.items || json.items.length === 0) {
      return Response.json({
        success: true,
        data: { items: [], message: "검색 결과가 없습니다." },
      });
    }

    // 네이버 Local Search의 mapx/mapy는 카텍(KATEC) 좌표
    const items = json.items.map((item, i) => {
      const katecX = parseInt(item.mapx, 10);
      const katecY = parseInt(item.mapy, 10);

      // KATEC → WGS84 근사 변환
      const longitude = (katecX / 10000000).toFixed(7);
      const latitude = (katecY / 10000000).toFixed(7);

      return {
        id: `naver-local-${i}-${item.mapx}-${item.mapy}`,
        name: item.title.replace(/<[^>]+>/g, ""),
        address: item.address,
        roadAddress: item.roadAddress,
        latitude,
        longitude,
        category: item.category,
      };
    });

    return Response.json({ success: true, data: { items } });
  } catch (err) {
    console.error("Place search error:", err);
    return Response.json({ success: false, error: "장소 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
