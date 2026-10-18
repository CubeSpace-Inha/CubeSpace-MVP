import type { Cube, Profile, ProfileKind, Snapshot } from "@cubespace/protocol";
import { onPad, profOf } from "./home";
import { KIND_TEXT } from "./status";

// 스냅샷 → AI 모드 화면에 그릴 값. 시안 pad-home.html의 renderAList · aiIssues · recommendFill · pipeline 규칙.
// 프리셋은 뺐으므로(팀 결정) 개별 구성만 큐브에 배정한다.

export type Effort = "light" | "balanced" | "thorough";
export const EFFORTS: [Effort, string][] = [
  ["light", "가볍게"],
  ["balanced", "균형"],
  ["thorough", "꼼꼼하게"],
];

export const GOAL_EX = {
  feature: "로그인 화면에 이메일 형식 검사와 오류 안내를 추가해 주세요.",
  bug: "저장 버튼을 두 번 누르면 같은 항목이 중복 생성되는 문제를 고쳐 주세요.",
};

// 슬롯 색(시안 CUBE_COL). 목록의 배정 표시용
const CUBE_COL = ["#7c5cff", "#12b5d6", "#f0457a", "#ff8a1f", "#22c55e", "#eab308"];
export const cubeCol = (c: Cube) => CUBE_COL[c.slot % 6]!;
export const linked = (c: Cube) => c.link === "up";

// AI 후보: 패드 위 · AI 모드 · 구성 있음
export const candidates = (s: Snapshot) => s.cubes.filter((c) => onPad(c) && c.mode === "ai" && c.ai);
export const candProfiles = (s: Snapshot) =>
  candidates(s)
    .map((c) => profOf(s, c))
    .filter((p): p is Profile => !!p);

export function aiIssues(s: Snapshot): string[] {
  const l = candProfiles(s);
  const pr = l.filter((p) => p.kind === "project").length;
  const ag = l.filter((p) => p.kind === "agent").length;
  const is: string[] = [];
  if (s.pad.session !== "up") is.push("패드 연결이 필요해요");
  if (pr !== 1) is.push(pr ? "프로젝트는 하나만 골라 주세요" : "프로젝트를 골라 주세요");
  if (!ag || ag > 2) is.push(ag ? "에이전트는 최대 2개예요" : "구현 에이전트를 골라 주세요");
  return is;
}

export function aiStatus(s: Snapshot, goal: string, running: boolean): { kind: "run" | "ok" | "wait"; text: string } {
  if (running) return { kind: "run", text: "진행 중이에요" };
  if (!goal.trim()) return { kind: "wait", text: "맡길 일을 적어 주세요" };
  return {
    kind: "ok",
    text: aiIssues(s).length ? "시작하면 추천 구성으로 채워서 진행해요" : "준비됐어요 · 시작을 눌러 주세요",
  };
}

// 종류별 구성 목록과 쓰는 큐브
export type ProfileItem = { p: Profile; cube: Cube | null; sub: string };
export function profileGroups(s: Snapshot): { kind: ProfileKind; name: string; items: ProfileItem[] }[] {
  return (Object.keys(KIND_TEXT) as ProfileKind[])
    .map((kind) => ({
      kind,
      name: KIND_TEXT[kind],
      items: s.profiles
        .filter((p) => p.kind === kind)
        .map((p) => ({
          p,
          cube: s.cubes.find((c) => c.ai === p.id) ?? null,
          sub: p.kind === "project" ? (p.detail.split(/[\\/]/).pop() ?? p.detail) : p.detail,
        })),
    }))
    .filter((g) => g.items.length);
}

// 추천으로 채우기: 후보에 프로젝트 · 에이전트가 없으면 아무도 안 쓰는 구성을 구성 없는 큐브(패드 위 먼저)에 준다.
export function recommend(s: Snapshot): { slot: Cube["slot"]; profile: Profile }[] {
  const have = new Set(candProfiles(s).map((p) => p.kind));
  const used = new Set(s.cubes.map((c) => c.ai));
  const free = [
    ...s.cubes.filter((c) => linked(c) && !c.ai && onPad(c)),
    ...s.cubes.filter((c) => linked(c) && !c.ai && !onPad(c)),
  ];
  const out: { slot: Cube["slot"]; profile: Profile }[] = [];
  for (const kind of ["project", "agent"] as const) {
    const p = s.profiles.find((q) => q.kind === kind && !used.has(q.id));
    const c = free[out.length];
    if (!have.has(kind) && p && c) out.push({ slot: c.slot, profile: p });
  }
  return out;
}

// 진행 단계 [단계, 맡는 것]. 에이전트가 둘이면 앞이 구현, 뒤가 계획 · 검토.
export function pipeline(profiles: Profile[]): [string, string][] {
  const ag = profiles.filter((p) => p.kind === "agent");
  if (ag.length < 2)
    return [
      ["코드 구현", ag[0]?.name ?? "구현 담당"],
      ["테스트 확인", "자동 판정"],
    ];
  return [
    ["계획 세우기", ag[1]!.name],
    ["코드 구현", ag[0]!.name],
    ["테스트 확인", "자동 판정"],
    ["결과 검토", ag[1]!.name],
  ];
}
export const runProfiles = (s: Snapshot, extra: Profile[]) => [...candProfiles(s), ...extra];
