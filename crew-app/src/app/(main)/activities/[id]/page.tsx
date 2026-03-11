"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Activity } from "@/types/db";

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

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
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
