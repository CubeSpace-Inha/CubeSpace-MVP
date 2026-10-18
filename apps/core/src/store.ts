import { splitRects, type Placement, type Snapshot } from "@cubespace/protocol";

// 상태 한 장을 쥐고, 바뀌면 구독자에게 알린다. 상태를 쓰는 곳은 core뿐이다.

export function emptySnapshot(): Snapshot {
  return {
    pad: { session: "lost", fw: "", badSensors: [] },
    cubes: [],
    windows: [],
    layout: [],
    profiles: [],
    settings: {
      cubes: [],
      rules: {
        split2: "pos",
        split3: "big",
        split4: "grid",
        lift: "min",
        backSec: 1,
        stayMm: 10,
        topSkip: true,
        skipApps: [],
        order: "recent",
      },
      favs: [],
    },
    notices: [{ code: "padLost" }],
    monitor: { no: 1, count: 0 },
    pairing: null,
  };
}

// 패드 위에 있고 창이 켜져 있는 큐브의 창을 규칙대로 나눈다(4개까지)
export function computeLayout(s: Snapshot): Placement[] {
  const placed = s.cubes
    .filter((c) => c.link === "up" && c.xy && c.window)
    .filter((c) => s.windows.some((w) => w.id === c.window && w.status === "linked"))
    .slice(0, 4);
  const rects = splitRects(placed as { xy: [number, number] }[], s.settings.rules);
  return placed.map((c, i) => {
    const [x, y, w, h] = rects[i]!;
    return { window: c.window!, rect: [x, y, x + w, y + h] };
  });
}

export type Store = ReturnType<typeof createStore>;

export function createStore(initial: Snapshot = emptySnapshot()) {
  let current = { ...initial, layout: computeLayout(initial) };
  const listeners = new Set<(s: Snapshot, prev: Snapshot) => void>();

  function set(next: Snapshot) {
    const prev = current;
    current = { ...next, layout: computeLayout(next) };
    for (const l of listeners) l(current, prev);
  }

  return {
    get: () => current,
    set,
    // 복사본을 고쳐 set한다
    change(fn: (s: Snapshot) => void) {
      const s = structuredClone(current);
      fn(s);
      set(s);
    },
    subscribe(fn: (s: Snapshot, prev: Snapshot) => void) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
  };
}
