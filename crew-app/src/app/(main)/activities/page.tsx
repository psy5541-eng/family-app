"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type TabType = "all" | "my";

type MonthStats = {
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  activityCount: number;
  totalPoints: number;
};

type ActivityItem = {
  id: string;
  userId: string;
  activityType: string;
  title: string | null;
  startTime: string | Date;
  duration: number;
  distance: number;
  pace: number | null;
  heartRate: number | null;
  calories: number | null;
  elevation: number | null;
  pointsEarned: number | null;
  userNickname: string | null;
  userProfileImage: string | null;
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  running: "러닝",
  trail_running: "트레일",
  walking: "걷기",
};

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  running: "bg-blue-500",
  trail_running: "bg-green-600",
  walking: "bg-amber-500",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function formatPace(paceSeconds: number | null): string {
  if (!paceSeconds) return "-";
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return `${d.getDate()}일 (${["일","월","화","수","목","금","토"][d.getDay()]})`;
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}.${parseInt(month)}`;
}

function ActivityCard({
  activity,
  showUser,
  onClick,
}: {
  activity: ActivityItem;
  showUser?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {showUser && (
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                {activity.userProfileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activity.userProfileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-300">
                    {activity.userNickname?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {activity.userNickname}
              </span>
            </div>
          )}
          <span className={`w-2 h-2 rounded-full ${ACTIVITY_TYPE_COLOR[activity.activityType]}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {ACTIVITY_TYPE_LABEL[activity.activityType]}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {formatDateShort(activity.startTime)} {formatTime(activity.startTime)}
        </span>
      </div>

      {activity.title && (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5 truncate">
          {activity.title}
        </p>
      )}

      <div className="flex items-baseline gap-4">
        <div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {activity.distance.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 ml-0.5">km</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatDuration(activity.duration)}
          </span>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatPace(activity.pace)}
          </span>
          <span className="text-[10px] text-gray-400 ml-0.5">/km</span>
        </div>
        {activity.elevation != null && activity.elevation > 0 && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activity.elevation.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-400 ml-0.5">m↑</span>
          </div>
        )}
        {activity.pointsEarned && activity.pointsEarned > 0 && (
          <span className="ml-auto text-xs font-semibold text-primary-600 dark:text-primary-400">
            +{activity.pointsEarned}P
          </span>
        )}
      </div>
    </button>
  );
}

export default function ActivitiesPage() {
  const router = useRouter();
  const { getAuthHeader } = useAuth();
  const [tab, setTab] = useState<TabType>("all");
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isCurrentMonth = currentMonth === getMonthKey(new Date());

  function changeMonth(delta: number) {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(getMonthKey(d));
  }

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/activities?month=${currentMonth}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) {
        setActivities(json.data.activities);
        setCurrentUserId(json.data.currentUserId);
        setStats(json.data.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader, currentMonth]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // 탭에 따라 클라이언트에서 필터
  const filteredActivities = useMemo(() => {
    if (tab === "all") return activities;
    return activities.filter((a) => a.userId === currentUserId);
  }, [tab, activities, currentUserId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* 월 선택 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentMonth(getMonthKey(new Date()))}
          className="text-lg font-bold text-gray-900 dark:text-white"
        >
          {formatMonthLabel(currentMonth)}
        </button>
        <button
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 탭 */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab("all")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "all"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          모든 활동
        </button>
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "my"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          내 운동
        </button>
      </div>

      {/* 내 운동 탭: 월간 통계 */}
      {tab === "my" && stats && stats.activityCount > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 text-white mb-3">
          <p className="text-xs font-medium opacity-80 mb-2">{formatMonthLabel(currentMonth)} 운동</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-bold">{stats.totalDistance.toFixed(1)}</p>
              <p className="text-[10px] opacity-70">km</p>
            </div>
            <div>
              <p className="text-xl font-bold">{stats.activityCount}</p>
              <p className="text-[10px] opacity-70">회</p>
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalPoints}</p>
              <p className="text-[10px] opacity-70">포인트</p>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] opacity-70">
            <span>총 {formatDuration(stats.totalDuration)}</span>
            {stats.totalElevation > 0 && <span>고도 {stats.totalElevation.toFixed(0)}m</span>}
          </div>
        </div>
      )}

      {/* 활동 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {tab === "all" ? "이 달의 크루 활동이 없습니다" : "이 달의 운동 기록이 없습니다"}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              showUser={tab === "all"}
              onClick={() => router.push(`/activities/${activity.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
