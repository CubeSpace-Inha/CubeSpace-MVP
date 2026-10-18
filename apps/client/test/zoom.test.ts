import { expect, test } from "vitest";
import { createFakeApi } from "./fakeApi";
import { OK } from "../src/renderer/dev/fixtures";
import { winDot } from "../src/renderer/model/home";
import { candGroups } from "../src/renderer/model/zoom";

const A = OK.cubes.find((c) => c.name === "A")!;
const win = (id: string) => OK.windows.find((w) => w.id === id)!;

test("창 점: 창 모드 큐브가 맡은 창만 영역 색, 나머지는 회색", () => {
  expect(winDot(OK, win("w1"))).toBe("rgb(18 181 214)");
  expect(winDot(OK, win("w2"))).toBe("rgb(154 161 173)"); // B는 AI 모드
  expect(winDot(OK, win("w6"))).toBe("rgb(154 161 173)");
});

test("창 후보: 담당 없는 창 → 다른 큐브의 창(맞바꿈), 제외 · 지금 창은 빠진다", () => {
  const g = candGroups(OK, A, "win");
  expect(g.map((x) => x.name)).toEqual(["담당 없는 창", "다른 큐브의 창 · 맞바꿈"]);
  expect(g[0]!.items.map((c) => c.id)).toEqual(["w6", "w7", "w4"]);
  expect(g[1]!.items.map((c) => c.id)).toEqual(["w2", "w3"]);
});

test("AI 후보: 지금 구성은 빠지고, 다른 큐브가 쓰는 구성은 맞바꿈", () => {
  const items = candGroups(OK, A, "ai").flatMap((g) => g.items);
  expect(items.some((c) => c.id === A.ai)).toBe(false);
  expect(items.find((c) => c.id === "p2")).toMatchObject({ tag: "큐브 B", sub: "맞바꿈" });
});

test("가짜 API: 다른 큐브의 창을 고르면 창과 영역을 맞바꾼다", async () => {
  const { api } = createFakeApi();
  await api.assignWindow(A.slot, "w2");
  const s = await api.getSnapshot();
  const B = s.cubes.find((c) => c.name === "B")!;
  expect(s.cubes.find((c) => c.name === "A")!.window).toBe("w2");
  expect(B.window).toBe("w1");
  expect(s.layout.find((p) => p.window === "w2")!.rect).toEqual([0, 0, 0.5, 1]);
});

test("가짜 API: AI 구성 맞바꿈 · 모드 바꾸기", async () => {
  const { api } = createFakeApi();
  await api.assignAi(A.slot, "p2");
  await api.setMode(A.slot, "ai");
  const s = await api.getSnapshot();
  expect(s.cubes.find((c) => c.name === "A")).toMatchObject({ ai: "p2", mode: "ai" });
  expect(s.cubes.find((c) => c.name === "B")!.ai).toBe(A.ai);
});
