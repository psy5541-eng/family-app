"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "crew_theme";

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) ?? "system";
    setThemeState(saved);
    applyTheme(saved);

    // system 테마 시 OS 변경 감지
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem(THEME_KEY) as Theme) ?? "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function setTheme(t: Theme) {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
    applyTheme(t);
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return { theme, setTheme, isDark };
}
