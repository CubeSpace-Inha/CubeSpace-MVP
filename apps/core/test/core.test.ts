import { describe, expect, it } from "vitest";
import { PAD_CHECK, type PadCube } from "@cubespace/protocol";
import { createApi, type Side } from "../src/api";
import { createPadLink } from "../src/padLink";
import { computeLayout, createStore } from "../src/store";
import { createWinLink } from "../src/winLink";
import { fakeConn } from "./fakeConn";

const flush = () => new Promise((r) => setTimeout(r, 0));

// store · api · 두 링크를 index.ts처럼 잇는다
function setup() {
  const store = createStore();
  const calls: string[] = [];
  const side: Side = {
    padCubes: () => pad.cubes(),
    tryPair: () => pad.tryPair(),
    command: (hwnd, cmd) => (calls.push(`${cmd} ${hwnd}`), win.command(hwnd, cmd)),
    launch: (app, slot) => win.launch(app, slot),
  };
  const api = createApi(store, side);
  const pad = createPadLink(store, api);
  const win = createWinLink(store, api);
  return { store, api, pad, win, calls };
}

const cubes: PadCube[] = [
  { id: "A2:F0", xy: [40, 60], link: "up", battPct: 82 },
  { id: "A2:F1", xy: [150, 60], link: "up", battPct: 25 },
];

type Pad = ReturnType<typeof fakeConn>;
type Api = ReturnType<typeof setup>["api"];

// 장치 추가로 등록: 확인점에 올렸다가 sync 때 자리로 되돌린다
async function register(api: Api, p: Pad, ids: string[]) {
  await api.startPairing();
  for (const id of ids) {
    p.emit("cube", { id, xy: PAD_CHECK.xy });
    p.emit("cube", { id, xy: cubes.find((c) => c.id === id)!.xy });
  }
  await api.stopPairing();
}

