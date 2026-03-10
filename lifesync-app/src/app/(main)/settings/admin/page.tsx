"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type AdminUser = {
  id: string;
  email: string;
  nickname: string;
  profileImage: string | null;
  role: "admin" | "user";
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, getAuthHeader } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/settings");
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) setUsers(json.data.users);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    if (userId === user?.id) return; // 자기 자신 변경 불가
    const newRole = currentRole === "admin" ? "user" : "admin";
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">사용자 관리</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {u.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-300">
                    {u.nickname?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nickname}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => toggleRole(u.id, u.role)}
                disabled={u.id === user?.id || updating === u.id}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  u.role === "admin"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                } ${u.id === user?.id ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
              >
                {updating === u.id ? "..." : u.role === "admin" ? "관리자" : "일반"}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        역할을 클릭하면 관리자/일반 사용자 전환됩니다
      </p>
    </div>
  );
}
