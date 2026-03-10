import { NextRequest } from "next/server";

type NewsItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
};

// 네이버 뉴스 RSS 피드 파싱 (API 키 불필요)
async function fetchNaverNewsRSS(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://news.naver.com/rss/main.xml", {
      headers: { "User-Agent": "LifeSync/1.0" },
    });

    if (!res.ok) return [];

    const xml = await res.text();

    // 간단한 XML 파싱 (RSS <item> 추출)
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const itemXml = match[1];
      const getTag = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
          ?? itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
        return m?.[1]?.trim() ?? "";
      };

      const title = getTag("title").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      const link = getTag("link");
      const description = getTag("description").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      const pubDate = getTag("pubDate");

      if (title && link) {
        items.push({ title, link, description, pubDate, source: "네이버 뉴스" });
      }
    }

    return items.length > 0 ? items : [];
  } catch (err) {
    console.error("RSS fetch error:", err);
    return [];
  }
}

export async function GET(_request: NextRequest) {
  const news = await fetchNaverNewsRSS();

  if (news.length === 0) {
    return Response.json({
      success: true,
      data: {
        news: [{ title: "뉴스를 불러오는 중입니다...", link: "https://news.naver.com", description: "네이버 뉴스에서 확인하세요.", pubDate: new Date().toISOString(), source: "LifeSync" }],
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return Response.json({
    success: true,
    data: { news, updatedAt: new Date().toISOString() },
  });
}
