import type { RailItem } from "./Rail";

// 주 메뉴: 홈 · 창 · AI 모드 · 설정. 앱과 템플릿이 같이 쓴다.
export const NAV: (RailItem & { path: string })[] = [
  { icon: "home", label: "홈", path: "/home" },
  { icon: "window", label: "창", path: "/windows" },
  { icon: "sparkle", label: "AI 모드", path: "/ai" },
  { icon: "gear", label: "설정", path: "/settings" },
];
