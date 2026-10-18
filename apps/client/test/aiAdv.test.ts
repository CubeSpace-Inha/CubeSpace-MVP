import { expect, test } from "vitest";
import { OK } from "../src/renderer/dev/fixtures";
import {
  conflictChecks,
  moveChoice,
  nextChoice,
  proposalBad,
  proposeTargets,
  recommendIds,
  removeChoice,
} from "../src/renderer/model/aiAdv";

const A = OK.cubes[0]!; // 현재 p3, 전환 목록 [p3, p4]
const B = OK.cubes[1]!; // 현재 p2, 전환 목록 [p2]

test("다음 터치: 지금 항목 다음, 끝이면 처음으로. 하나뿐이면 없음", () => {
  expect(nextChoice(OK, A)).toBe("p4");
  expect(nextChoice(OK, { ...A, ai: "p4" })).toBe("p3");
  expect(nextChoice(OK, { ...A, ai: null })).toBe("p3");
  expect(nextChoice(OK, B)).toBeNull();
});

test("목록에서 빼기: 지금 항목을 빼면 다음 것이 지금 항목이 된다", () => {
  expect(removeChoice(OK, A, "p3")).toEqual({ list: ["p4"], cur: "p4" });
  expect(removeChoice(OK, A, "p4")).toEqual({ list: ["p3"], cur: "p3" });
  expect(removeChoice(OK, B, "p2")).toEqual({ list: [], cur: null });
});

test("순서 바꾸기: 끝을 넘으면 그대로", () => {
  expect(moveChoice(["a", "b", "c"], "c", -1)).toEqual(["a", "c", "b"]);
  expect(moveChoice(["a", "b"], "a", -1)).toEqual(["a", "b"]);
});

test("시작 전 확인: 패드가 끊기면 패드 연결이 걸린다", () => {
  const pad = (s: typeof OK) => conflictChecks(s).find(([n]) => n === "패드 연결")!;
  expect(pad(OK)[1]).toBe(true);
  expect(pad({ ...OK, pad: { ...OK.pad, session: "lost" } })[1]).toBe(false);
});

test("추천 배정: 프로젝트 + 구현, 가볍게가 아니면 계획도. 이미 그 구성인 큐브 → 패드 위 큐브 순", () => {
  expect(recommendIds(OK, "light")).toEqual(["p1", "p2"]);
  const ids = recommendIds(OK, "balanced");
  expect(ids).toEqual(["p1", "p2", "p3"]);
  const t = proposeTargets(OK, ids);
  expect(t).toEqual([0, 1, 2]);
  expect(proposalBad(t)).toBe(false);
  expect(proposalBad([0, 0])).toBe(true);
  expect(proposalBad([-1])).toBe(true);
});
