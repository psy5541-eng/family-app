import { NextRequest } from "next/server";

type NewsItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
};

// 네이버 뉴스 검색 API (서버 사이드)
async function fetchNaverNews(): Promise<NewsItem[]> {
  const clientId = process.env.NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return getMockNews();
  }

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent("오늘 주요뉴스")}&display=5&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        next: { revalidate: 600 }, // 10분 캐시
      }
    );

    if (!res.ok) return getMockNews();

    const json = await res.json();
    return (json.items ?? []).slice(0, 5).map((item: { title: string; link: string; description: string; pubDate: string }) => ({
      title: item.title.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
      link: item.link,
      description: item.description.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
      pubDate: item.pubDate,
      source: "네이버 뉴스",
    }));
  } catch {
    return getMockNews();
  }
}

function getMockNews(): NewsItem[] {
  return [
    { title: "주요 뉴스를 불러올 수 없습니다", link: "https://news.naver.com", description: "네이버 뉴스에서 최신 뉴스를 확인하세요.", pubDate: new Date().toISOString(), source: "LifeSync" },
  ];
}

export async function GET(_request: NextRequest) {
  const news = await fetchNaverNews();
  return Response.json({
    success: true,
    data: { news, updatedAt: new Date().toISOString() },
  });
}
