// 모드 모양 맞추기(시안 pad-home.html의 pairSig · fit). 화면(겹치는 모드 막기)과 core(모드 실행)가 같이 쓴다.
// 두 자리 사이의 방향(8방향)과 붙음이 모든 쌍에서 같으면 같은 모양이다. 어느 큐브를 써도 된다.

export const CUBE_MM = 35;
type Pt = { xy: [number, number] };

const DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
function pairSig(a: Pt, b: Pt, gapMm: number) {
  const dx = b.xy[0] - a.xy[0];
  const dy = b.xy[1] - a.xy[1];
  const dir = DIRS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
  return dir + (Math.max(Math.abs(dx), Math.abs(dy)) <= CUBE_MM + gapMm ? "+" : "-");
}

const perms = <T>(a: T[]): T[][] =>
  a.length < 2 ? [a] : a.flatMap((x, k) => perms([...a.slice(0, k), ...a.slice(k + 1)]).map((p) => [x, ...p]));

// 놓인 것(list)을 모드 자리(slots)에 짝지은 [놓인 것, 자리] 목록. 모양이 다르면 null.
// 대칭 모양은 가운데를 맞췄을 때 가장 가까운 짝을 쓴다.
export function fitMode<A extends Pt, B extends Pt>(list: A[], slots: B[], gapMm: number): [A, B][] | null {
  if (list.length !== slots.length || list.length === 0) return null;
  const mid = (a: Pt[], k: 0 | 1) => a.reduce((t, c) => t + c.xy[k], 0) / a.length;
  const [lx, ly, sx, sy] = [mid(list, 0), mid(list, 1), mid(slots, 0), mid(slots, 1)];
  let best: [A, B][] | null = null;
  let be = Infinity;
  for (const p of perms(list)) {
    const same = p.every((a, i) =>
      p.every((b, j) => j <= i || pairSig(a, b, gapMm) === pairSig(slots[i]!, slots[j]!, gapMm)),
    );
    if (!same) continue;
    const e = p.reduce(
      (t, c, k) => t + (c.xy[0] - lx - slots[k]!.xy[0] + sx) ** 2 + (c.xy[1] - ly - slots[k]!.xy[1] + sy) ** 2,
      0,
    );
    if (e < be) {
      be = e;
      best = p.map((c, k) => [c, slots[k]!]);
    }
  }
  return best;
}
