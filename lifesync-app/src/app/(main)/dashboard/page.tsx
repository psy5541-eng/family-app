"use client";

import { useState, useEffect } from "react";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import StockWidget from "@/components/dashboard/StockWidget";
import DdayWidget from "@/components/dashboard/DdayWidget";
import { useAuth } from "@/hooks/useAuth";

const QUOTES = [
  { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤저민 프랭클린" },
  { text: "삶이 있는 한 희망은 있다.", author: "키케로" },
  { text: "행복은 습관이다. 그것을 몸에 지녀라.", author: "허버드" },
  { text: "작은 기회로부터 종종 위대한 업적이 시작된다.", author: "데모스테네스" },
  { text: "실패란 넘어지는 것이 아니라 넘어진 채로 있는 것이다.", author: "메리 피커포드" },
  { text: "시작이 반이다.", author: "아리스토텔레스" },
  { text: "가장 큰 영광은 한 번도 실패하지 않음이 아니라, 실패할 때마다 다시 일어서는 데 있다.", author: "공자" },
  { text: "인생에서 가장 중요한 것은 자기 자신을 찾는 것이다.", author: "소크라테스" },
  { text: "현재를 즐겨라. 그것이 삶의 전부다.", author: "호라티우스" },
  { text: "꿈을 이루고 싶다면 먼저 꿈에서 깨어나라.", author: "무하마드 알리" },
  { text: "배움에는 왕도가 없다.", author: "유클리드" },
  { text: "천 리 길도 한 걸음부터.", author: "노자" },
  { text: "오늘 하루도 당신은 충분히 멋집니다.", author: "" },
  { text: "할 수 있다고 믿으면 이미 반은 이룬 것이다.", author: "시어도어 루즈벨트" },
  { text: "지금 이 순간이 선물이다.", author: "엘리너 루즈벨트" },
  { text: "용기란 두려움이 없는 것이 아니라, 두려움보다 더 중요한 것이 있다고 판단하는 것이다.", author: "앰브로즈 레드문" },
  { text: "노력은 배신하지 않는다.", author: "" },
  { text: "성공은 매일의 작은 노력이 반복된 결과이다.", author: "로버트 콜리어" },
  { text: "위대한 일은 작은 일들이 모여서 이루어진다.", author: "빈센트 반 고흐" },
  { text: "변화를 두려워하지 마라. 그것이 성장의 시작이다.", author: "" },
  { text: "매일 조금씩 나아지면 된다.", author: "" },
  { text: "뜻이 있는 곳에 길이 있다.", author: "한국 속담" },
  { text: "가장 어두운 밤도 결국 밝아진다.", author: "윌리엄 셰익스피어" },
  { text: "삶은 가까이서 보면 비극이지만, 멀리서 보면 희극이다.", author: "찰리 채플린" },
  { text: "행동은 말보다 강하다.", author: "에이브러햄 링컨" },
  { text: "상상력은 지식보다 중요하다.", author: "알베르트 아인슈타인" },
  { text: "오늘이 나머지 인생의 첫날이다.", author: "찰스 디더릭" },
  { text: "끝날 때까지 끝난 게 아니다.", author: "요기 베라" },
  { text: "세상에서 가장 용감한 행동은 스스로 생각하고 그것을 큰 소리로 말하는 것이다.", author: "코코 샤넬" },
  { text: "미래는 현재 우리가 무엇을 하느냐에 달려 있다.", author: "마하트마 간디" },
];

function getDailyQuote() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return QUOTES[seed % QUOTES.length];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 오늘의 명언 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
        <p className="text-xs text-purple-500 dark:text-purple-400 font-semibold mb-1.5">
          오늘의 명언
        </p>
        {quote && (
          <>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              &ldquo;{quote.text}&rdquo;
            </p>
            {quote.author && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-right">
                — {quote.author}
              </p>
            )}
          </>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {user?.nickname ?? ""}님, 오늘도 좋은 하루 되세요!
        </p>
      </div>

      {/* 날씨 위젯 — 클릭 시 기상청 */}
      <a
        href="https://www.weather.go.kr"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <WeatherWidget />
      </a>

      {/* 증시 + D-day */}
      <div className="grid grid-cols-1 fold-open:grid-cols-2 gap-4">
        <a
          href="https://finance.naver.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <StockWidget />
        </a>
        <DdayWidget />
      </div>
    </div>
  );
}
