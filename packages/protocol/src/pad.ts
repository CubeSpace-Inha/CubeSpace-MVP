import type { Empty, Envelope } from "./envelope";

// 패드 프로그램(pad-gateway · pad-sim) ↔ core. core는 둘을 구분하지 않는다.
// 큐브 id는 패드가 붙인 고유 번호(지금은 MAC 뒤 4자리, 스냅샷 Cube.mac4와 같다).

export type Xy = [number, number]; // 패드 위 자리(mm)

export type PadCube = {
  id: string;
  xy: Xy | null; // null = 패드 밖
  link: "up" | "down";
  battPct: number | null;
};

export type PadToCore =
  | Envelope<"hello", { role: "pad"; padId: string; fw: string }>
  | Envelope<"sync", { cubes: PadCube[] }> // 연결 직후 · 재연결 때 전체 상태
  | Envelope<"cube", { id: string; xy: Xy | null }> // 놓기 · 옮기기(xy), 들기(null)
  | Envelope<"button", { id: string; press: "short" | "long" }> // 꾹 = 0.6초 이상
  | Envelope<"diag", { id: string; rssi: number | null; battPct: number | null }>;

// 큐브 8 × 8 LED (앱 설계 명세 4장). glyph: "1".."4" | "on" | "off" | 8줄 도안
export type LedCommand = {
  cubeId: string;
  glyph: string | string[];
  color: string; // #RRGGBB
  blink: boolean;
};

export type CoreToPad = Envelope<"led", LedCommand>;

// pad-sim만: 화면 · 테스트가 가상 큐브를 움직인다(개발용)
export type SimControl =
  | Envelope<"hello", { role: "client" }>
  | Envelope<"simCube", { id: string; xy: Xy | null }>
  | Envelope<"simButton", { id: string; press: "short" | "long" }>
  | Envelope<"simLink", { id: string; link: "up" | "down" }>
  | Envelope<"simState", Empty> // 응답(result)으로 PadCube[]
  | Envelope<"simPad", Empty>; // HW 통합 후 제거: core 연결을 모두 끊는다(패드 끊김 흉내)
