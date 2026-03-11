"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "LifeSync",
  "/feed": "피드",
  "/calendar": "캘린더",
  "/settings": "설정",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const title = PAGE_TITLES[pathname] ?? "LifeSync";

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>

      {user && (
        <div className="flex items-center gap-2">
          {/* 프로필 아바타 */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                {user.nickname[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
