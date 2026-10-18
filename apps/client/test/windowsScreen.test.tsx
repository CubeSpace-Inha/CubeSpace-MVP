import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test } from "vitest";
import { App } from "../src/renderer/App";
import { OK } from "../src/renderer/dev/fixtures";
import { createFakeApi } from "./fakeApi";

afterEach(cleanup);

async function monitorButtons(count: number) {
  render(
    <MemoryRouter initialEntries={["/windows"]}>
      <App api={createFakeApi({ ...OK, monitor: { no: 1, count } }).api} />
    </MemoryRouter>,
  );
  const prev = await screen.findByRole("button", { name: "이전 모니터" });
  const next = screen.getByRole("button", { name: "다음 모니터" });
  return [prev, next] as HTMLButtonElement[];
}

test("모니터가 하나면 모니터 바꾸기 버튼을 막는다", async () => {
  const [prev, next] = await monitorButtons(1);
  expect(prev!.disabled).toBe(true);
  expect(next!.disabled).toBe(true);
});

test("모니터가 둘이면 모니터 바꾸기 버튼을 쓸 수 있다", async () => {
  const [prev, next] = await monitorButtons(2);
  expect(prev!.disabled).toBe(false);
  expect(next!.disabled).toBe(false);
});
