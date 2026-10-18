import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test } from "vitest";
import type { Snapshot } from "@cubespace/protocol";
import { App } from "../src/renderer/App";
import { createFakeApi } from "./fakeApi";
import { OK } from "../src/renderer/dev/fixtures";
import { NAV } from "../src/renderer/layout/nav";

afterEach(cleanup);

// core가 막 떴을 때: 등록된 큐브 · 창 · 모드가 없고 패드가 끊겨 있다
const EMPTY: Snapshot = {
  ...OK,
  pad: { session: "lost", fw: "", badSensors: [] },
  cubes: [],
  windows: [],
  layout: [],
  modes: [],
  activeMode: null,
  profiles: [],
  settings: { ...OK.settings, cubes: [], favs: [] },
  notices: [{ code: "padLost" }],
  monitor: { no: 1, count: 0 },
  pairing: null,
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App api={createFakeApi(EMPTY).api} />
    </MemoryRouter>,
  );

test.each(NAV.map((n) => n.path))("빈 상태에서도 %s 화면이 깨지지 않는다", async (path) => {
  renderAt(path);
  expect(await screen.findByRole("navigation", { name: "주 메뉴" })).toBeTruthy();
});

test("빈 상태에서도 페어링 화면이 그려진다", async () => {
  renderAt("/");
  expect(await screen.findByRole("heading", { level: 1, name: "페어링" })).toBeTruthy();
});

test("빈 상태 페어링: 패드가 없으면 등록 · 시작을 막는다", async () => {
  renderAt("/");
  expect((await screen.findByRole("button", { name: "패드를 먼저 연결해 주세요" })).hasAttribute("disabled")).toBe(
    true,
  );
  expect(screen.getByText("패드를 찾는 중…")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "큐브를 하나 이상 등록하면 시작할 수 있어요" }).hasAttribute("disabled"),
  ).toBe(true);
});
