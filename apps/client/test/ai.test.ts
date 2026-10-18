import { expect, test } from "vitest";
import { OK } from "../src/renderer/dev/fixtures";
import { aiStatus, pipeline, profileGroups, recommend } from "../src/renderer/model/ai";

test("상태 줄: 맡길 일이 없으면 대기, 있으면 준비 · 진행 중", () => {
  expect(aiStatus(OK, "", false).kind).toBe("wait");
  expect(aiStatus(OK, "고쳐 줘", false).kind).toBe("ok");
  expect(aiStatus(OK, "고쳐 줘", true).text).toBe("진행 중이에요");
});

test("구성 목록은 종류별로 묶이고 쓰는 큐브가 붙는다", () => {
  const g = profileGroups(OK);
  expect(g[0]!.name).toBe("프로젝트");
  const p2 = g.flatMap((x) => x.items).find((x) => x.p.id === "p2")!;
  expect(p2.cube?.name).toBe("B");
});

test("추천은 빠진 종류만, 아무도 안 쓰는 구성을 구성 없는 큐브에 준다", () => {
  const r = recommend(OK);
  for (const x of r) {
    expect(OK.cubes.find((c) => c.slot === x.slot)!.ai).toBeNull();
    expect(OK.cubes.some((c) => c.ai === x.profile.id)).toBe(false);
  }
  expect(new Set(r.map((x) => x.profile.kind)).size).toBe(r.length);
});

test("에이전트가 하나면 2단계, 둘이면 4단계", () => {
  const ag = OK.profiles.filter((p) => p.kind === "agent");
  expect(pipeline(ag.slice(0, 1))).toHaveLength(2);
  expect(pipeline(ag.slice(0, 2))).toHaveLength(4);
});
