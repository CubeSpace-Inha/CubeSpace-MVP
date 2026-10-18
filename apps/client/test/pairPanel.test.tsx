import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import type { Slot, Snapshot } from "@cubespace/protocol";
import { App } from "../src/renderer/App";
import { OK } from "../src/renderer/dev/fixtures";
import { createFakeApi } from "./fakeApi";

afterEach(cleanup);

// 슬롯 4 · 5가 빈 견본
const FREE2: Snapshot = { ...OK, cubes: OK.cubes.filter((c) => c.slot < 4) };

function renderAt(path: string, fake = createFakeApi(FREE2)) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App api={fake.api} />
    </MemoryRouter>,
  );
  return fake;
}

// core가 확인점 위 큐브를 등록한 것처럼 스냅샷을 바꾼다
async function registerAt(fake: ReturnType<typeof createFakeApi>, slot: Slot) {
  const s = structuredClone(await fake.api.getSnapshot());
  s.cubes.push({ ...OK.cubes.find((c) => c.slot === slot)! });
  s.cubes.sort((a, b) => a.slot - b.slot);
  s.pairing!.done.push(slot);
  act(() => fake.push(s));
}

test("페어링: 시작하면 k/N 안내, 등록될 때마다 글자, 다 채우면 완료 뒤 처음으로", async () => {
  const fake = renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  expect(await screen.findByText("큐브 하나를 확인점에 올려 주세요 (1/2)")).toBeTruthy();

  await registerAt(fake, 4);
  expect(screen.getByText("E로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/2)")).toBeTruthy();

  await registerAt(fake, 5);
  expect(screen.getByText("큐브 2개 등록 완료")).toBeTruthy();
  await waitFor(() => expect(screen.getByRole("button", { name: /슬롯 6개가 모두 찼어요/ })).toBeTruthy(), { timeout: 2500 });
  expect((await fake.api.getSnapshot()).pairing).toBeNull();
}, 15000); // 화면 그리기 + 완료 표시 1.7초

test("그만하기를 누르면 stopPairing, 처음으로 돌아간다", async () => {
  const fake = renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  fireEvent.click(await screen.findByRole("button", { name: "그만하기" }));
  expect(await screen.findByRole("button", { name: "큐브 등록 시작" })).toBeTruthy();
  expect((await fake.api.getSnapshot()).pairing).toBeNull();
});

test("켜진 미등록 큐브가 없으면 안내 뒤 처음으로", async () => {
  const fake = createFakeApi(FREE2);
  vi.spyOn(fake.api, "startPairing").mockResolvedValue(0);
  renderAt("/", fake);
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  expect(await screen.findByText("찾은 큐브가 없어요")).toBeTruthy();
  expect(screen.getByText("등록할 큐브를 켜 주세요")).toBeTruthy();
  await waitFor(() => expect(screen.queryByText("찾은 큐브가 없어요")).toBeNull(), { timeout: 2500 });
});

test("다시 열면 지난 등록은 알리지 않고 진행 표시는 이어진다", async () => {
  const fake = createFakeApi({ ...FREE2, pairing: { total: 2, done: [] } });
  const s = structuredClone(await fake.api.getSnapshot());
  s.cubes.push({ ...OK.cubes.find((c) => c.slot === 4)! });
  s.pairing!.done.push(4);
  fake.push(s);
  renderAt("/", fake);
  expect(await screen.findByText("E로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/2)")).toBeTruthy();
  expect(screen.queryByText("큐브 E 등록 완료 · 슬롯 4")).toBeNull();
});

test("등록 중 패드가 끊기면(core가 pairing null) 처음으로, 패드 연결 안내", async () => {
  const fake = renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  await screen.findByText("큐브 하나를 확인점에 올려 주세요 (1/2)");
  const s = structuredClone(await fake.api.getSnapshot());
  s.pad = { ...s.pad, session: "lost" };
  s.pairing = null;
  act(() => fake.push(s));
  expect(await screen.findByText("패드를 먼저 연결해 주세요")).toBeTruthy();
  expect(screen.queryByText(/확인점에 올려 주세요/)).toBeNull();
});

test("등록 중에 화면을 떠나면 stopPairing", async () => {
  const fake = renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  await screen.findByText("큐브 하나를 확인점에 올려 주세요 (1/2)");
  cleanup();
  await waitFor(async () => expect((await fake.api.getSnapshot()).pairing).toBeNull());
});
