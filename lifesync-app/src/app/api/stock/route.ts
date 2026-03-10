import { NextRequest } from "next/server";

const API_KEY = process.env.STOCK_API_KEY;

type StockItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: "stock" | "index";
};

type StockData = {
  items: StockItem[];
  updatedAt: string;
};

const DEFAULT_SYMBOLS = [
  { symbol: "005930.KS", name: "삼성전자", currency: "KRW", type: "stock" as const },
  { symbol: "AAPL",      name: "Apple",    currency: "USD", type: "stock" as const },
  { symbol: "TSLA",      name: "Tesla",    currency: "USD", type: "stock" as const },
];

// KOSPI/KOSDAQ 지수 (Alpha Vantage 미지원 → 항상 mock)
const INDEX_MOCK: StockItem[] = [
  { symbol: "KOSPI",  name: "KOSPI",  price: 2648.12, change: 15.43,  changePercent: 0.59,  currency: "KRW", type: "index" },
  { symbol: "KOSDAQ", name: "KOSDAQ", price: 857.34,  change: -3.21,  changePercent: -0.37, currency: "KRW", type: "index" },
];

// GET /api/stock?symbols=005930.KS,AAPL&includeIndex=true
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbolParam = searchParams.get("symbols");
  const includeIndex = searchParams.get("includeIndex") === "true";
  const requested = symbolParam
    ? symbolParam.split(",").map((s) => s.trim())
    : DEFAULT_SYMBOLS.map((s) => s.symbol);

  // API 키 미설정 → mock 반환
  if (!API_KEY || API_KEY.includes("your_")) {
    const stockMock: StockItem[] = [
      { symbol: "005930.KS", name: "삼성전자", price: 72400,  change: 800,   changePercent: 1.12,  currency: "KRW", type: "stock" },
      { symbol: "AAPL",      name: "Apple",    price: 213.49, change: -1.23, changePercent: -0.57, currency: "USD", type: "stock" },
      { symbol: "TSLA",      name: "Tesla",    price: 248.30, change: 5.60,  changePercent: 2.31,  currency: "USD", type: "stock" },
    ];
    const filteredMock: StockItem[] = stockMock.filter((i) => requested.includes(i.symbol));

    const items: StockItem[] = includeIndex ? [...INDEX_MOCK, ...filteredMock] : filteredMock;
    return Response.json({
      success: true,
      data: { items, updatedAt: new Date().toISOString() },
    });
  }

  // Alpha Vantage - 글로벌 시세 (GLOBAL_QUOTE)
  try {
    const results: StockItem[] = includeIndex ? [...INDEX_MOCK] : [];

    for (const symbol of requested.slice(0, 5)) {
      const meta = DEFAULT_SYMBOLS.find((s) => s.symbol === symbol);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 300 } }); // 5분 캐시
      const json = await res.json();
      const quote = json["Global Quote"];
      if (!quote || !quote["05. price"]) continue;

      results.push({
        symbol,
        name: meta?.name ?? symbol,
        price: Number(quote["05. price"]),
        change: Number(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"]),
        currency: meta?.currency ?? "USD",
        type: "stock",
      });
    }

    const data: StockData = { items: results, updatedAt: new Date().toISOString() };
    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: "증시 정보를 가져오지 못했습니다." }, { status: 502 });
  }
}
