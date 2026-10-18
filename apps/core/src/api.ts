import {
  type BattLevel,
  type Cube,
  type CubeSpaceApi,
  type PadCube,
  type Slot,
  type Snapshot,
  type WindowCommand,
} from "@cubespace/protocol";
import type { Store } from "./store";

// 화면 API의 core 쪽 구현. 규칙은 client 가짜 API(renderer/dev/fakeApi.ts)와 같다.
// 창 영역(layout)은 store가 큐브 자리로 다시 계산하므로 여기서는 고치지 않는다.

// 패드 · 창 프로그램에 시킬 일(연결이 없으면 아무 일도 하지 않는다)
export type Side = {
  padCubes(): PadCube[]; // 패드가 아는 큐브(등록 여부와 상관없이)
  tryPair(): void; // 장치 추가 중이면 확인점 위 미등록 큐브 하나를 등록한다(padLink)
  command(hwnd: string, cmd: WindowCommand): void;
  launch(app: string, slot: Slot): void; // 열린 창은 그 큐브에 묶인다
};

export const battLevel = (pct: number | null): BattLevel =>
  pct === null || pct > 30 ? "ok" : pct > 10 ? "low30" : "low10";

export function createApi(store: Store, side: Side): CubeSpaceApi {
  function change(slot: Slot, fn: (s: Snapshot, c: Cube) => void) {
    if (!store.get().cubes.some((x) => x.slot === slot)) return Promise.reject(new Error(`슬롯 ${slot}에 큐브 없음`));
    store.change((s) =>
      fn(
        s,
        s.cubes.find((x) => x.slot === slot)!,
      ),
    );
    return Promise.resolve();
  }
  const done = (fn: () => void) => {
    fn();
    return Promise.resolve();
  };

  return {
    getSnapshot: () => Promise.resolve(store.get()),
    onSnapshot: (listener) => store.subscribe((s) => listener(s)),
    setMode: (slot, mode) => change(slot, (_, c) => (c.mode = mode)),
    assignWindow: (slot, id) =>
      change(slot, (s, c) => {
        const w = s.windows.find((x) => x.id === id);
        if (!w || c.window === id) return;
        const other = w.owner ? s.cubes.find((x) => x.name === w.owner) : undefined;
        const cur = s.windows.find((x) => x.id === c.window);
        // 맞바꿈: 다른 큐브의 창이면 그 큐브가 지금 창을 받는다. 아니면 지금 창은 담당 없는 창이 된다
        if (other) other.window = cur?.id ?? null;
        if (cur) cur.owner = other?.name ?? null;
        w.owner = c.name;
        w.status = "linked";
        c.window = w.id;
        if (c.state === "idle" && c.link === "up") c.state = "run";
      }),
    assignAi: (slot, id) =>
      change(slot, (s, c) => {
        const other = id && s.cubes.find((x) => x !== c && x.ai === id);
        if (other) other.ai = c.ai;
        c.ai = id;
      }),
    setAiChoices: (slot, ids) => change(slot, (_, c) => (c.aiChoices = [...ids])),
    openApp(slot, app) {
      if (!store.get().cubes.some((x) => x.slot === slot)) return Promise.reject(new Error(`슬롯 ${slot}에 큐브 없음`));
      side.launch(app, slot);
      return Promise.resolve();
    },
    releaseCube: (slot) =>
      change(slot, (s, c) => {
        const w = s.windows.find((x) => x.id === c.window);
        if (w) {
          Object.assign(w, { owner: null, status: "minimized" });
          side.command(w.id, "min");
        }
        c.window = null;
        c.state = "idle";
      }),
    windowCommand(id, cmd) {
      if (!store.get().windows.some((x) => x.id === id)) return Promise.reject(new Error(`창 ${id} 없음`));
      side.command(id, cmd);
      // 닫기는 창 프로그램이 windowClosed로 알려 준다
      return done(() =>
        store.change((s) => {
          const w = s.windows.find((x) => x.id === id)!;
          if (cmd === "min") w.status = w.status === "minimized" ? "linked" : "minimized";
          if (cmd === "top") w.top = !w.top;
        }),
      );
    },
    setMonitor: (no) => done(() => store.change((s) => (s.monitor.no = no))),
    setCubeSettings: (slot, patch) =>
      done(() =>
        store.change((s) => {
          const c = s.settings.cubes.find((x) => x.slot === slot);
          if (c) Object.assign(c, patch);
          else s.settings.cubes.push({ slot, button: "toggle", fix: null, ...patch });
        }),
      ),
    setRules: (patch) => done(() => store.change((s) => Object.assign(s.settings.rules, patch))),
    // 장치 추가: 켜진 미등록 큐브를 빈 슬롯 수까지 센다. 0이면 시작하지 않는다.
    // 등록은 padLink가 확인점에 올린 순서대로 한다. 이미 올려 둔 큐브가 있으면 바로 등록된다
    startPairing() {
      const s0 = store.get();
      const n = side.padCubes().filter((x) => x.link === "up" && !s0.cubes.some((c) => c.mac4 === x.id)).length;
      const total = Math.min(n, 6 - s0.cubes.length);
      store.change((s) => (s.pairing = total ? { total, done: [] } : null));
      side.tryPair();
      return Promise.resolve(total);
    },
    stopPairing: () => done(() => store.change((s) => (s.pairing = null))),
    unregisterCube: (slot) =>
      change(slot, (s, c) => {
        for (const w of s.windows) if (w.owner === c.name) w.owner = null;
        s.cubes = s.cubes.filter((x) => x !== c);
      }),
  };
}
