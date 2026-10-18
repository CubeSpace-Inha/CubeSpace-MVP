// 모든 메시지의 봉투. pipe에 JSON 한 줄로 보낸다.
// 연결하면 hello(버전 · 종류) → sync(전체 상태) → 변경분 순서. 재연결 때도 같다.

export const PROTOCOL_VERSION = 1;

export type Envelope<T extends string = string, P = unknown> = {
  v: number;
  type: T;
  id?: string; // 요청 ↔ 응답 짝
  seq?: number; // 입력 번호: 같은 seq는 한 번만 처리
  ts: number;
  payload: P;
};

export type Role = "client" | "core" | "pad" | "win";

// 요청에 대한 응답(type "result", 요청과 같은 id)
export type Result = { ok: true; value: unknown } | { ok: false; error: string };

export type Empty = Record<string, never>;

export function envelope<T extends string, P>(
  type: T,
  payload: P,
  extra: { id?: string; seq?: number } = {},
): Envelope<T, P> {
  return { v: PROTOCOL_VERSION, type, ...extra, ts: Date.now(), payload };
}

// 받은 한 줄 → 봉투. 모양이 틀리면 던진다. payload 안쪽은 받는 쪽이 type을 보고 쓴다.
export function parseEnvelope(line: string): Envelope {
  const m: unknown = JSON.parse(line);
  if (typeof m !== "object" || m === null) throw new Error("봉투가 객체가 아님");
  const e = m as Record<string, unknown>;
  if (typeof e.v !== "number") throw new Error("v 없음");
  if (typeof e.type !== "string") throw new Error("type 없음");
  if (typeof e.ts !== "number") throw new Error("ts 없음");
  if (!("payload" in e)) throw new Error("payload 없음");
  if (e.id !== undefined && typeof e.id !== "string") throw new Error("id가 문자열이 아님");
  if (e.seq !== undefined && typeof e.seq !== "number") throw new Error("seq가 숫자가 아님");
  return e as Envelope;
}
