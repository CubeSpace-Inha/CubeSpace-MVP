import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test } from "vitest";
import { App } from "../src/renderer/App";
import { createFakeApi } from "./fakeApi";
import { NAV } from "../src/renderer/layout/nav";

afterEach(cleanup);

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App api={createFakeApi().api} />
    </MemoryRouter>,
  );
}

// 화면 제목(h1)은 시안을 따르므로 메뉴 이름과 다를 수 있다
test.each(NAV.map((n) => [n.path, n.label]))("%s 에서 %s 화면을 보여 주고 메뉴가 골라져 있다", async (path, label) => {
  renderAt(path);
  expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
  expect((await screen.findByRole("button", { name: label })).getAttribute("aria-current")).toBe("page");
});

test("/ 는 메뉴 없는 페어링 화면이고, 나중에 하기로 /home에 간다", async () => {
  renderAt("/");
  expect(await screen.findByRole("heading", { level: 1, name: "페어링" })).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "주 메뉴" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "나중에 하기" }));
  expect(await screen.findByRole("heading", { level: 1, name: "장치 상태" })).toBeTruthy();
});

test("메뉴를 누르면 그 화면으로 간다", async () => {
  renderAt("/home");
  fireEvent.click(await screen.findByRole("button", { name: "설정" }));
  expect(await screen.findByRole("heading", { level: 1, name: "설정" })).toBeTruthy();
});

test("없는 경로는 홈으로 보낸다", async () => {
  renderAt("/nope");
  expect(await screen.findByRole("heading", { level: 1, name: "장치 상태" })).toBeTruthy();
});

test("개발 모드에서 템플릿 보기 버튼으로 /template에 간다", async () => {
  renderAt("/home");
  fireEvent.click(await screen.findByRole("button", { name: "템플릿 보기" }));
  expect(await screen.findByRole("heading", { name: "템플릿" })).toBeTruthy();
});

test("개발 모드에서 /template 카탈로그를 보여 준다", async () => {
  renderAt("/template");
  expect(await screen.findByRole("heading", { name: "템플릿" })).toBeTruthy();
});

test("홈: ?cube= 로 큐브를 확대하고, 전체 보기로 돌아간다", async () => {
  renderAt("/home?cube=0");
  expect(await screen.findByRole("heading", { level: 2, name: "슬롯 0 · 큐브 A" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "전체 보기" }));
  expect(screen.queryByRole("heading", { level: 2, name: "슬롯 0 · 큐브 A" })).toBeNull();
});

test("창: 열린 창 목록을 보여 준다", async () => {
  renderAt("/windows");
  expect(await screen.findByRole("heading", { name: /^열린 창/ })).toBeTruthy();
});

test("창: 묶음을 풀고 ＋로 고른 것을 다시 묶는다", async () => {
  renderAt("/windows");
  expect(await screen.findByText("큐브 A 설정")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "묶음 풀기" }));
  fireEvent.click(await screen.findByRole("button", { name: "무엇을 열지 고르기" }));
  const list = screen.getByRole("group", { name: "무엇을 열지 고르기" });
  fireEvent.click(list.querySelector("button")!);
  expect(await screen.findByRole("button", { name: "묶음 풀기" })).toBeTruthy();
});

test("AI: 예시를 넣으면 시작할 수 있고, 시작하면 진행 카드가 뜬다", async () => {
  renderAt("/ai");
  const start = await screen.findByRole("button", { name: "▶ 시작" });
  expect((start as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "버그 고치기" }));
  expect((start as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(start);
  expect(await screen.findByRole("button", { name: "중지" })).toBeTruthy();
});

test("설정: 등록 해제는 한 번 더 눌러야 한다", async () => {
  renderAt("/settings");
  expect(await screen.findAllByRole("button", { name: "등록 해제" })).toHaveLength(6);
  fireEvent.click(screen.getAllByRole("button", { name: "등록 해제" })[0]!);
  fireEvent.click(await screen.findByRole("button", { name: "정말 해제" }));
  await waitFor(() => expect(screen.getAllByRole("button", { name: "등록 해제" })).toHaveLength(5));
});

test("AI 고급 설정: 터치로 다음 구성, 목록에 추가, 추천 배정 탭", async () => {
  renderAt("/ai");
  fireEvent.click(await screen.findByRole("button", { name: "고급 설정 ▾" }));
  fireEvent.click(screen.getByRole("button", { name: "↻ 터치해 보기" }));
  expect(await screen.findByRole("button", { name: "한국어로 간결하게 선택됨" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "summarize 추가" }));
  expect(await screen.findByRole("button", { name: "summarize 추가됨" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "추천 배정" }));
  expect(screen.getByRole("button", { name: "추천 배정 미리보기" })).toBeTruthy();
});

test("페어링: 패드가 연결돼 있고, 등록된 큐브가 있으면 그 수로 시작할 수 있다", async () => {
  renderAt("/");
  expect(await screen.findByText("패드 연결됨")).toBeTruthy();
  fireEvent.click(await screen.findByRole("button", { name: /^큐브 \d개로 시작하기$/ }));
  expect(await screen.findByRole("heading", { level: 1, name: "장치 상태" })).toBeTruthy();
});
