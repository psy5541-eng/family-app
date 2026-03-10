"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser, getAuthHeader } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profileImage ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(user?.biometricEnabled ?? false);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("error", "이미지 파일만 선택 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showMessage("error", "이미지는 최대 10MB까지 가능합니다.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("purpose", "profile");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success || !uploadJson.data.files[0]) {
        showMessage("error", "이미지 업로드에 실패했습니다.");
        return;
      }

      const imageUrl = uploadJson.data.files[0].url;
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ profileImage: imageUrl }),
      });
      const json = await res.json();
      if (json.success) {
        setProfilePreview(imageUrl);
        await refreshUser();
        showMessage("success", "프로필 사진이 변경되었습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  }

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

  async function handleBiometricToggle() {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ biometricEnabled: next }),
      });
      const json = await res.json();
      if (!json.success) {
        setBiometricEnabled(!next);
        showMessage("error", "설정 변경 실패");
      } else {
        await refreshUser();
      }
    } catch {
      setBiometricEnabled(!next);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">설정</h2>

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
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profilePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePreview} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-300">
                {user?.nickname?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />

          <div className="flex-1 min-w-0">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNicknameSave()}
                  autoFocus
                  className="flex-1 text-base font-semibold bg-transparent border-b-2 border-primary-500 outline-none text-gray-900 dark:text-white"
                  maxLength={20}
                />
                <button
                  onClick={handleNicknameSave}
                  disabled={isSaving}
                  className="text-xs text-primary-600 font-semibold"
                >
                  저장
                </button>
                <button
                  onClick={() => { setNickname(user?.nickname ?? ""); setIsEditingNickname(false); }}
                  className="text-xs text-gray-400"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.nickname}</p>
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
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 앱 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 pt-4 pb-2">앱 설정</h3>
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

      {/* 보안 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 pt-4 pb-2">보안</h3>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">생체인증 로그인</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">지문/얼굴 인식으로 로그인</p>
          </div>
          <button
            onClick={handleBiometricToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${biometricEnabled ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${biometricEnabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

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
