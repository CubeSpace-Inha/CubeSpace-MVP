import type {
  Cube,
  Profile,
  ProfileKind,
  Snapshot,
} from "@cubespace/protocol";
import { candProfiles, linked, type Effort } from "./ai";
import { onPad, profOf } from "./home";
import { KIND_TEXT } from "./status";

// 스냅샷 → AI 화면 고급 설정(배정 상태 · 충돌 방지 · 사용 강도 · 추천 배정 · 큐브에 담을 구성)에 그릴 값.
// 시안 pad-home.html의 nextChoice · rackHTML · touchHTML · toolConflicts · recommend · propose 규칙.

export const KIND_GLYPH: Record<ProfileKind, string> = {
  project: "▤",
  agent: "✦",
  prompt: "≡",
  skill: "</>",
  mcp: "⌁",
};

export const EFFORT_INFO: Record<
  Effort,
  { rounds: number; description: string; detail: string }
> = {
  light: {
    rounds: 0,
    description: "작은 수정이나 빠른 확인에 적합해요.",
    detail: "기본 실행 · 자동 수정 반복 없음",
  },
  balanced: {
    rounds: 1,
    description: "일반적인 기능 구현과 수정을 위한 기본값이에요.",
    detail: "기본 실행 · 실패 시 수정 최대 1회",
  },
  thorough: {
    rounds: 2,
    description: "검토가 필요한 작업에 더 많은 반복 여유를 줘요.",
    detail: "기본 실행 · 실패 시 수정 최대 2회",
  },
};

export const padOn = (s: Snapshot) => s.pad.session === "up";
export const plc = (c: Cube) =>
  !linked(c) ? "미연결" : onPad(c) ? "패드 위" : "패드 밖";
export const profName = (s: Snapshot, id: string | null) =>
  s.profiles.find((p) => p.id === id)?.name ?? "선택 없음";
export const kindLine = (p: Profile | undefined) =>
  p ? KIND_TEXT[p.kind] + (p.kind === "prompt" ? " · md" : "") : "";

// 터치하면 바뀔 다음 항목: 지금 항목 다음부터 한 바퀴. 없는 구성은 건너뛴다.
export function nextChoice(s: Snapshot, c: Cube): string | null {
  const l = c.aiChoices;
  const at = c.ai ? l.indexOf(c.ai) : -1;
  for (let o = 1; o <= l.length; o++) {
    const id = l[(at + o) % l.length]!;
    if (id !== c.ai && s.profiles.some((p) => p.id === id)) return id;
  }
  return null;
}

// 내 큐브 카드 한 장
export function rackCard(s: Snapshot, c: Cube) {
  const p = profOf(s, c);
  const nx = nextChoice(s, c);
  const n = c.aiChoices.length;
  return {
    place: plc(c),
    cur: p?.name ?? "연결 없음",
    detail: p ? KIND_TEXT[p.kind] : "전환할 항목을 추가하세요",
    foot: `${c.mode !== "ai" ? "지금 창 모드 · " : ""}전환 목록 ${n}개 · ${nx ? `다음 ${profName(s, nx)}` : n > 1 ? "다음 항목 없음" : "후보를 더 추가하세요"}`,
  };
}

// 터치 전환 목록 아래 안내
export function touchHint(s: Snapshot, c: Cube, running: boolean) {
  const nx = nextChoice(s, c);
  const n = c.aiChoices.length;
  return {
    hint: !padOn(s)
      ? "패드를 연결하면 터치로 전환할 수 있어요."
      : n < 2
        ? "오른쪽 목록에서 항목을 더 담아 보세요."
        : !nx
          ? "다른 큐브에서 사용 중인 창은 건너뜁니다."
          : `다음 터치: ${profName(s, nx)}`,
    note:
      (n > 1
        ? "마지막 다음에는 첫 항목으로 돌아옵니다."
        : "후보를 추가해도 현재 선택은 유지됩니다.") +
      (running ? " 진행 중인 작업은 그대로 유지돼요." : ""),
  };
}

// 목록에서 빼기: 지금 항목을 뺐으면 그 뒤(한 바퀴)의 첫 구성이 지금 항목이 된다
export function removeChoice(
  s: Snapshot,
  c: Cube,
  id: string,
): { list: string[]; cur: string | null } {
  const at = c.aiChoices.indexOf(id);
  const list = c.aiChoices.filter((x) => x !== id);
  if (c.ai !== id) return { list, cur: c.ai };
  const rest = [...list.slice(at), ...list.slice(0, at)];
  return {
    list,
    cur: rest.find((x) => s.profiles.some((p) => p.id === x)) ?? null,
  };
}

export function moveChoice(list: string[], id: string, d: number): string[] {
  const at = list.indexOf(id);
  const to = at + d;
  if (at < 0 || to < 0 || to >= list.length) return list;
  const l = [...list];
  [l[at], l[to]] = [l[to]!, l[at]!];
  return l;
}

// 시작 전 확인 [이름, 통과, 설명]
export function conflictChecks(s: Snapshot): [string, boolean, string][] {
  const l = candProfiles(s);
  const pr = l.filter((p) => p.kind === "project");
  const ag = l.filter((p) => p.kind === "agent");
  return [
    ["프로젝트 하나", pr.length === 1, `${pr.length}개 선택됨`],
    [
      "에이전트 역할",
      ag.length >= 1 &&
        ag.length <= 2 &&
        (ag.length < 2 || ag[0]!.role !== ag[1]!.role),
      ag.length === 2
        ? "계획·검토와 구현을 나눠서 진행"
        : `${ag.length}개 선택됨`,
    ],
    [
      "중복 구성",
      new Set(l.map((p) => p.id)).size === l.length,
      "현재 선택한 구성만 검사",
    ],
    ["패드 연결", padOn(s), padOn(s) ? "연결됨" : "연결 필요"],
  ];
}

// 추천 배정: 프로젝트 + 구현 에이전트(+ 큐브 3개 이상이고 가볍게가 아니면 계획 에이전트). 지금 후보를 먼저 쓴다.
export function recommendIds(s: Snapshot, effort: Effort): string[] {
  const cur = candProfiles(s);
  const pick = (f: (p: Profile) => boolean) =>
    cur.find(f) ?? s.profiles.find(f);
  const pr = pick((p) => p.kind === "project");
  const im = pick((p) => p.kind === "agent" && p.role === "implement");
  const pl = pick((p) => p.kind === "agent" && p.role === "plan");
  const plan =
    s.cubes.filter(linked).length >= 3 && effort !== "light" ? [pl] : [];
  return [pr, im, ...plan].filter((p): p is Profile => !!p).map((p) => p.id);
}

// 구성마다 담을 큐브: 이미 그 구성인 큐브 → 패드 위 → 연결된 큐브. 없으면 -1
export function proposeTargets(s: Snapshot, ids: string[]): number[] {
  const used = new Set<number>();
  return ids.map((id) => {
    const free = (f: (c: Cube) => boolean) =>
      s.cubes.find((c) => !used.has(c.slot) && f(c));
    const c = free((k) => k.ai === id) ?? free(onPad) ?? free(linked);
    if (c) used.add(c.slot);
    return c ? c.slot : -1;
  });
}
export const proposalBad = (targets: number[]) =>
  targets.some((t) => t < 0) || new Set(targets).size !== targets.length;
