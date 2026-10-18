import type { Slot } from "@cubespace/protocol";
import { battLevel } from "./api";
import type { Store } from "./store";

// 임시(MVP): 큐브 6개(A–F)가 이미 페어링됐다고 보고 시작한다. 실제 페어링이 붙으면 지운다.
// mac4는 pad-sim 가상 큐브 id(A2:F0 …)와 같아서, 패드가 붙으면 자리 · 연결 · 배터리가 옮겨진다.
export function seedPairedCubes(store: Store) {
  store.change((s) => {
    s.cubes = ([0, 1, 2, 3, 4, 5] as const satisfies readonly Slot[]).map((slot) => ({
      slot,
      name: "ABCDEF"[slot]!,
      mac4: `A2:F${slot}`,
      link: "down",
      downReason: "link",
      battPct: null,
      battLevel: battLevel(null),
      state: "idle",
      mode: "window",
      xy: null,
      window: null,
      icon: "heart",
      ai: null,
      aiChoices: [],
    }));
  });
}
