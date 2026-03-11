"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 인사 + 캐릭터 미리보기 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5">
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {user?.nickname ?? "러너"}님, 오늘도 달려볼까요? 🏃
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          RunningCrew와 함께하는 러닝 라이프
        </p>
      </div>

      {/* 내 포인트 요약 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">내 포인트</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">상점에서 사용 가능</span>
        </div>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          0 <span className="text-sm font-normal text-gray-500">P</span>
        </p>
      </div>

      {/* 이번 달 운동 요약 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">이번 달 운동</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">운동 횟수</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0.0</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">총 거리(km)</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">획득 포인트</p>
          </div>
        </div>
      </div>

      {/* 크루 랭킹 미리보기 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">크루 랭킹</h3>
          <span className="text-xs text-primary-500">이번 달</span>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          아직 랭킹 데이터가 없습니다
        </p>
      </div>

      {/* 최근 피드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">최근 피드</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          아직 피드가 없습니다
        </p>
      </div>
    </div>
  );
}
