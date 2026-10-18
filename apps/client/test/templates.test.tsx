import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Card } from "../src/renderer/components/Card";
import { Chip } from "../src/renderer/components/Chip";
import { ChipAdd } from "../src/renderer/components/ChipAdd";
import { Dialog } from "../src/renderer/components/Dialog";
import { Stepper } from "../src/renderer/components/Stepper";
import { Switch } from "../src/renderer/components/Switch";
import { Tabs } from "../src/renderer/components/Tabs";
import { APP_ICONS, ST_ICONS, appPixels, glyphPixels } from "../src/renderer/cube/appIcons";
import { ChainPill } from "../src/renderer/cube/ChainPill";
import { CubeDetail } from "../src/renderer/cube/CubeDetail";
import { CubeList, type CubeInfo } from "../src/renderer/cube/CubeList";
import { LedMatrix } from "../src/renderer/cube/LedMatrix";
import { Pad } from "../src/renderer/cube/Pad";
import { SpareTray } from "../src/renderer/cube/SpareTray";
import { ICON_ROWS, outlineLeds, toPixels } from "../src/renderer/cube/led";
import { useTheme } from "../src/renderer/hooks/useTheme";
import { useToast } from "../src/renderer/hooks/useToast";
import { Rail } from "../src/renderer/layout/Rail";

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.useRealTimers();
});

test("Rail: 고른 항목에 aria-current, 누르면 onSelect", () => {
  const onSelect = vi.fn();
  render(
    <Rail
      items={[
        { icon: "home", label: "홈" },
        { icon: "gear", label: "설정" },
      ]}
      current={0}
      onSelect={onSelect}
    />,
  );
  expect(screen.getByRole("button", { name: "홈" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("button", { name: "설정" }).getAttribute("aria-current")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "설정" }));
  expect(onSelect).toHaveBeenCalledWith(1);
});

test("Tabs: 고른 칸에 aria-pressed, 누르면 onChange", () => {
  const onChange = vi.fn();
  render(<Tabs options={["창", "AI"]} value={1} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "AI" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "창" }));
  expect(onChange).toHaveBeenCalledWith(0);
});

test("Card: 영역 제목과 meta", () => {
  render(<Card title="열린 창" meta="3" />);
  expect(screen.getByRole("heading", { name: "열린 창 3" })).toBeTruthy();
});

test("Dialog: open이면 showModal로 연다", () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.showModal = showModal;
  render(<Dialog open title="저장" onClose={() => {}} />);
  expect(showModal).toHaveBeenCalledOnce();
});

test("useTheme: 전환하면 data-theme과 저장값이 바뀐다", () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe("light"); // 저장값 없음 + 시스템 라이트
  act(() => result.current.toggle());
  expect(result.current.theme).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("cs-theme")).toBe("dark");
});

test("useToast: 띄운 뒤 시간이 지나면 사라진다", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useToast(1000));
  act(() => result.current.show("저장했어요"));
  expect(result.current).toMatchObject({ text: "저장했어요", visible: true });
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.visible).toBe(false);
});

