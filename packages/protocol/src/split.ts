import type { Rules } from "./snapshot";

// 화면 나누기(시안 pad-home.html의 calc). 화면(PC 창 그림)과 core(실제 창 배치)가 같이 쓴다.

export const PAD_W = 200; // 패드 조작 영역(mm)
export const PAD_H = 400 / 3;
// 장치 추가 확인점(mm): 패드 가운데. 반경은 큐브 한 변(35 mm)보다 조금 크게
export const PAD_CHECK = { xy: [PAD_W / 2, PAD_H / 2] as [number, number], r: 20 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// 큐브 위치와 규칙으로 창 사각형 [x, y, w, h](0~1)
export function splitRects(list: { xy: [number, number] }[], rules: Rules): [number, number, number, number][] {
  const a = list.map((c, i) => ({
    i,
    nx: c.xy[0] / PAD_W,
    ny: c.xy[1] / PAD_H,
  }));
  const n = a.length;
  const by = (k: "nx" | "ny") => [...a].sort((p, q) => p[k] - q[k]);
  const R: [number, number, number, number][] = [];
  if (n === 1) R[0] = [0, 0, 1, 1];
  if (n === 2) {
    const [l, r] = by("nx") as [(typeof a)[0], (typeof a)[0]];
    const m = rules.split2 === "half" ? 0.5 : clamp((l.nx + r.nx) / 2, 0.3, 0.7);
    R[l.i] = [0, 0, m, 1];
    R[r.i] = [m, 0, 1 - m, 1];
  }
  if (n > 2 && (n === 3 ? rules.split3 : rules.split4) === "col")
    by("nx").forEach((c, k) => (R[c.i] = [k / n, 0, 1 / n, 1]));
  else if (n === 3) {
    const [l, ...rs] = by("nx") as [(typeof a)[0], (typeof a)[0], (typeof a)[0]];
    const [t, b] = rs.sort((p, q) => p.ny - q.ny) as [(typeof a)[0], (typeof a)[0]];
    const m = clamp((l.nx + (t.nx + b.nx) / 2) / 2, 0.3, 0.7);
    const my = clamp((t.ny + b.ny) / 2, 0.3, 0.7);
    R[l.i] = [0, 0, m, 1];
    R[t.i] = [m, 0, 1 - m, my];
    R[b.i] = [m, my, 1 - m, 1 - my];
  } else if (n === 4) {
    const s = by("ny");
    const [t0, t1] = s.slice(0, 2).sort((p, q) => p.nx - q.nx) as [(typeof a)[0], (typeof a)[0]];
    const [b0, b1] = s.slice(2).sort((p, q) => p.nx - q.nx) as [(typeof a)[0], (typeof a)[0]];
    const my = clamp((t0.ny + t1.ny + b0.ny + b1.ny) / 4, 0.3, 0.7);
    const mt = clamp((t0.nx + t1.nx) / 2, 0.3, 0.7);
    const mb = clamp((b0.nx + b1.nx) / 2, 0.3, 0.7);
    R[t0.i] = [0, 0, mt, my];
    R[t1.i] = [mt, 0, 1 - mt, my];
    R[b0.i] = [0, my, mb, 1 - my];
    R[b1.i] = [mb, my, 1 - mb, 1 - my];
  }
  return R;
}
