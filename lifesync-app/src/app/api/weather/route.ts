import { NextRequest } from "next/server";

const API_KEY = process.env.WEATHER_API_KEY;

const SKY_CODE: Record<string, { text: string; emoji: string }> = {
  "1": { text: "맑음",    emoji: "☀️" },
  "3": { text: "구름많음", emoji: "⛅" },
  "4": { text: "흐림",    emoji: "☁️" },
};
const PTY_CODE: Record<string, { text: string; emoji: string }> = {
  "0": { text: "없음",  emoji: "" },
  "1": { text: "비",    emoji: "🌧️" },
  "2": { text: "비/눈", emoji: "🌨️" },
  "3": { text: "눈",    emoji: "❄️" },
  "4": { text: "소나기", emoji: "🌦️" },
};

type HourlyItem = {
  time: string;   // "14:00"
  temp: number;
  emoji: string;
  pty: string;
};

type WeatherData = {
  temp: number;
  feelsLike: number;
  humidity: number;
  sky: string;
  skyEmoji: string;
  pty: string;
  windSpeed: number;
  location: string;
  updatedAt: string;
  minTemp: number;
  maxTemp: number;
  hourlyForecast: HourlyItem[];
};

// 기상청 발표시각 계산 (매 3시간: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)
function getBaseTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = kst.getUTCHours();
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = baseTimes[0];
  for (const t of baseTimes) {
    if (h >= t + 1) baseHour = t;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}`;
  return { baseDate: dateStr, baseTime: `${pad(baseHour)}00` };
}

// 시간 포맷: "1400" → "14:00"
function formatFcstTime(fcstTime: string): string {
  return `${fcstTime.slice(0, 2)}:${fcstTime.slice(2)}`;
}

// mock 시간대별 예보 생성 (현재 시간 기준 +3h씩 8개)
function buildMockHourly(): HourlyItem[] {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const baseTemp = 18;
  const result: HourlyItem[] = [];
  for (let i = 1; i <= 8; i++) {
    const t = new Date(kstNow.getTime() + i * 3 * 60 * 60 * 1000);
    const h = t.getUTCHours();
    const m = t.getUTCMinutes();
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const deltaTemp = Math.round((Math.sin((h / 24) * Math.PI * 2 - Math.PI / 2) * 4));
    result.push({ time: label, temp: baseTemp + deltaTemp, emoji: i <= 3 ? "☀️" : "⛅", pty: "없음" });
  }
  return result;
}

// GET /api/weather?nx=60&ny=127&location=서울
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const nx = searchParams.get("nx") ?? "60";
  const ny = searchParams.get("ny") ?? "127";
  const location = searchParams.get("location") ?? "서울";

  // API 키 미설정 → mock 반환
  if (!API_KEY || API_KEY.includes("your_")) {
    const hourly = buildMockHourly();
    const temps = [hourly[0].temp, ...hourly.map((h) => h.temp)];
    const mockData: WeatherData = {
      temp: 18,
      feelsLike: 16,
      humidity: 55,
      sky: "맑음",
      skyEmoji: "☀️",
      pty: "없음",
      windSpeed: 2.5,
      location,
      updatedAt: new Date().toISOString(),
      minTemp: Math.min(...temps) - 2,
      maxTemp: Math.max(...temps) + 1,
      hourlyForecast: hourly,
    };
    return Response.json({ success: true, data: mockData });
  }

  try {
    const { baseDate, baseTime } = getBaseTime();
    const url = new URL("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst");
    url.searchParams.set("serviceKey", API_KEY);
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "300");
    url.searchParams.set("dataType", "JSON");
    url.searchParams.set("base_date", baseDate);
    url.searchParams.set("base_time", baseTime);
    url.searchParams.set("nx", nx);
    url.searchParams.set("ny", ny);

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    const json = await res.json();
    const items: Array<{ category: string; fcstValue: string; fcstTime: string; fcstDate: string }> =
      json?.response?.body?.items?.item ?? [];

    // 예보 시간 그룹화
    const timeGroups = new Map<string, Map<string, string>>();
    for (const item of items) {
      const key = `${item.fcstDate}${item.fcstTime}`;
      if (!timeGroups.has(key)) timeGroups.set(key, new Map());
      timeGroups.get(key)!.set(item.category, item.fcstValue);
    }

    const sortedKeys = Array.from(timeGroups.keys()).sort();
    const firstKey = sortedKeys[0];
    const current = timeGroups.get(firstKey) ?? new Map();

    const get = (cat: string) => current.get(cat) ?? "";
    const skyCode = get("SKY");
    const ptyCode = get("PTY");
    const sky = ptyCode !== "0" ? (PTY_CODE[ptyCode]?.text ?? "비") : (SKY_CODE[skyCode]?.text ?? "맑음");
    const skyEmoji = ptyCode !== "0" ? (PTY_CODE[ptyCode]?.emoji ?? "🌧️") : (SKY_CODE[skyCode]?.emoji ?? "☀️");

    // 시간대별 예보 (최대 8개 = 24시간)
    const hourlyForecast: HourlyItem[] = sortedKeys.slice(0, 9).map((key) => {
      const g = timeGroups.get(key)!;
      const fSky = g.get("SKY") ?? "1";
      const fPty = g.get("PTY") ?? "0";
      const emoji = fPty !== "0" ? (PTY_CODE[fPty]?.emoji ?? "🌧️") : (SKY_CODE[fSky]?.emoji ?? "☀️");
      const fcstTime = key.slice(8); // last 4 chars = HHMM
      return {
        time: formatFcstTime(fcstTime),
        temp: Number(g.get("TMP") ?? 0),
        emoji,
        pty: PTY_CODE[fPty]?.text ?? "없음",
      };
    });

    // 오늘 최저/최고 기온
    const todayKey = sortedKeys[0]?.slice(0, 8);
    const todayTemps = sortedKeys
      .filter((k) => k.startsWith(todayKey ?? ""))
      .map((k) => Number(timeGroups.get(k)?.get("TMP") ?? 0))
      .filter((t) => t !== 0);
    const minTemp = todayTemps.length ? Math.min(...todayTemps) : Number(get("TMN") || get("TMP"));
    const maxTemp = todayTemps.length ? Math.max(...todayTemps) : Number(get("TMX") || get("TMP"));

    const data: WeatherData = {
      temp: Number(get("TMP")),
      feelsLike: Number(get("WSD")) * 3.6 < 10 ? Number(get("TMP")) - 3 : Number(get("TMP")),
      humidity: Number(get("REH")),
      sky,
      skyEmoji,
      pty: PTY_CODE[ptyCode]?.text ?? "없음",
      windSpeed: Number(get("WSD")),
      location,
      updatedAt: new Date().toISOString(),
      minTemp,
      maxTemp,
      hourlyForecast,
    };

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: "날씨 정보를 가져오지 못했습니다." }, { status: 502 });
  }
}