test("Stepper: 범위 안에서 움직이고 끝에서 버튼이 꺼진다", () => {
  const onChange = vi.fn();
  render(<Stepper label="되돌리기" value={3} min={0.5} max={3} step={0.5} unit="초" onChange={onChange} />);
  expect((screen.getByRole("button", { name: "되돌리기 늘리기" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "되돌리기 줄이기" }));
  expect(onChange).toHaveBeenCalledWith(2.5);
});

test("Switch: aria-checked, 누르면 반대 값", () => {
  const onChange = vi.fn();
  render(<Switch label="효과음" checked={false} onChange={onChange} />);
  const sw = screen.getByRole("switch", { name: "효과음" });
  expect(sw.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(sw);
  expect(onChange).toHaveBeenCalledWith(true);
});

test("Chip: 누르면 onRemove", () => {
  const onRemove = vi.fn();
  render(<Chip label="vscode" onRemove={onRemove} />);
  fireEvent.click(screen.getByRole("button", { name: "vscode 빼기" }));
  expect(onRemove).toHaveBeenCalled();
});

test("led: 도안 → 64칸, 테두리 LED 수", () => {
  const px = toPixels(ICON_ROWS.frame);
  expect(px).toHaveLength(64);
  expect(px.filter(Boolean)).toHaveLength(28);
  // 왼쪽 반(12 × 16)의 테두리 = 12 × 2 + 14 × 2
  expect(outlineLeds([0, 0, 0.5, 1], "red", 1)).toHaveLength(52);
});

test("LedMatrix: 켜진 칸만 .on", () => {
  const { container } = render(<LedMatrix pixels={toPixels(ICON_ROWS.frame)} />);
  expect(container.querySelectorAll("i")).toHaveLength(64);
  expect(container.querySelectorAll("i.on")).toHaveLength(28);
});

test("ChainPill: 연결 수, 슬롯 누르면 onSlot", () => {
  const onSlot = vi.fn();
  render(<ChainPill padUp slots={[{ name: "A", kind: "ok" }, { name: "B", kind: "hold" }, null]} onSlot={onSlot} />);
  expect(screen.getByRole("group").getAttribute("aria-label")).toContain("1/3");
  fireEvent.click(screen.getByRole("button", { name: "슬롯 1 큐브 B" }));
  expect(onSlot).toHaveBeenCalledWith(1);
});

test("appIcons: 모든 도안이 64칸, 색 번호가 팔레트 안", () => {
  for (const g of [...Object.values(APP_ICONS), ...Object.values(ST_ICONS)]) {
    const px = glyphPixels(g);
    expect(px).toHaveLength(64);
    expect(px.filter(Boolean).length).toBe(g.rows.replace(/[ .]/g, "").length);
  }
  expect(appPixels("없는 앱")).toEqual(glyphPixels(ST_ICONS["창 켜짐"]));
});

const CUBE = (id: string, state: CubeInfo["state"], win?: string): CubeInfo => ({ id, name: id, pixels: appPixels("메모장"), color: "red", state, pct: 50, win });

test("CubeList: 패드 위 칸 + 빈 칸, 패드 밖 칩, 누르면 onSelect", () => {
  const onSelect = vi.fn();
  render(<CubeList placed={[CUBE("A", "bound", "Edge")]} tray={[CUBE("E", "out")]} slots={4} onSelect={onSelect} />);
  expect(screen.getAllByText("빈 칸")).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "E" }));
  expect(onSelect).toHaveBeenCalledWith("E");
});

test("CubeDetail: 지금 상태 줄에 불, 큐브 버튼을 바꾸면 onButton", () => {
  const onButton = vi.fn();
  const { container } = render(<CubeDetail cube={CUBE("A", "off", "Edge")} programs={["Edge"]} onFix={() => {}} button="toggle" onButton={onButton} />);
  expect(container.querySelector(".ptab .on b")?.textContent).toBe("배치된 큐브");
  fireEvent.click(screen.getByRole("button", { name: "다시 고르기" }));
  expect(onButton).toHaveBeenCalledWith("pick");
});

test("인자에 따라 바뀜: 패드 밖 큐브 없음 · 패드 밖 큐브 · 고정 프로그램 · 배터리 · LED", () => {
  render(<CubeList placed={[]} tray={[]} slots={2} />);
  expect(screen.getAllByText("빈 칸")).toHaveLength(2);
  expect(screen.queryByText("패드 밖")).toBeNull();
  cleanup();
  const { container } = render(<CubeDetail cube={{ ...CUBE("E", "empty"), pct: 8 }} fix="Edge" programs={["Edge"]} onFix={() => {}} button="toggle" onButton={() => {}} />);
  expect(container.querySelector(".ptab .on")?.textContent).toContain("Edge 바로 열기");
  expect(container.textContent).toContain("배터리 8%");
  cleanup();
  const { container: out } = render(<CubeDetail cube={CUBE("F", "out", "Edge")} programs={[]} onFix={() => {}} button="pick" onButton={() => {}} />);
  expect(out.querySelector(".ccw")).toBeNull();
  cleanup();
  const { container: tray } = render(<SpareTray cells={[{ name: "C", pixels: appPixels("메모장"), pct: 8, label: "C" }, null, null]} />);
  expect(tray.querySelectorAll(".spare-cell")).toHaveLength(3);
  expect(tray.querySelector(".cell-batt.low10")).not.toBeNull();
  cleanup();
  const leds = outlineLeds([0, 0, 0.5, 1], "red", 1);
  const { container: pad } = render(<Pad leds={leds} />);
  expect(pad.querySelectorAll(".pad-lit .led")).toHaveLength(leds.length);
});

test("ChipAdd: 누르면 목록, 고르면 onAdd 후 닫힘, Esc로 닫힘", () => {
  const onAdd = vi.fn();
  render(<ChipAdd label="프로그램" options={["Edge", "Slack"]} onAdd={onAdd} />);
  fireEvent.click(screen.getByRole("button", { name: "+ 프로그램" }));
  fireEvent.click(screen.getByRole("option", { name: "Slack" }));
  expect(onAdd).toHaveBeenCalledWith("Slack");
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "+ 프로그램" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
});
