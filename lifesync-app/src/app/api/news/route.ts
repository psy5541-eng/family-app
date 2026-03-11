import { NextRequest } from "next/server";

type NewsItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
};

// 네이버 검색 API - 뉴스
async function fetchNaverNews(): Promise<NewsItem[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Naver Search API keys not found:", { hasId: !!clientId, hasSecret: !!clientSecret });
    return [];
  }

  try {
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent("오늘 주요뉴스")}&display=5&sort=date`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      console.error("Naver News API error:", res.status, await res.text());
      return [];
    }

    const json = await res.json() as {
      items: { title: string; link: string; description: string; pubDate: string }[];
    };

    return (json.items || []).map((item) => ({
      title: item.title.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      link: item.link,
      description: item.description.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      pubDate: item.pubDate,
      source: "네이버 뉴스",
    }));
  } catch (err) {
    console.error("Naver News fetch error:", err);
    return [];
  }
}

export async function GET(_request: NextRequest) {
  const news = await fetchNaverNews();

  if (news.length === 0) {
    const hasId = !!process.env.NAVER_SEARCH_CLIENT_ID;
    const hasSecret = !!process.env.NAVER_SEARCH_CLIENT_SECRET;
    return Response.json({
      success: true,
      data: {
        news: [{ title: "뉴스를 불러올 수 없습니다.", link: "https://news.naver.com", description: `env: id=${hasId}, secret=${hasSecret}`, pubDate: new Date().toISOString(), source: "LifeSync" }],
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return Response.json({
    success: true,
    data: { news, updatedAt: new Date().toISOString() },
  });
}
