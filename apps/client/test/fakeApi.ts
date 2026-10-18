import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Cube, Slot, Snapshot } from "@cubespace/protocol";
import { fitMode } from "@cubespace/protocol";
import { nowCubes } from "../src/renderer/model/modes";
import { OK } from "../src/renderer/dev/fixtures";

// 장치 없이 도는 가짜 API(테스트 대역). push로 새 상태를 보내면 구독한 화면이 바뀐다.
// 조작은 시안 pad-home.html의 swapWindow · swapAI 규칙으로 견본 상태만 바꾼다.
export function createFakeApi(initial: Snapshot = OK) {
  let current = initial;
  const listeners = new Set<(s: Snapshot) => void>();

  function push(next: Snapshot) {
    current = next;
    for (const l of listeners) l(next);
  }

  // 복사본을 고쳐 push한다
  function change(slot: Slot, fn: (s: Snapshot, c: Cube) => void) {
    const s = structuredClone(current);
    const c = s.cubes.find((x) => x.slot === slot);
    if (!c) return Promise.reject(new Error(`슬롯 ${slot}에 큐브 없음`));
    fn(s, c);
    push(s);
    return Promise.resolve();
  }

  const api: CubeSpaceApi = {
    getSnapshot: () => Promise.resolve(current),
    onSnapshot(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setMode: (slot, mode) => change(slot, (_, c) => (c.mode = mode)),
    assignWindow: (slot, id) =>
      change(slot, (s, c) => {
        const w = s.windows.find((x) => x.id === id);
        if (!w || c.window === id) return;
        const cur = s.windows.find((x) => x.id === c.window);
        const other = w.owner
          ? s.cubes.find((x) => x.name === w.owner)
          : undefined;
        const curRegion = s.layout.find((p) => p.window === cur?.id);
        const newRegion = s.layout.find((p) => p.window === w.id);
        if (other) {
          // 맞바꿈: 두 큐브의 창과 영역을 바꾼다
          other.window = cur?.id ?? null;
          if (cur) cur.owner = other.name;
          if (curRegion && newRegion)
            [curRegion.window, newRegion.window] = [
              newRegion.window,
              curRegion.window,
            ];
        } else {
          // 담당 없는 창: 지금 창은 담당 없는 창이 되고, 그 자리를 새 창이 받는다
          if (cur) cur.owner = null;
          if (curRegion) curRegion.window = w.id;
        }
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
    openApp: (slot, app) =>
      change(slot, (s, c) => {
        const id = `w${s.windows.length + 1}-${app}`;
        const cur = s.windows.find((x) => x.id === c.window);
        if (cur) cur.owner = null;
        const region = s.layout.find((p) => p.window === cur?.id);
        if (region) region.window = id;
        s.windows.push({ id, app, title: "", owner: c.name, status: "linked" });
        c.window = id;
      }),
    releaseCube: (slot) =>
      change(slot, (s, c) => {
        const w = s.windows.find((x) => x.id === c.window);
        if (w) Object.assign(w, { owner: null, status: "minimized" });
        s.layout = s.layout.filter((p) => p.window !== c.window);
        c.window = null;
        c.state = "idle";
      }),
    windowCommand(id, cmd) {
      // 절반 배치는 실제 창을 옮기는 일이라 가짜에서는 상태가 바뀌지 않는다
      const s = structuredClone(current);
      const w = s.windows.find((x) => x.id === id);
      if (!w) return Promise.reject(new Error(`창 ${id} 없음`));
      if (cmd === "min")
        w.status = w.status === "minimized" ? "linked" : "minimized";
      if (cmd === "top") w.top = !w.top;
      if (cmd === "close") {
        s.windows = s.windows.filter((x) => x !== w);
        s.layout = s.layout.filter((p) => p.window !== id);
        for (const c of s.cubes) if (c.window === id) c.window = null;
      }
      push(s);
      return Promise.resolve();
    },
    setMonitor(no) {
      push({ ...current, monitor: { ...current.monitor, no } });
      return Promise.resolve();
    },
    setCubeSettings(slot, patch) {
      const s = structuredClone(current);
      const c = s.settings.cubes.find((x) => x.slot === slot);
      if (c) Object.assign(c, patch);
      else
        s.settings.cubes.push({ slot, button: "toggle", fix: null, ...patch });
      push(s);
      return Promise.resolve();
    },
    setRules(patch) {
      push({
        ...current,
        settings: {
          ...current.settings,
          rules: { ...current.settings.rules, ...patch },
        },
      });
      return Promise.resolve();
    },
    saveMode({ id, name, cubes, now }) {
      const s = structuredClone(current);
      let m = s.modes.find((x) => x.id === id);
      if (m) Object.assign(m, { name, cubes });
      else s.modes.push((m = { id: `m${Date.now()}`, name, cubes }));
      if (now) s.activeMode = m.id;
      // 실행 중인 모드를 고쳐 지금 패드와 모양이 달라지면 실행 중이 아니다
      else if (
        s.activeMode === m.id &&
        !fitMode(nowCubes(s), cubes, s.settings.rules.gapMm)
      )
        s.activeMode = null;
      push(s);
      return Promise.resolve();
    },
    deleteMode(id) {
      const s = structuredClone(current);
      s.modes = s.modes.filter((x) => x.id !== id);
      if (s.activeMode === id) s.activeMode = null;
      push(s);
      return Promise.resolve();
    },
    // 장치 추가: 패드가 없으니 빈 슬롯 수만큼 센다. 등록(확인점에 올리기)은 테스트가 push로 흉내 낸다
    startPairing() {
      const total = 6 - current.cubes.length;
      push({ ...current, pairing: total ? { total, done: [] } : null });
      return Promise.resolve(total);
    },
    stopPairing() {
      push({ ...current, pairing: null });
      return Promise.resolve();
    },
    unregisterCube: (slot) =>
      change(slot, (s, c) => {
        for (const w of s.windows) if (w.owner === c.name) w.owner = null;
        s.cubes = s.cubes.filter((x) => x !== c);
      }),
  };

  return { api, push };
}
