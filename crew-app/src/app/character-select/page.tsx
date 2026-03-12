"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CharacterAvatar from "@/components/character/CharacterAvatar";
import { useAuth } from "@/hooks/useAuth";

export default function CharacterSelectPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAuthHeader } = useAuth();
  const [selecting, setSelecting] = useState(false);
  const [checkingChar, setCheckingChar] = useState(true);

  // 인증 확인
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // 이미 캐릭터 선택했으면 대시보드로
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    async function check() {
      try {
        const res = await fetch("/api/character", { headers: getAuthHeader() });
        const json = await res.json();
        if (json.success && json.data.base !== "unknown") {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // 에러 시 선택 화면 표시
      }
      setCheckingChar(false);
    }
    check();
  }, [isLoading, isAuthenticated, getAuthHeader, router]);

  async function handleSelect(gender: "male" | "female") {
    setSelecting(true);
    try {
      const res = await fetch("/api/character", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ base: gender }),
      });
      const json = await res.json();
      if (json.success) {
        router.replace("/dashboard");
      }
    } finally {
      setSelecting(false);
    }
  }

  if (isLoading || checkingChar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏃</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            캐릭터를 선택하세요!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            나를 대표할 캐릭터를 골라주세요
          </p>
        </div>

        {/* 캐릭터 선택 */}
        <div className="flex justify-center gap-5 mb-8">
          {(["male", "female"] as const).map((gender) => (
            <button
              key={gender}
              type="button"
              disabled={selecting}
              onClick={() => handleSelect(gender)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              <CharacterAvatar
                gender={gender}
                mode="idle"
                size={112}
                equipment={gender === "female" ? {
                  top: "idle-top-female",
                  bottom: "idle-bottom-female",
                  shoes: "idle-shoes-female",
                } : undefined}
              />
              <span className="text-base font-bold text-gray-700 dark:text-gray-300">
                {gender === "male" ? "남자" : "여자"}
              </span>
            </button>
          ))}
        </div>

        {selecting && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              선택 중...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
