import type { AppWindow, Cube, Profile, Snapshot } from "@cubespace/protocol";
import { APP_ICONS, glyphPixels } from "../cube/appIcons";
import type { LinkKind } from "../cube/ChainPill";
import {
  ICON_ROWS,
  OFF,
  outlineLeds,
  REG_ICONS,
  toPixels,
  type PadLed,
  type Pixels,
} from "../cube/led";
import type { SpareCube } from "../cube/SpareTray";
import { battText, KIND_TEXT, linkText, WIN_TEXT, winName } from "./status";

// 스냅샷 → 홈 화면에 그릴 값. 시안 pad-home.html의 renderPad · ledFrame · iconRows · renderChain · branches 규칙.

import { PAD_H, PAD_W } from "@cubespace/protocol";
export { PAD_H, PAD_W };
// 창 영역 색: 청록 · 분홍 · 주황 · 보라 순. AI 모드 큐브는 보라.
export const REGION = [
  "rgb(18 181 214)",
  "rgb(240 69 122)",
  "rgb(255 138 31)",
  "rgb(124 92 255)",
];
export const AI = "rgb(124 92 255)";
export const NEUTRAL = "rgb(150 158 172)";
const MUTED = "rgb(154 161 173)";
const GREEN = "rgb(34 197 94)";
const EDGE: Record<number, number> = { 1: 0.55, 2: 0.55, 3: 0.45, 4: 0.4 }; // 켜진 창 수별 테두리 밝기

// 선 상태별 색(연결이 아니면 가지 색 대신)
const K_COLOR: Record<Exclude<LinkKind, "ok">, string> = {
  hold: "rgb(245 158 11)",
  off: NEUTRAL,
  err: "rgb(229 72 77)",
};
const K_RANK: Record<LinkKind, number> = { ok: 0, hold: 1, off: 2, err: 3 };
const worse = (a: LinkKind, b: LinkKind) => (K_RANK[a] >= K_RANK[b] ? a : b);
const WIN_K: Record<AppWindow["status"], LinkKind> = {
  linked: "ok",
  noResponse: "hold",
  minimized: "off",
  relaunchable: "off",
  gone: "off",
  excluded: "err",
};

// 세 갈래 한 가지: 패드(무선) / 창 / AI. on = 지금 모드이고 맡은 것이 있음(흐름 효과), hue = 연결일 때 선 색, color = 지금 그릴 색.
export type Branch = {
  head: string;
  text: string;
  note: string;
  kind: LinkKind;
  on: boolean;
  hue: string;
  color: string;
  icon?: Pixels;
};

export type PlacedCube = {
  cube: Cube;
  x: number;
  y: number;
  pixels: Pixels;
  line?: string;
  label: string;
  fanLeft: boolean;
  branches: Branch[];
};

export type HomeView = {
  frozen: boolean; // 패드 세션 끊김: 판정 동결
  leds: PadLed[];
  placed: PlacedCube[]; // 패드 위
  spare: ((SpareCube & { slot: number }) | null)[]; // 안 쓰는 큐브 칸 6개
  chain: ({ name: string; kind: LinkKind; why: string } | null)[]; // 슬롯 6칸
};

export const onPad = (c: Cube) => c.link === "up" && c.xy !== null;
export const winOf = (s: Snapshot, c: Cube) =>
  s.windows.find((w) => w.id === c.window) ?? null;
export const profOf = (s: Snapshot, c: Cube) =>
  s.profiles.find((p) => p.id === c.ai) ?? null;
export const regionOf = (s: Snapshot, w: AppWindow | null) =>
  w ? s.layout.findIndex((p) => p.window === w.id) : -1;
export const cubeK = (s: Snapshot, c: Cube): LinkKind =>
  s.pad.session !== "up"
    ? "off"
    : c.link === "up"
      ? "ok"
      : c.downReason === "link"
        ? "hold"
        : "off";

// 창 점 색: 창 모드 큐브가 맡아 패드 테두리가 켜진 창만 영역 색, 아니면 회색(시안 swatch · lit)
export function winDot(s: Snapshot, w: AppWindow | null): string {
  const i = regionOf(s, w);
  const lit = i >= 0 && s.cubes.some((c) => c.window === w!.id && c.mode === "window");
  return lit ? REGION[i]! : MUTED;
}

// 큐브 테두리: 창 모드는 맡은 창의 영역 색, AI 모드는 보라
export function cubeLine(s: Snapshot, c: Cube): string | undefined {
  if (c.mode === "ai") return AI;
  return REGION[regionOf(s, winOf(s, c))];
}

// 큐브가 있는 곳: 패드 위 · 패드 밖 · 꺼진 이유
export const place = (c: Cube) =>
  onPad(c) ? "패드 위" : c.link === "up" ? "패드 밖" : (linkText(c).why ?? "");
export const coords = (c: Cube) =>
  c.xy
    ? `${c.xy[0].toFixed(1)}, ${c.xy[1].toFixed(1)} mm`
    : c.link === "up"
      ? "패드 밖"
      : "—";

export const appIcon = (app: string): Pixels =>
  APP_ICONS[app] ? glyphPixels(APP_ICONS[app]) : toPixels(ICON_ROWS.frame);
export const profileIcon = (p: Profile): Pixels =>
  toPixels(ICON_ROWS[p.icon as keyof typeof ICON_ROWS] ?? ICON_ROWS.frame);

