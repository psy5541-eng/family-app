"use client";

import { useState, useEffect, useCallback } from "react";
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
  if (data.length < 2) return null;

  const minElev = Math.min(...data.map(d => d.elevation));
  const maxElev = Math.max(...data.map(d => d.elevation));
  const maxDist = data[data.length - 1].distance;
  const elevRange = maxElev - minElev || 1;

  const W = 360;
  const H = 120;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 25;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const toX = (dist: number) => (dist / maxDist) * W;
  const toY = (elev: number) => PAD_TOP + chartH - ((elev - minElev) / elevRange) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(d.distance).toFixed(1)},${toY(d.elevation).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${PAD_TOP + chartH} L0,${PAD_TOP + chartH} Z`;

  // Y축 레이블 (3개)
  const yLabels = [minElev, minElev + elevRange / 2, maxElev].map(v => Math.round(v));

  // X축 레이블 (시작, 중간, 끝)
  const xLabels = [0, maxDist / 2, maxDist].map(v => v.toFixed(1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">고도</h3>
        <div className="flex gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          <span>{Math.round(minElev)}m 최소</span>
          <span>{Math.round(maxElev)}m 최대</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* 배경 격자 */}
        {yLabels.map((v, i) => (
          <g key={i}>
            <line
              x1="0" x2={W}
              y1={toY(v)} y2={toY(v)}
              stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5"
            />
            <text x={W - 2} y={toY(v) - 3} textAnchor="end" className="text-gray-400 dark:text-gray-500" fontSize="8" fill="currentColor">
              {v}m
            </text>
          </g>
        ))}
        {/* 면적 */}
        <path d={areaPath} fill="url(#elevGrad)" />
        {/* 라인 */}
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* X축 레이블 */}
        {xLabels.map((v, i) => (
          <text
            key={i}
            x={toX(parseFloat(v))}
            y={H - 5}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            className="text-gray-400 dark:text-gray-500"
            fontSize="8"
            fill="currentColor"
          >
            {v}km
          </text>
        ))}
      </svg>
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
