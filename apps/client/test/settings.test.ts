import { expect, test } from "vitest";
import { createFakeApi } from "./fakeApi";
import { OK, PAD_LOST } from "../src/renderer/dev/fixtures";
import { cubeLineText, freeSlot, pairPhase, pairStep, placeText } from "../src/renderer/model/settings";

test("빈 슬롯: 6칸이 다 차면 없다", () => {
  expect(freeSlot(OK)).toBeUndefined();
  expect(freeSlot({ ...OK, cubes: OK.cubes.filter((c) => c.slot !== 2) })).toBe(2);
});

test("단계: 패드가 끊기면 0, 시작 전 · 찾은 큐브 없음은 1, 올리는 중 · 완료는 3", () => {
  expect(pairStep(PAD_LOST, "idle")).toBe(0);
  expect(pairStep(OK, "idle")).toBe(1);
  expect(pairStep(OK, "none")).toBe(1);
  expect(pairStep(OK, "place")).toBe(3);
  expect(pairStep(OK, "done")).toBe(3);
});

test("단계는 스냅샷 pairing에서: 없으면 idle(0개였으면 none), 덜 채웠으면 place, 다 채웠으면 done", () => {
  expect(pairPhase(OK, false)).toBe("idle");
  expect(pairPhase(OK, true)).toBe("none");
  expect(pairPhase({ ...OK, pairing: { total: 2, done: [4] } }, false)).toBe("place");
  expect(pairPhase({ ...OK, pairing: { total: 2, done: [4, 5] } }, false)).toBe("done");
});

test("올리는 중 안내: k는 지금 올릴 큐브 번째, 하나라도 등록했으면 그 글자", () => {
  expect(placeText({ total: 4, done: [] })).toBe("큐브 하나를 확인점에 올려 주세요 (1/4)");
  expect(placeText({ total: 4, done: [2] })).toBe("C로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/4)");
});

test("등록된 큐브 줄: 연결 · 자리 · 배터리, 꺼지면 이유", () => {
  expect(cubeLineText(OK.cubes[0]!)).toBe("연결 · 패드 위 · 82 %");
  expect(cubeLineText({ ...OK.cubes[0]!, link: "down", downReason: "dock" })).toBe("꺼짐 · 도크 · 충전 중 · 82 %");
});

test("가짜 API: 등록 해제하면 맡던 창은 담당 없음, 장치 추가는 빈 슬롯 수만큼 센다", async () => {
  const { api } = createFakeApi();
  await api.unregisterCube(0);
  let s = await api.getSnapshot();
  expect(s.cubes.some((c) => c.slot === 0)).toBe(false);
  expect(s.windows.some((w) => w.owner === "A")).toBe(false);
  expect(await api.startPairing()).toBe(1);
  expect((await api.getSnapshot()).pairing).toEqual({ total: 1, done: [] });
  await api.stopPairing();
  s = await api.getSnapshot();
  expect(s.pairing).toBeNull();
  await api.setRules({ backSec: 2 });
  expect((await api.getSnapshot()).settings.rules.backSec).toBe(2);
});