// 큐브 윗면: 꺼진 큐브는 아무것도 켜지 않는다(무선 끊김은 마지막 아이콘 유지).
// 창 모드는 맡은 창의 앱 도안, AI 모드는 맡은 구성 도안. 없으면 등록 아이콘 → 빈 틀.
export function cubePixels(s: Snapshot, c: Cube): Pixels {
  if (c.link === "down" && c.downReason !== "link") return OFF;
  if (c.mode === "window") {
    const app = winOf(s, c)?.app;
    if (app && APP_ICONS[app]) return glyphPixels(APP_ICONS[app]);
  } else {
    const p = profOf(s, c);
    if (p && p.icon in ICON_ROWS) return profileIcon(p);
  }
  return toPixels(REG_ICONS[c.icon] ?? ICON_ROWS.frame);
}

// 세 갈래 = 큐브의 연결 층. 창 · AI 가지는 큐브 무선 상태와 그 대상의 상태 중 나쁜 쪽을 따른다. 맡은 것이 없으면 "없음".
export function branches(s: Snapshot, c: Cube): Branch[] {
  const padUp = s.pad.session === "up";
  const ck = cubeK(s, c);
  const w = winOf(s, c);
  const p = profOf(s, c);
  const ri = regionOf(s, w);
  const l = linkText(c);
  const why = !padUp ? "판정 동결" : c.link !== "up" ? `큐브 ${l.text}` : "";
  const b = (x: Omit<Branch, "color">): Branch => ({
    ...x,
    color: x.kind === "ok" ? x.hue : K_COLOR[x.kind],
  });
  return [
    b({
      head: "패드 · 무선",
      text: !padUp
        ? "판정 동결"
        : c.link === "up"
          ? `연결 · ${place(c)}`
          : `${l.text} · ${l.why}`,
      note: "",
      kind: ck,
      on: false,
      hue: GREEN,
    }),
    b({
      head: `창${ri >= 0 ? ` · 영역 ${ri + 1}` : ""}${w && c.mode === "window" ? " · 사용 중" : ""}`,
      text: w ? winName(w) : "없음",
      note: w ? why || WIN_TEXT[w.status].text : "",
      kind: w ? worse(ck, WIN_K[w.status]) : "off",
      on: !!w && c.mode === "window",
      hue: REGION[ri] ?? NEUTRAL,
      icon: w ? appIcon(w.app) : undefined,
    }),
    b({
      head: `AI${p ? ` · ${KIND_TEXT[p.kind]}` : ""}${p && c.mode === "ai" ? " · 사용 중" : ""}`,
      text: p ? p.name : "없음",
      note: p ? why : "",
      kind: p ? ck : "off",
      on: !!p && c.mode === "ai",
      hue: AI,
      icon: p ? profileIcon(p) : undefined,
    }),
  ];
}

export function homeView(s: Snapshot): HomeView {
  const padUp = s.pad.session === "up";
  // 패드는 창 모드 큐브가 맡은 창의 영역만 테두리를 켠다
  const lit = s.layout.filter((p) =>
    s.cubes.some((c) => c.window === p.window && c.mode === "window"),
  );

  const label = (c: Cube) =>
    `슬롯 ${c.slot} 큐브 ${c.name}. 배터리 ${battText(c)}. ${branches(s, c)
      .map((b) => `${b.head} ${b.text}${b.note ? ` ${b.note}` : ""}`)
      .join(", ")}. 눌러서 창과 AI 바꾸기`;

  const charging = (c: Cube) => c.link === "down" && c.downReason === "dock";

  const placed = s.cubes.filter(onPad).map((c) => ({
    cube: c,
    x: c.xy![0] / PAD_W,
    y: c.xy![1] / PAD_H,
    pixels: cubePixels(s, c),
    line: cubeLine(s, c),
    label: label(c),
    fanLeft: c.xy![0] >= PAD_W / 2, // 패드 오른쪽 절반의 큐브는 세 갈래를 왼쪽으로 편다
    branches: branches(s, c),
  }));

  // 안 쓰는 큐브(연결됐지만 패드 밖) 뒤에 도크에서 충전 중인 큐브. 그 밖의 꺼진 큐브는 연결 표시에만.
  const spares = [
    ...s.cubes.filter((c) => c.link === "up" && !onPad(c)),
    ...s.cubes.filter(charging),
  ];
  const spare = Array.from({ length: 6 }, (_, i) => {
    const c = spares[i];
    if (!c) return null;
    const ch = charging(c);
    return {
      slot: c.slot,
      name: c.name,
      pixels: cubePixels(s, c),
      pct: c.battPct ?? 0,
      line: cubeLine(s, c),
      charging: ch,
      label: ch
        ? `큐브 ${c.name} · 도크 · 충전 중 · 마지막 잔량 ${battText(c)}`
        : label(c),
    };
  });

  const chain = Array.from({ length: 6 }, (_, slot) => {
    const c = s.cubes.find((x) => x.slot === slot);
    if (!c) return null;
    const l = linkText(c);
    const why = !padUp
      ? "확인할 수 없음"
      : c.link === "up"
        ? "연결"
        : `${l.text} · ${l.why}`;
    return { name: c.name, kind: cubeK(s, c), why };
  });

  return {
    frozen: !padUp,
    leds: lit.flatMap((p) =>
      outlineLeds(
        p.rect,
        REGION[s.layout.indexOf(p)]!,
        EDGE[lit.length] ?? 0.4,
      ),
    ),
    placed,
    spare,
    chain,
  };
}
