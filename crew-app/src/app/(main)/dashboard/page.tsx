"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type GarminStatus = {
  connected: boolean;
  garminEmail?: string;
  lastSyncAt?: string | null;
  status?: string; // active | reauth_required
};

export default function DashboardPage() {
  const { user, getAuthHeader } = useAuth();
  const router = useRouter();
  const [garminStatus, setGarminStatus] = useState<GarminStatus | null>(null);
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // 가민 상태 확인
  const checkGarminStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/garmin/status", { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) {
        setGarminStatus(json.data);
        return json.data as GarminStatus;
      }
    } catch {
      // 무시
    }
    return null;
  }, [getAuthHeader]);

  // 자동 동기화
  const autoSync = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/garmin/sync", {
        method: "POST",
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (json.success) {
        const { synced, totalPoints } = json.data;
        if (synced > 0) {
          setSyncResult(`${synced}개 활동 동기화 (+${totalPoints}P)`);
        }
      } else if (json.code === "REAUTH_REQUIRED") {
        setGarminStatus(prev => prev ? { ...prev, status: "reauth_required" } : prev);
      }
    } catch {
      // 무시
    } finally {
      setSyncing(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const status = await checkGarminStatus();
      if (!mounted) return;
      if (!status?.connected) {
        setShowConnectPopup(true);
      } else if (status.status === "active") {
        autoSync();
      }
    })();
    return () => { mounted = false; };
  }, [checkGarminStatus, autoSync]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 재인증 필요 배너 */}
      {garminStatus?.connected && garminStatus.status === "reauth_required" && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            가민 재연동이 필요합니다
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
            비밀번호가 변경되었을 수 있습니다.
          </p>
          <button
            onClick={() => router.push("/settings")}
            className="mt-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5"
          >
            설정에서 재연동
          </button>
        </div>
      )}

      {/* 동기화 결과 */}
      {syncResult && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <p className="text-sm text-green-700 dark:text-green-400">{syncResult}</p>
        </div>
      )}

      {/* 동기화 중 */}
      {syncing && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-700 dark:text-blue-400">운동 데이터 동기화 중...</p>
        </div>
      )}

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

      {/* 가민 연동 팝업 */}
      {showConnectPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                가민 연동하기
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                가민 계정을 연동하면 운동 기록이 자동으로 동기화되고, 포인트를 획득할 수 있어요!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConnectPopup(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  나중에
                </button>
                <button
                  onClick={() => {
                    setShowConnectPopup(false);
                    router.push("/settings");
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl"
                >
                  연동하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
