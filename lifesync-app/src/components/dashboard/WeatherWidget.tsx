"use client";

import { useEffect, useState } from "react";

type HourlyItem = {
  time: string;
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

// 위도/경도 → 기상청 격자 좌표 변환 (Lambert Conformal Conic)
function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  const ra = Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5);
  const ra2 = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  const nx = Math.floor(ra2 * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra2 * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(nx: number, ny: number, locationName: string) {
      try {
        const res = await fetch(`/api/weather?nx=${nx}&ny=${ny}&location=${encodeURIComponent(locationName)}`);
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError("날씨 정보 없음");
      } catch {
        setError("날씨 정보 없음");
      } finally {
        setIsLoading(false);
      }
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { nx, ny } = latLonToGrid(pos.coords.latitude, pos.coords.longitude);
          load(nx, ny, "내 위치");
        },
        () => {
          // 권한 거부 또는 오류 → 서울 기본값
          load(60, 127, "서울");
        },
        { timeout: 5000 }
      );
    } else {
      load(60, 127, "서울");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-white/30 rounded w-16 mb-3" />
        <div className="h-10 bg-white/30 rounded w-24 mb-2" />
        <div className="h-3 bg-white/30 rounded w-20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-4 shadow-sm">
        <p className="text-white/70 text-sm">날씨 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const updatedTime = new Date(data.updatedAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-2xl p-4 shadow-sm text-white">
      {/* 지역명 + 업데이트 시각 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span className="text-xs font-medium opacity-90">{data.location}</span>
        </div>
        <span className="text-[10px] opacity-60">{updatedTime} 기준</span>
      </div>

      {/* 온도 + 날씨 아이콘 */}
      <div className="flex items-end justify-between mt-2">
        <div>
          <div className="flex items-start">
            <span className="text-5xl font-thin leading-none">{Math.round(data.temp)}</span>
            <span className="text-xl font-light mt-1">°C</span>
          </div>
          <p className="text-sm font-medium mt-1 opacity-90">{data.sky}</p>
        </div>
        <div className="text-right">
          <span className="text-5xl leading-none" role="img" aria-label={data.sky}>
            {data.skyEmoji}
          </span>
          <div className="text-xs opacity-75 mt-1">
            <span>최저 {Math.round(data.minTemp)}°</span>
            <span className="mx-1">·</span>
            <span>최고 {Math.round(data.maxTemp)}°</span>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex gap-3 mt-2 text-xs opacity-80">
        <span>습도 {data.humidity}%</span>
        <span>·</span>
        <span>체감 {Math.round(data.feelsLike)}°C</span>
        <span>·</span>
        <span>바람 {data.windSpeed}m/s</span>
      </div>

      {/* 시간대별 예보 */}
      {data.hourlyForecast.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {data.hourlyForecast.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[3rem]">
                <span className="text-[10px] opacity-70">{item.time}</span>
                <span className="text-base leading-none">{item.emoji}</span>
                <span className="text-xs font-medium">{Math.round(item.temp)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
