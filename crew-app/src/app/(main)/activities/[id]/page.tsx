"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Activity } from "@/types/db";
import LoadingOverlay from "@/components/common/LoadingOverlay";

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  running: "러닝",
  trail_running: "트레일 러닝",
  walking: "걷기",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPace(paceSeconds: number | null): string {
  if (!paceSeconds) return "-";
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

type Lap = { lapNum: number; distance: number; duration: number; pace: number };
type ElevationPoint = { distance: number; elevation: number };

// ── 랩 섹션 (탭 전환: 바차트 / 테이블) ──
function LapSection({ laps, fastestPace, slowestPace }: {
  laps: Lap[];
  fastestPace: number;
  slowestPace: number;
}) {
  const [tab, setTab] = useState<"chart" | "table">("chart");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">랩 페이스</h3>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setTab("chart")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              tab === "chart"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            차트
          </button>
          <button
            onClick={() => setTab("table")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              tab === "table"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            테이블
          </button>
        </div>
      </div>

      {tab === "chart" ? (
        <>
          <div className="space-y-1.5">
            {laps.map((lap) => {
              const isFastest = lap.pace === fastestPace;
              const range = slowestPace - fastestPace;
              const barWidth = range > 0
                ? 100 - ((lap.pace - fastestPace) / range) * 70
                : 100;
              const paceMin = Math.floor(lap.pace / 60);
              const paceSec = Math.round(lap.pace % 60);

              return (
                <div key={lap.lapNum} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-900 dark:text-gray-200 w-6 text-right shrink-0">
                    {lap.lapNum}
                  </span>
                  <div className="flex-1 h-6 bg-gray-50 dark:bg-gray-700/50 rounded overflow-hidden relative">
                    <div
                      className={`h-full rounded transition-all ${
                        isFastest ? "bg-red-500" : "bg-blue-600 dark:bg-blue-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[11px] font-bold text-white">
                      {paceMin}&apos;{paceSec.toString().padStart(2, "0")}&quot;
                      <span className="ml-auto text-[10px] text-gray-400 font-normal">
                        {lap.distance.toFixed(2)}km
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
              최고 랩
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />
              일반 랩
            </span>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="py-2 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-12">랩</th>
                <th className="py-2 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400">시간</th>
                <th className="py-2 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400">거리<br/><span className="font-normal">km</span></th>
                <th className="py-2 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400">평균 페이스<br/><span className="font-normal">min/km</span></th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => {
                const isFastest = lap.pace === fastestPace;
                const lapMin = Math.floor(lap.duration / 60);
                const lapSec = Math.round(lap.duration % 60);
                const paceMin = Math.floor(lap.pace / 60);
                const paceSec = Math.round(lap.pace % 60);
                return (
                  <tr key={lap.lapNum} className={`border-b border-gray-50 dark:border-gray-700/50 ${
                    isFastest ? "bg-red-50/50 dark:bg-red-900/10" : ""
                  }`}>
                    <td className={`py-2.5 text-sm font-semibold ${
                      isFastest ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                    }`}>{lap.lapNum}</td>
                    <td className="py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">
                      {lapMin}:{lapSec.toString().padStart(2, "0")}.0
                    </td>
                    <td className="py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">
                      {lap.distance.toFixed(2)}
                    </td>
                    <td className={`py-2.5 text-sm text-right font-semibold ${
                      isFastest ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                    }`}>
                      {paceMin}:{paceSec.toString().padStart(2, "0")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── 고도 차트 (SVG area chart) ──
function ElevationChart({ data }: { data: ElevationPoint[] }) {
  const [touchIdx, setTouchIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── 2) 터치 인터랙션 (hooks must be before early return) ──
  const maxDist = data.length >= 2 ? data[data.length - 1].distance : 0;
  const handleTouch = useCallback((clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetDist = ratio * maxDist;
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].distance - targetDist);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    }
    setTouchIdx(closest);
  }, [data, maxDist]);

  if (data.length < 2) return null;

  const minElev = Math.min(...data.map(d => d.elevation));
  const maxElev = Math.max(...data.map(d => d.elevation));
  const elevRange = maxElev - minElev || 1;

  const W = 360;
  const H = 140;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 25;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const toX = (dist: number) => (dist / maxDist) * W;
  const toY = (elev: number) => PAD_TOP + chartH - ((elev - minElev) / elevRange) * chartH;

  // ── 4) 구간별 오르막/내리막 색상 세그먼트 ──
  const segments: { path: string; color: string }[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    const x1 = toX(data[i].distance).toFixed(1);
    const y1 = toY(data[i].elevation).toFixed(1);
    const x2 = toX(data[i + 1].distance).toFixed(1);
    const y2 = toY(data[i + 1].elevation).toFixed(1);
    const diff = data[i + 1].elevation - data[i].elevation;
    const color = diff > 2 ? "#ef4444" : diff < -2 ? "#3b82f6" : "#9ca3af";
    segments.push({ path: `M${x1},${y1} L${x2},${y2}`, color });
  }

  // ── 1) 고도별 다색 그라데이션 (초록 → 주황 → 빨강) ──
  const elevStops = data.map(d => (d.elevation - minElev) / elevRange);
  const avgRatio = elevStops.reduce((a, b) => a + b, 0) / elevStops.length;
  const areaColor1 = avgRatio > 0.6 ? "#ef4444" : avgRatio > 0.3 ? "#f97316" : "#22c55e";
  const areaColor2 = "#22c55e";

  const linePath = data.map((d, i) =>
    `${i === 0 ? "M" : "L"}${toX(d.distance).toFixed(1)},${toY(d.elevation).toFixed(1)}`
  ).join(" ");
  const areaPath = `${linePath} L${W},${PAD_TOP + chartH} L0,${PAD_TOP + chartH} Z`;

  const yLabels = [minElev, minElev + elevRange / 2, maxElev].map(v => Math.round(v));

  const xCount = 5;
  const xLabels = Array.from({ length: xCount }, (_, i) => ((maxDist / (xCount - 1)) * i).toFixed(1));

  const touchPoint = touchIdx !== null ? data[touchIdx] : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">고도</h3>
        {touchPoint ? (
          <div className="flex gap-3 text-[11px] font-medium">
            <span className="text-blue-500">{touchPoint.distance.toFixed(1)}km</span>
            <span className="text-orange-500">{Math.round(touchPoint.elevation)}m</span>
          </div>
        ) : (
          <div className="flex gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <span>↑ {Math.round(maxElev)}m</span>
            <span>↓ {Math.round(minElev)}m</span>
          </div>
        )}
      </div>
      {/* 범례 */}
      <div className="flex gap-3 mb-2 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-red-500 rounded-full inline-block" />오르막</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-blue-500 rounded-full inline-block" />내리막</span>
      </div>
      <div className="relative">
        {/* ── 3) 3D 그림자 (blur) ── */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full absolute top-1 left-0 opacity-20 blur-sm pointer-events-none" preserveAspectRatio="none">
          <path d={areaPath} fill="#000" />
        </svg>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full relative touch-none"
          preserveAspectRatio="none"
          onTouchStart={(e) => handleTouch(e.touches[0].clientX)}
          onTouchMove={(e) => { e.preventDefault(); handleTouch(e.touches[0].clientX); }}
          onTouchEnd={() => setTouchIdx(null)}
          onMouseMove={(e) => handleTouch(e.clientX)}
          onMouseLeave={() => setTouchIdx(null)}
        >
          <defs>
            {/* ── 1) 고도별 컬러 그라데이션 ── */}
            <linearGradient id="elevGradMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor1} stopOpacity="0.7" />
              <stop offset="50%" stopColor={areaColor2} stopOpacity="0.3" />
              <stop offset="100%" stopColor={areaColor2} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* 배경 격자 */}
          {yLabels.map((v, i) => (
            <g key={i}>
              <line
                x1="0" x2={W}
                y1={toY(v)} y2={toY(v)}
                stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5" strokeDasharray="4,4"
              />
              <text x={W - 2} y={toY(v) - 3} textAnchor="end" className="text-gray-400 dark:text-gray-500" fontSize="7" fill="currentColor">
                {v}m
              </text>
            </g>
          ))}
          {/* 면적 */}
          <path d={areaPath} fill="url(#elevGradMulti)" />
          {/* ── 4) 구간별 오르막/내리막 컬러 라인 ── */}
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth="1.5" strokeLinecap="round" />
          ))}
          {/* ── 2) 터치 포인터 ── */}
          {touchPoint && (
            <>
              <line
                x1={toX(touchPoint.distance)} x2={toX(touchPoint.distance)}
                y1={PAD_TOP} y2={PAD_TOP + chartH}
                stroke="#f97316" strokeWidth="1" strokeDasharray="3,3" opacity="0.8"
              />
              <circle
                cx={toX(touchPoint.distance)} cy={toY(touchPoint.elevation)}
                r="4" fill="#f97316" stroke="white" strokeWidth="1.5"
              />
            </>
          )}
          {/* X축 레이블 */}
          {xLabels.map((v, i) => (
            <text
              key={i}
              x={toX(parseFloat(v))}
              y={H - 5}
              textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
              className="text-gray-400 dark:text-gray-500"
              fontSize="7"
              fill="currentColor"
            >
              {v}km
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, getAuthHeader } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities/${params.id}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) {
        setActivity(json.data);
      } else {
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.id, getAuthHeader, router]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  async function handleDelete() {
    if (!confirm("이 운동 기록을 삭제하시겠습니까? 획득한 포인트도 차감됩니다.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/activities/${params.id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (json.success) {
        router.back();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleVisibility() {
    if (!activity) return;
    const newVisibility = activity.visibility === "public" ? "private" : "public";
    const res = await fetch(`/api/activities/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ visibility: newVisibility }),
    });
    const json = await res.json();
    if (json.success) {
      setActivity({ ...activity, visibility: newVisibility });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activity) return null;

  const isOwner = activity.userId === user?.id;
  const startDate = new Date(activity.startTime);

  // 랩 데이터 파싱
  const laps: Lap[] = activity.laps ? JSON.parse(activity.laps as string) : [];
  const fastestPace = laps.length > 0 ? Math.min(...laps.map((l) => l.pace)) : 0;
  const slowestPace = laps.length > 0 ? Math.max(...laps.map((l) => l.pace)) : 0;

  // 고도 데이터 파싱
  const elevationPoints: ElevationPoint[] = activity.elevationData
    ? JSON.parse(activity.elevationData as string)
    : [];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      <LoadingOverlay visible={isDeleting} message="삭제 중..." />
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">운동 상세</h1>
        {isOwner && (
          <button
            onClick={toggleVisibility}
            className="text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700"
          >
            {activity.visibility === "public" ? "공개" : "비공개"}
          </button>
        )}
      </div>

      {/* 메인 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* 종목 + 날짜 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
              {ACTIVITY_TYPE_LABEL[activity.activityType]}
            </span>
            {activity.pointsEarned && activity.pointsEarned > 0 && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                +{activity.pointsEarned}P
              </span>
            )}
          </div>
          {activity.title && (
            <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{activity.title}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {startDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}{" "}
            {startDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* 주요 수치 */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-700 mx-4 rounded-xl overflow-hidden my-3">
          <div className="bg-white dark:bg-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{activity.distance.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">거리 (km)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatDuration(activity.duration)}</p>
            <p className="text-[10px] text-gray-400">시간</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPace(activity.pace)}</p>
            <p className="text-[10px] text-gray-400">페이스 (/km)</p>
          </div>
        </div>

        {/* 상세 수치 */}
        <div className="px-4 pb-4 space-y-2">
          {activity.heartRate && (
            <div className="flex justify-between items-center py-2 border-t border-gray-50 dark:border-gray-700/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">평균 심박수</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{activity.heartRate} bpm</span>
            </div>
          )}
          {activity.calories && (
            <div className="flex justify-between items-center py-2 border-t border-gray-50 dark:border-gray-700/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">소모 칼로리</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{activity.calories} kcal</span>
            </div>
          )}
          {activity.elevation && activity.elevation > 0 && (
            <div className="flex justify-between items-center py-2 border-t border-gray-50 dark:border-gray-700/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">누적 상승 고도</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{activity.elevation.toFixed(1)} m</span>
            </div>
          )}
          {activity.elevationLoss && activity.elevationLoss > 0 && (
            <div className="flex justify-between items-center py-2 border-t border-gray-50 dark:border-gray-700/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">누적 하강 고도</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{activity.elevationLoss.toFixed(1)} m</span>
            </div>
          )}
        </div>
      </div>

      {/* 랩 페이스 — 탭 전환 (바차트 / 테이블) */}
      {laps.length > 0 && (
        <LapSection laps={laps} fastestPace={fastestPace} slowestPace={slowestPace} />
      )}

      {/* 고도 차트 */}
      {elevationPoints.length > 0 && (
        <ElevationChart data={elevationPoints} />
      )}

      {/* 삭제 버튼 */}
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full mt-4 py-3 text-red-500 text-sm font-semibold bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          {isDeleting ? "삭제 중..." : "운동 기록 삭제"}
        </button>
      )}
    </div>
  );
}
