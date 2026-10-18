import type { AppWindow, Cube, Snapshot } from "@cubespace/protocol";
import { APP_ICONS } from "../cube/appIcons";
import type { CubeInfo } from "../cube/CubeList";
import { cubeLine, cubePixels, NEUTRAL, onPad, winOf } from "./home";

// 스냅샷 → 창 화면에 그릴 값. 시안 pad-home.html의 renderBind · winRows · pickList 규칙.

export const MAX_ON = 4; // 패드 위 큐브 칸
export const PROGRAMS = Object.keys(APP_ICONS);

// 화면에 보이는 열린 창(사라진 창 제외)
const OPEN: AppWindow["status"][] = ["linked", "noResponse", "excluded", "minimized"];
const isOpen = (w: AppWindow) => OPEN.includes(w.status);

export const monitorName = (no: number) => (no === 1 ? "주 모니터" : `모니터 ${no}`);
export const winTitle = (w: AppWindow) => (w.title ? `${w.app} · ${w.title}` : w.app);

// 큐브 한 칸. picking = 이 큐브의 고르기 목록이 열려 있음.
export function cubeInfo(s: Snapshot, c: Cube, picking = false): CubeInfo {
  const w = winOf(s, c);
  const state = !onPad(c) ? "out" : picking ? "pick" : !w ? "empty" : w.status === "minimized" ? "off" : "bound";
  return {
    id: String(c.slot),
    name: c.name,
    pixels: cubePixels(s, c),
    color: cubeLine(s, c) ?? NEUTRAL,
    state,
    pct: Math.round(c.battPct ?? 0),
    win: w?.app,
  };
}

// 열린 창: 큐브에 묶인 창 먼저, 그다음 최소화 안 된 창
export function windowRows(s: Snapshot) {
  return s.windows
    .filter(isOpen)
    .map((w) => ({ w, cube: s.cubes.find((c) => c.name === w.owner) ?? null }))
    .sort(
      (a, b) =>
        Number(!a.cube) - Number(!b.cube) || Number(a.w.status === "minimized") - Number(b.w.status === "minimized"),
    );
}

// 고르기 목록: 담당 없는 열린 창(떠 있음 · 최소화) → 아직 안 연 프로그램(실행)
export type PickItem = { group: string; app: string; window?: AppWindow; note: string };
export function pickItems(s: Snapshot): PickItem[] {
  const free = s.windows
    .filter((w) => !w.owner && (w.status === "linked" || w.status === "minimized"))
    .sort((a, b) => Number(a.status === "minimized") - Number(b.status === "minimized"))
    .map((w) => ({ group: "열린 창", app: w.app, window: w, note: w.status === "minimized" ? "최소화" : "떠 있음" }));
  const has = new Set(free.map((x) => x.app));
  return [
    ...free,
    ...PROGRAMS.filter((a) => !has.has(a)).map((app) => ({ group: "등록된 프로그램", app, note: "실행" })),
  ];
}
