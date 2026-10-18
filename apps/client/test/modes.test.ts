import { expect, test } from "vitest";
import { fitMode } from "@cubespace/protocol";
import { OK } from "../src/renderer/dev/fixtures";
import { cellXy, nowCard, splitRects, toCells } from "../src/renderer/model/modes";

const L = [
  { xy: [80, 48] as [number, number], app: "a" },
  { xy: [116, 48] as [number, number], app: "b" },
  { xy: [116, 84] as [number, number], app: "c" },
];

test("같은 모양은 다른 자리에 놓아도 맞고, 다른 모양은 안 맞는다", () => {
  const moved = L.map((c) => ({ xy: [c.xy[0] - 40, c.xy[1] + 10] as [number, number] }));
  expect(fitMode(moved, L, 2)).toHaveLength(3);
  const line = [{ xy: [20, 20] }, { xy: [56, 20] }, { xy: [92, 20] }] as { xy: [number, number] }[];
  expect(fitMode(line, L, 2)).toBeNull();
  expect(fitMode(line.slice(0, 2), L, 2)).toBeNull();
});

test("화면 나누기: 2개는 반반, 3개는 왼쪽 하나와 오른쪽 위아래", () => {
  const r = { ...OK.settings.rules, split2: "half" as const, split3: "big" as const };
  expect(splitRects(L.slice(0, 2), r)).toEqual([
    [0, 0, 0.5, 1],
    [0.5, 0, 0.5, 1],
  ]);
  const three = splitRects(L, r);
  expect(three[0]![0]).toBe(0);
  expect(three[1]![1]).toBe(0);
  expect(three[2]![1]).toBeGreaterThan(0);
});

test("지금 패드: 큐브 3개가 모두 창에 묶여 저장할 수 있고, 저장된 모드는 아니다", () => {
  const n = nowCard(OK);
  expect(n.cubes).toHaveLength(3);
  expect(n.canSave).toBe(true);
  expect(n.same).toBeUndefined();
  expect(n.status).toBe("큐브 3개 · 저장된 모드 아님");
});

test("격자 칸 ↔ 패드 자리는 되돌릴 수 있다", () => {
  const cells = [
    { gx: 0, gy: 0, app: "a" },
    { gx: 5, gy: 3, app: "b" },
  ];
  expect(toCells({ id: "x", name: "x", cubes: cells.map(cellXy) })).toEqual(cells);
});
