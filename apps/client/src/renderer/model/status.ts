import type { AppWindow, Cube, CubeRunState, DownReason, Notice, ProfileKind, WindowStatus } from "@cubespace/protocol";
import type { Tone } from "../components/Badge";

// 상태 → 화면 문구. 시안 pad-home.html의 STATE · batt 문구 그대로.

export const STATE_TEXT: Record<CubeRunState, string> = {
  idle: "미배정",
  run: "가동",
  protected: "보호",
  lifted: "들림 대기",
  recog: "재인식 대기",
  hold: "끊김 보류",
  protectedAway: "보호 부재",
  removed: "제거됨",
};

export const STATE_TONE: Record<CubeRunState, Tone> = {
  idle: "neutral",
  run: "ok",
  protected: "danger",
  lifted: "neutral",
  recog: "warn",
  hold: "warn",
  protectedAway: "danger",
  removed: "neutral",
};

export function battText(c: Cube): string {
  const p = c.battPct == null ? "—" : `${Math.round(c.battPct)} %`;
  if (c.battLevel === "low10") return `${p} · 10 % 이하`;
  if (c.battLevel === "low30") return `${p} 충전 필요`;
  return p;
}

// 창 상태 문구 · 톤 · 설명(시안 WIN)
export const WIN_TEXT: Record<WindowStatus, { text: string; tone: Tone; note?: string }> = {
  linked: { text: "연결됨", tone: "ok" },
  minimized: { text: "최소화됨 (제거됨)", tone: "neutral", note: "담당 큐브를 다시 올리면 되돌린다." },
  relaunchable: { text: "재실행 가능", tone: "warn", note: "창이 사라졌다. 저장한 정보로 다시 열 수 있다." },
  gone: { text: "창 없음", tone: "neutral", note: "복원 정보가 없어 다시 열 수 없다. 담당 큐브는 미배정이 된다." },
  excluded: { text: "제외 · 관리자 권한", tone: "danger", note: "관리자 권한으로 실행된 창은 CUBE SPACE가 옮길 수 없습니다." },
  noResponse: { text: "응답 없음", tone: "warn", note: "1초 안에 창이 바뀌지 않았다. 다시 보내지 않고, 나중에 바뀌면 자동으로 풀린다." },
};

export const KIND_TEXT: Record<ProfileKind, string> = { project: "프로젝트", agent: "에이전트", prompt: "지침", skill: "스킬", mcp: "MCP" };

const LINK_WHY: Record<DownReason, string> = { link: "무선 끊김", dock: "도크 · 충전 중", button: "버튼으로 끔", lowVolt: "저전압" };

// 큐브 무선 연결 문구(시안 link)
export function linkText(c: Cube): { text: string; tone: Tone; why?: string } {
  if (c.link === "up") return { text: "연결", tone: "ok" };
  if (c.downReason === "link") return { text: "끊김", tone: "warn", why: LINK_WHY.link };
  return { text: "꺼짐", tone: c.downReason === "lowVolt" ? "danger" : "muted", why: c.downReason ? LINK_WHY[c.downReason] : "사유 모름" };
}

export function noticeText(n: Notice, cubes: Cube[]): string {
  if (n.code === "padLost") return "패드 연결이 끊겼습니다. 판정을 멈추고 창과 배정은 그대로 둡니다.";
  return `큐브 ${cubes.find((c) => c.slot === n.slot)?.name ?? n.slot}에 아이콘을 보내지 못했습니다.`;
}

export const winName = (w: AppWindow) => (w.title ? `${w.app} · ${w.title}` : w.app);
