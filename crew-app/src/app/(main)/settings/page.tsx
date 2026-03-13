"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import CharacterAvatar from "@/components/character/CharacterAvatar";

// ── 가민 연동 섹션 ──────────────────────────────────────────
function GarminSection({
  getAuthHeader,
  showMessage,
}: {
  getAuthHeader: () => Record<string, string>;
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/garmin/status", { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success && json.data.connected) {
        setIsConnected(true);
        setConnectedEmail(json.data.garminEmail);
        setLastSyncAt(json.data.lastSyncAt);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleConnect() {
    if (!garminEmail || !garminPassword) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/garmin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ garminEmail, garminPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setIsConnected(true);
        setConnectedEmail(garminEmail);
        setShowForm(false);
        setGarminEmail("");
        setGarminPassword("");
        showMessage("success", "가민 계정이 연동되었습니다. 운동 기록을 가져오는 중...");

        // 연동 직후 자동 동기화
        setIsSyncing(true);
        try {
          const syncRes = await fetch("/api/garmin/sync", {
            method: "POST",
            headers: getAuthHeader(),
          });
          const syncJson = await syncRes.json();
          if (syncJson.success) {
            const { synced, totalPoints } = syncJson.data;
            if (synced > 0) {
              showMessage("success", `${synced}개 운동 동기화 완료! +${totalPoints}P`);
            } else {
              showMessage("success", "연동 완료! 새로운 운동 기록이 없습니다.");
            }
            setLastSyncAt(new Date().toISOString());
          }
        } catch {
          // 동기화 실패해도 연동 자체는 성공
        } finally {
          setIsSyncing(false);
        }
      } else {
        showMessage("error", json.error ?? "연동에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("가민 연동을 해제하면 동기화된 운동 기록과 포인트가 모두 삭제됩니다. 계속하시겠습니까?")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/garmin/connect", {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (json.success) {
        setIsConnected(false);
        setConnectedEmail("");
        setLastSyncAt(null);
        const deleted = json.data?.deletedActivities ?? 0;
        showMessage("success", `가민 연동 해제 완료${deleted > 0 ? ` (${deleted}개 기록 삭제)` : ""}`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return null;

  return (
    <>
    <LoadingOverlay visible={isSyncing} message="운동 기록 동기화 중..." />
    <LoadingOverlay visible={isSaving} message="처리 중..." />
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#007DC3" strokeWidth="4" />
          <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16h-16V8z" fill="#007DC3" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Garmin 연동</h3>
      </div>

      {isConnected ? (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">연동됨</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{connectedEmail}</p>
          {lastSyncAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              마지막 동기화: {new Date(lastSyncAt).toLocaleString("ko-KR")}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const res = await fetch("/api/garmin/sync", {
                    method: "POST",
                    headers: getAuthHeader(),
                  });
                  const json = await res.json();
                  if (json.success) {
                    const { synced, totalPoints } = json.data;
                    if (synced > 0) {
                      showMessage("success", `${synced}개 운동 동기화 완료! +${totalPoints}P`);
                    } else {
                      showMessage("success", "새로운 운동 기록이 없습니다.");
                    }
                    setLastSyncAt(new Date().toISOString());
                  } else {
                    showMessage("error", json.error ?? "동기화에 실패했습니다.");
                  }
                } catch {
                  showMessage("error", "동기화 중 오류가 발생했습니다.");
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isSyncing ? "동기화 중..." : "지금 동기화"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isSaving}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              연동 해제
            </button>
          </div>
        </div>
      ) : showForm ? (
        <div className="px-4 py-3 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Garmin Connect 계정 정보를 입력하세요. 비밀번호는 암호화되어 저장됩니다.
          </p>
          <input
            type="email"
            value={garminEmail}
            onChange={(e) => setGarminEmail(e.target.value)}
            placeholder="가민 이메일"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="password"
            value={garminPassword}
            onChange={(e) => setGarminPassword(e.target.value)}
            placeholder="가민 비밀번호"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={isSaving || !garminEmail || !garminPassword}
              className="flex-1 py-2 bg-[#007DC3] hover:bg-[#006aaa] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSaving ? "연동 중..." : "연동하기"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            가민 계정을 연동하면 운동 기록이 자동으로 동기화됩니다.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 bg-[#007DC3] hover:bg-[#006aaa] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="4" />
              <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16h-16V8z" fill="white" />
            </svg>
            가민 연동하기
          </button>
        </div>
      )}
    </div>
    </>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser, getAuthHeader } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [autoLogin, setAutoLogin] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem("crew_no_auto_login");
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [characterBase, setCharacterBase] = useState<"unknown" | "male" | "female">("unknown");
  const [characterLoading, setCharacterLoading] = useState(true);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  // 캐릭터 정보 로드
  useEffect(() => {
    async function loadCharacter() {
      try {
        const res = await fetch("/api/character", { headers: getAuthHeader() });
        const json = await res.json();
        if (json.success) {
          setCharacterBase(json.data.base ?? "unknown");
        }
      } finally {
        setCharacterLoading(false);
      }
    }
    loadCharacter();
  }, [getAuthHeader]);

  async function handleNicknameSave() {
    if (!nickname.trim() || nickname === user?.nickname) {
      setIsEditingNickname(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshUser();
        setIsEditingNickname(false);
        showMessage("success", "닉네임이 변경되었습니다.");
      } else {
        showMessage("error", json.error ?? "닉네임 변경 실패");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    await logout();
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      {/* 토스트 메시지 */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 프로필 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">프로필</h3>

        <div className="flex items-center gap-4 mb-1">
          {/* 캐릭터 아바타 */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
            {characterBase !== "unknown" ? (
              <CharacterAvatar gender={characterBase} mode="idle" size={56} equipment={{ top: "default", bottom: "default", shoes: "default" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-300">
                {user?.nickname?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            {isEditingNickname ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNicknameSave()}
                  autoFocus
                  className="min-w-0 flex-1 text-base font-semibold bg-transparent border-b-2 border-primary-500 outline-none text-gray-900 dark:text-white"
                  maxLength={20}
                />
                <button
                  onClick={handleNicknameSave}
                  disabled={isSaving}
                  className="text-xs text-primary-600 font-semibold flex-shrink-0"
                >
                  저장
                </button>
                <button
                  onClick={() => { setNickname(user?.nickname ?? ""); setIsEditingNickname(false); }}
                  className="text-xs text-gray-400 flex-shrink-0"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{user?.nickname}</p>
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
              {user?.role === "admin" && (
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  관리자
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 앱 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 pt-4 pb-2">앱 설정</h3>

        {/* 자동 로그인 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700/50">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">자동 로그인</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {autoLogin ? "앱 재시작 시 자동 로그인됩니다" : "앱 재시작 시 로그인이 필요합니다"}
            </p>
          </div>
          <div
            onClick={() => {
              const next = !autoLogin;
              setAutoLogin(next);
              if (next) {
                localStorage.removeItem("crew_no_auto_login");
              } else {
                localStorage.setItem("crew_no_auto_login", "true");
              }
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoLogin ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-600"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${autoLogin ? "translate-x-5.5" : "translate-x-0.5"}`} style={{ transform: `translateX(${autoLogin ? "22px" : "2px"})` }} />
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">화면 테마</p>
          <div className="flex gap-2">
            {(["light", "system", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  theme === t
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {t === "light" ? "라이트" : t === "dark" ? "다크" : "시스템"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            현재: {isDark ? "다크 모드" : "라이트 모드"}
          </p>
        </div>
      </div>

      {/* 가민 연동 */}
      <GarminSection getAuthHeader={getAuthHeader} showMessage={showMessage} />

      {/* 관리자 메뉴 */}
      {user?.role === "admin" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 pt-4 pb-2">관리자</h3>
          <button
            onClick={() => router.push("/settings/admin")}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">사용자 관리</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/settings/admin/points")}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">포인트 설정</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/settings/admin/shop")}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">상점 아이템 관리</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* 앱 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 pt-4 pb-2">앱 정보</h3>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">버전</p>
          <p className="text-sm text-gray-400">1.0.0</p>
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-white dark:bg-gray-800 text-red-500 font-semibold rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
