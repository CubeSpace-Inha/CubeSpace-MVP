import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

// 시안과 같은 키. 고른 적이 없으면 시스템 설정을 따르고, 고르면 그 값을 기억한다.
const KEY = "cs-theme";
const darkQuery = () => window.matchMedia?.("(prefers-color-scheme: dark)");

function readSaved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null; // 저장소 없음
  }
}

function subscribeSystem(onChange: () => void) {
  const q = darkQuery();
  q?.addEventListener("change", onChange);
  return () => q?.removeEventListener("change", onChange);
}

export function useTheme() {
  const [saved, setSaved] = useState(readSaved);
  const systemDark = useSyncExternalStore(subscribeSystem, () => darkQuery()?.matches ?? false);
  const theme: Theme = saved ?? (systemDark ? "dark" : "light");

  useEffect(() => {
    if (saved) document.documentElement.dataset.theme = saved;
  }, [saved]);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next: Theme = theme === "dark" ? "light" : "dark";
    root.classList.add("theming"); // 바뀌는 동안만 색을 부드럽게
    setSaved(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 저장소 없음
    }
    setTimeout(() => root.classList.remove("theming"), 400);
  }, [theme]);

  return { theme, toggle };
}
