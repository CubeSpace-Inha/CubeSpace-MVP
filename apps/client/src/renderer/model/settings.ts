import type { Cube, Slot, Snapshot } from "@cubespace/protocol";
import { ICON_ROWS, REG_ICONS, toPixels, type Pixels } from "../cube/led";
import { place } from "./home";
import { battText, linkText } from "./status";

// 스냅샷 → 설정 화면에 그릴 값. 시안 pad-home.html의 pairBody · renderSetView 규칙.

export const SLOTS = [0, 1, 2, 3, 4, 5] as const satisfies readonly Slot[];
export const freeSlot = (s: Snapshot) => SLOTS.find((i) => !s.cubes.some((c) => c.slot === i));

// 장치 추가 단계: 패드 연결 → 큐브 등록 → 위치 확인. 등록은 확인점에 올린 순서대로 core가 한다(스냅샷 pairing)
export type PairPhase = "idle" | "place" | "done" | "none"; // none = 시작했지만 켜진 미등록 큐브가 없었다
export const PAIR_STEPS = ["패드 연결", "큐브 등록", "위치 확인"];
export function pairPhase(s: Snapshot, none: boolean): PairPhase {
  if (s.pairing) return s.pairing.done.length < s.pairing.total ? "place" : "done";
  return none ? "none" : "idle";
}
export function pairStep(s: Snapshot, phase: PairPhase): number {
  if (s.pad.session !== "up") return 0;
  return phase === "place" || phase === "done" ? 3 : 1;
}

// 올리는 중 안내. k = 지금 올릴 큐브 번째
export function placeText(p: NonNullable<Snapshot["pairing"]>): string {
  const k = `(${p.done.length + 1}/${p.total})`;
  const last = p.done[p.done.length - 1];
  return last === undefined
    ? `큐브 하나를 확인점에 올려 주세요 ${k}`
    : `${"ABCDEF"[last]}로 등록했어요 · 내리고 다음 큐브를 올려 주세요 ${k}`;
}

// 등록 아이콘(시안 miniLed: 켠 점은 고른 색)
const SEL = "var(--sel)";
export const regPixels = (icon: string): Pixels => toPixels(REG_ICONS[icon] ?? ICON_ROWS.frame, { "#": SEL, W: SEL });

// 등록된 큐브 한 줄의 상태 글자
export function cubeLineText(c: Cube): string {
  const l = linkText(c);
  return `${c.link === "up" ? `연결 · ${place(c)}` : `${l.text} · ${l.why}`} · ${battText(c)}`;
}
