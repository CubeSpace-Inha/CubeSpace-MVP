import { expect, test } from "vitest";
import { OK } from "../src/renderer/dev/fixtures";
import { cubeInfo, monitorName, pickItems, windowRows } from "../src/renderer/model/windows";

const cube = (n: string) => OK.cubes.find((c) => c.name === n)!;

test("큐브 칸 상태: 패드 위 묶임 · 패드 밖 · 고르는 중", () => {
  expect(cubeInfo(OK, cube("A")).state).toBe("bound");
  expect(cubeInfo(OK, cube("D")).state).toBe("out");
  expect(cubeInfo(OK, cube("A"), true).state).toBe("pick");
});

test("열린 창은 큐브에 묶인 창이 먼저, 사라진 창은 빠진다", () => {
  const rows = windowRows(OK);
  const firstFree = rows.findIndex((r) => !r.cube);
  expect(rows.slice(firstFree).every((r) => !r.cube)).toBe(true);
  expect(rows.some((r) => r.w.status === "relaunchable")).toBe(false);
});

test("고르기 목록: 담당 없는 열린 창 먼저, 그다음 프로그램", () => {
  const items = pickItems(OK);
  expect(items[0]!.group).toBe("열린 창");
  expect(items.filter((x) => x.window).every((x) => !x.window!.owner)).toBe(true);
  expect(items.at(-1)!.group).toBe("등록된 프로그램");
});

test("모니터 이름", () => {
  expect(monitorName(1)).toBe("주 모니터");
  expect(monitorName(2)).toBe("모니터 2");
});