describe("core", () => {
  it("처음에는 큐브가 없고 패드가 끊겨 있다", () => {
    const s = createStore().get();
    expect(s.cubes).toEqual([]);
    expect(s.pad.session).toBe("lost");
    expect(s.notices).toEqual([{ code: "padLost" }]);
  });

  it("패드가 붙으면 알림이 사라지고, 확인점에 올린 순서로 등록된다", async () => {
    const { store, api, pad } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("hello", { role: "pad", padId: "p1", fw: "a1b2" });
    p.emit("sync", { cubes });
    expect(store.get().pad).toMatchObject({ session: "up", fw: "a1b2" });
    expect(store.get().notices).toEqual([]);

    await register(api, p, ["A2:F0", "A2:F1"]);
    expect(store.get().cubes.map((c) => [c.name, c.mac4, c.battLevel])).toEqual([
      ["A", "A2:F0", "ok"],
      ["B", "A2:F1", "low30"],
    ]);

    // 큐브를 들면 패드 밖. 패드가 끊기면 lost: 판정을 멈추고 큐브는 그대로 둔다
    p.emit("cube", { id: "A2:F0", xy: null });
    expect(store.get().cubes[0]!.xy).toBeNull();
    p.conn.close();
    expect(store.get().pad.session).toBe("lost");
    expect(store.get().notices).toEqual([{ code: "padLost" }]);
    expect(store.get().cubes[1]).toMatchObject({ link: "up", xy: [150, 60] });
  });

  it("창 목록을 받고, 큐브에 묶으면 배치를 보낸다", async () => {
    const { store, api, pad, win } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes });
    await register(api, p, ["A2:F0", "A2:F1"]);

    const w = fakeConn((type) =>
      type === "listMonitors"
        ? [{ no: 1, primary: true, work: [0, 0, 1920, 1040] }]
        : type === "listWindows"
          ? [
              { hwnd: "11", exe: "code.exe", title: "a", minimized: false },
              { hwnd: "22", exe: "notepad.exe", title: "b", minimized: false },
            ]
          : [],
    );
    await win.attach(w.conn);
    expect(store.get().windows.map((x) => x.app)).toEqual(["VS Code", "메모장"]);
    expect(store.get().monitor).toEqual({ no: 1, count: 1 });

    await api.assignWindow(0, "11");
    await api.assignWindow(1, "22");
    // 두 큐브(x 40 · 150) → 왼쪽 · 오른쪽
    expect(store.get().layout.map((p) => p.window)).toEqual(["11", "22"]);
    const last = w.sent.filter((x) => x.type === "applyLayout").at(-1)!.payload as { items: { hwnd: string }[] };
    expect(last.items.map((i) => i.hwnd)).toEqual(["11", "22"]);

    // 맞바꿈
    await api.assignWindow(0, "22");
    expect(store.get().cubes.map((c) => c.window)).toEqual(["22", "11"]);

    // 창이 닫히면 큐브가 빈다
    w.emit("windowClosed", { hwnd: "11" });
    expect(store.get().cubes[1]!.window).toBeNull();
    expect(store.get().layout.map((p) => p.window)).toEqual(["22"]);
  });

  it("프로그램을 열면 열린 창이 그 큐브에 묶인다", async () => {
    const { store, api, pad, win } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes });
    await register(api, p, ["A2:F0"]);
    const w = fakeConn((type) => (type === "listMonitors" || type === "listWindows" ? [] : null));
    await win.attach(w.conn);

    await api.openApp(0, "메모장");
    expect(w.sent.at(-1)).toEqual({ type: "launch", payload: { exe: "notepad.exe", args: [] } });
    w.emit("windowOpened", { hwnd: "33", exe: "notepad.exe", title: "", minimized: false });
    await flush();
    expect(store.get().cubes[0]!.window).toBe("33");
    expect(store.get().windows[0]!.owner).toBe("A");
  });

  it("묶음을 풀면 창을 최소화시키고, 큐브 버튼은 창을 켜고 끈다", async () => {
    const { store, api, pad, calls } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes });
    await register(api, p, ["A2:F0"]);
    store.change((s) => s.windows.push({ id: "11", app: "메모장", title: "", owner: null, status: "linked" }));
    await api.assignWindow(0, "11");

    p.emit("button", { id: "A2:F0", press: "short" });
    await flush();
    expect(calls).toEqual(["min 11"]);
    expect(store.get().windows[0]!.status).toBe("minimized");

    await api.releaseCube(0);
    expect(calls).toEqual(["min 11", "min 11"]);
    expect(store.get().cubes[0]!.window).toBeNull();
  });

  it("배치: 패드 밖 · 최소화된 창은 빠진다", () => {
    const s = createStore().get();
    s.cubes = [
      { slot: 0, name: "A", mac4: "1", link: "up", battPct: 1, battLevel: "ok", state: "run", mode: "window", xy: [40, 60], window: "a", icon: "", ai: null, aiChoices: [] },
      { slot: 1, name: "B", mac4: "2", link: "up", battPct: 1, battLevel: "ok", state: "run", mode: "window", xy: null, window: "b", icon: "", ai: null, aiChoices: [] },
    ];
    s.windows = [
      { id: "a", app: "", title: "", owner: "A", status: "linked" },
      { id: "b", app: "", title: "", owner: "B", status: "linked" },
    ];
    expect(computeLayout(s)).toEqual([{ window: "a", rect: [0, 0, 1, 1] }]);
  });

  it("startPairing: 켜진 미등록 큐브를 빈 슬롯 수까지 센다. 0이면 시작하지 않는다", async () => {
    const { store, api, pad } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes: [...cubes, { id: "A2:F9", xy: null, link: "down", battPct: null }] });
    await expect(api.startPairing()).resolves.toBe(2); // 꺼진 A2:F9는 세지 않는다
    expect(store.get().pairing).toEqual({ total: 2, done: [] });

    // 빈 슬롯이 하나뿐이면 1
    store.change((s) => {
      for (const slot of [0, 1, 2, 3, 4] as const)
        s.cubes.push({ slot, name: "ABCDE"[slot]!, mac4: `x${slot}`, link: "down", battPct: null, battLevel: "ok", state: "idle", mode: "window", xy: null, window: null, icon: "heart", ai: null, aiChoices: [] });
    });
    await expect(api.startPairing()).resolves.toBe(1);

    p.emit("sync", { cubes: [] });
    await expect(api.startPairing()).resolves.toBe(0);
    expect(store.get().pairing).toBeNull();
  });

  it("확인점 안에 올린 켜진 큐브만 등록하고, 이미 올려 둔 큐브는 시작하자마자 등록한다", async () => {
    const { store, api, pad } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    const [cx, cy] = PAD_CHECK.xy;
    p.emit("sync", { cubes: [{ ...cubes[0]!, xy: [cx, cy] }, cubes[1]!, { id: "A2:F9", xy: [cx, cy], link: "down", battPct: null }] });
    await api.startPairing();
    expect(store.get().cubes.map((c) => [c.name, c.mac4])).toEqual([["A", "A2:F0"]]);
    expect(store.get().pairing).toEqual({ total: 2, done: [0] });

    p.emit("cube", { id: "A2:F1", xy: [cx + PAD_CHECK.r + 5, cy] }); // 확인점 밖
    expect(store.get().cubes).toHaveLength(1);
    p.emit("cube", { id: "A2:F1", xy: [cx + PAD_CHECK.r - 5, cy] });
    expect(store.get().cubes.map((c) => [c.name, c.mac4, c.battLevel])).toEqual([
      ["A", "A2:F0", "ok"],
      ["B", "A2:F1", "low30"],
    ]);
    expect(store.get().pairing).toEqual({ total: 2, done: [0, 1] });
  });

  it("등록된 큐브를 다시 올려도 무시하고, 다 채운 뒤에는 더 등록하지 않는다", async () => {
    const { store, api, pad } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes: [cubes[0]!] });
    await api.startPairing();
    p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
    p.emit("cube", { id: "A2:F0", xy: null });
    p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
    expect(store.get().cubes).toHaveLength(1);

    p.emit("cube", { id: "A2:F7", xy: PAD_CHECK.xy }); // 새로 켜진 큐브
    expect(store.get().cubes).toHaveLength(1);
    expect(store.get().pairing).toEqual({ total: 1, done: [0] });
  });

  it("stopPairing · 패드 끊김이면 pairing이 없어지고 등록한 큐브는 남는다", async () => {
    const { store, api, pad } = setup();
    const p = fakeConn();
    pad.attach(p.conn);
    p.emit("sync", { cubes });
    await api.startPairing();
    p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
    await api.stopPairing();
    expect(store.get().pairing).toBeNull();
    expect(store.get().cubes).toHaveLength(1);

    await api.startPairing();
    p.conn.close();
    expect(store.get().pairing).toBeNull();
  });
});
