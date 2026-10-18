import type { Cube, Snapshot } from "@cubespace/protocol";
import type { Pixels } from "../cube/led";
import { cubeLine, NEUTRAL, profileIcon, REGION, regionOf, winDot, winOf } from "./home";
import { KIND_TEXT, winName } from "./status";

// 큐브 확대(노드 그래프)에 그릴 값. 시안 pad-home.html의 winCands · aiCands · candColumn · zoomTo 규칙.

export type Pick = "win" | "ai";
export type Cand = {
  kind: Pick;
  id: string;
  head: string;
  tag: string;
  title: string;
  sub: string;
  icon?: Pixels; // AI: 구성 도안
  dot?: string; // 창: 점 색
  color: string;
};
export type CandGroup = { name: string; items: Cand[] };

// 이 큐브의 창 · AI를 바꿀 수 있는 후보. 다른 큐브가 쓰는 것은 맞바꿈이다.
export const winCands = (s: Snapshot, c: Cube) =>
  s.windows.filter((w) => w.id !== c.window && ["linked", "minimized", "relaunchable"].includes(w.status));
export const aiCands = (s: Snapshot, c: Cube) => s.profiles.filter((p) => p.id !== c.ai);

const regionName = (i: number) => (i >= 0 ? ` · 영역 ${i + 1}` : "");

export function candGroups(s: Snapshot, c: Cube, pick: Pick): CandGroup[] {
  if (pick === "win") {
    const list = winCands(s, c);
    const sub = (w: (typeof list)[number]) =>
      w.owner
        ? `큐브 ${w.owner}`
        : w.status === "linked"
          ? "담당 없음"
          : w.status === "minimized"
            ? "대기 · 최소화"
            : "다시 열어서 배정";
    const item = (w: (typeof list)[number]): Cand => ({
      kind: "win",
      id: w.id,
      head: `창${regionName(regionOf(s, w))}`,
      tag: w.owner ? `큐브 ${w.owner}` : "",
      title: winName(w),
      sub: sub(w),
      dot: winDot(s, w),
      color: REGION[regionOf(s, w)] ?? NEUTRAL,
    });
    return [
      { name: "담당 없는 창", items: list.filter((w) => !w.owner).map(item) },
      {
        name: "다른 큐브의 창 · 맞바꿈",
        items: list.filter((w) => w.owner).map(item),
      },
    ].filter((g) => g.items.length);
  }
  return (Object.keys(KIND_TEXT) as (keyof typeof KIND_TEXT)[])
    .map((k) => ({
      name: KIND_TEXT[k],
      items: aiCands(s, c)
        .filter((p) => p.kind === k)
        .map((p): Cand => {
          const who = s.cubes.find((x) => x.ai === p.id);
          return {
            kind: "ai",
            id: p.id,
            head: `AI · ${KIND_TEXT[p.kind]}`,
            tag: who ? `큐브 ${who.name}` : "",
            title: p.name,
            sub: who ? "맞바꿈" : "쓰는 큐브 없음",
            icon: profileIcon(p),
            color: cubeLine(s, who ?? c) ?? NEUTRAL,
          };
        }),
    }))
    .filter((g) => g.items.length);
}

// 바꾼 뒤 띄울 알림 글자
export function swapToast(s: Snapshot, c: Cube, kind: Pick, id: string): string {
  if (kind === "win") {
    const cur = winOf(s, c);
    const w = s.windows.find((x) => x.id === id);
    return `큐브 ${c.name} · 창: ${cur ? winName(cur) : "없음"} → ${w ? winName(w) : id}`;
  }
  const prev = s.profiles.find((p) => p.id === c.ai);
  const p = s.profiles.find((x) => x.id === id);
  return `큐브 ${c.name} · AI: ${prev ? prev.name : "없음"} → ${p ? p.name : id} (다음 실행부터)`;
}

// 확대 배치. CSS .detail의 열 폭 · 간격과 같은 값.
export const GAP = 140;
const COL_W = 300;
const COL_GAP = 100;
const GRAPH_W = COL_W * 2 + COL_GAP;

// W · H = 홈 크기, padW = 패드 폭. half = 큐브 타일 반폭, S = 패드 확대 배율, T = 큐브 가운데가 갈 자리.
// 가로 배치에서 큐브가 들어갈 반폭이 너무 작으면 위아래로 쌓는다(stack).
export function zoomFrame(W: number, H: number, padW: number) {
  const base = padW * 0.175 || 1;
  const fitHalf = (W - 100 - GAP - GRAPH_W - 24) / 2;
  const stack = fitHalf < 48;
  const half = stack ? Math.min(64, H * 0.09) : Math.min(base * Math.min(2.2, (H * 0.5) / base) * 0.4, fitHalf);
  const size = half / 0.4;
  const T = stack
    ? { x: W / 2, y: 84 + half }
    : {
        x: Math.max(half + 100, (W - (2 * half + GAP + GRAPH_W)) / 2 + half),
        y: H / 2 + 10,
      };
  return { stack, half, size, S: size / base, T };
}
