import type { WindowCommand } from "./api";
import type { Empty, Envelope, Result } from "./envelope";

// core ↔ win-driver(C#). win-driver는 상태가 없고 시키는 대로만 한다.
// 요청은 id를 붙이고, 응답은 같은 id의 result로 온다.

export type WinInfo = {
  hwnd: string; // 창 핸들(10진수 문자열)
  exe: string; // 실행 파일 이름(소문자, 예: notepad.exe)
  title: string;
  minimized: boolean;
};

export type MonitorInfo = {
  no: number; // 1부터
  primary: boolean;
  work: [number, number, number, number]; // 작업 영역 x, y, 너비, 높이(물리 픽셀)
};

// rect = 모니터 작업 영역 정규화 [x0, y0, x1, y1] (스냅샷 Placement와 같은 모양)
export type LayoutItem = { hwnd: string; rect: [number, number, number, number] };
export type ItemResult = { hwnd: string; ok: boolean; error?: string };

export type CoreToWin =
  | Envelope<"listWindows", Empty> // → WinInfo[]
  | Envelope<"listMonitors", Empty> // → MonitorInfo[]
  | Envelope<"applyLayout", { monitor: number; items: LayoutItem[] }> // → ItemResult[]
  | Envelope<"command", { hwnd: string; cmd: WindowCommand; monitor: number }> // → null
  | Envelope<"launch", { exe: string; args: string[] }>; // → null

export type WinToCore =
  | Envelope<"hello", { role: "win" }>
  | Envelope<"result", Result>
  | Envelope<"windowOpened", WinInfo>
  | Envelope<"windowClosed", { hwnd: string }>;
