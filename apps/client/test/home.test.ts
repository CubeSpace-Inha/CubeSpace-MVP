import { expect, test } from "vitest";
import { OK, PAD_LOST } from "../src/renderer/dev/fixtures";
import { homeView } from "../src/renderer/model/home";
import { OFF } from "../src/renderer/cube/led";

// 견본: A 창 모드(w1), B · C AI 모드, D · F 패드 밖, E 도크 충전 중
const v = homeView(OK);

test("패드 위에는 연결되고 자리가 있는 큐브만, 자리는 패드 비율", () => {
  expect(v.placed.map((p) => p.cube.name)).toEqual(["A", "B", "C"]);
  expect(v.placed[0]).toMatchObject({ x: 30 / 200, y: 67 / (400 / 3) });
});

test("패드 LED는 창 모드 큐브가 맡은 창(w1, 왼쪽 반)의 테두리만", () => {
  expect(v.leds.length).toBe(2 * 12 + 2 * 14); // 12 × 16 칸의 바깥 한 줄
  expect(new Set(v.leds.map((l) => l.color))).toEqual(new Set(["rgb(18 181 214)"]));
});

test("큐브 테두리: 창 모드는 영역 색, AI 모드는 보라", () => {
  expect(v.placed.map((p) => p.line)).toEqual(["rgb(18 181 214)", "rgb(124 92 255)", "rgb(124 92 255)"]);
});

test("안 쓰는 큐브 칸: 패드 밖 큐브 뒤에 충전 중 큐브, 나머지는 빈 칸", () => {
  expect(v.spare.map((c) => c?.name ?? null)).toEqual(["D", "F", "E", null, null, null]);
  expect(v.spare[2]).toMatchObject({ charging: true, pixels: OFF });
});

test("연결 표시: 슬롯마다 큐브 이름과 상태", () => {
  expect(v.chain.map((c) => c?.kind)).toEqual(["ok", "ok", "ok", "ok", "off", "ok"]);
});

test("패드 연결이 끊기면 동결", () => {
  expect(v.frozen).toBe(false);
  expect(homeView(PAD_LOST).frozen).toBe(true);
});
