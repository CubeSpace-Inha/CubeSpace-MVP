import type { Conn } from "@cubespace/protocol/pipe";
import { PAD_CHECK, type CubeSpaceApi, type PadCube, type PadToCore } from "@cubespace/protocol";
import { battLevel } from "./api";
import type { Store } from "./store";

// 패드 프로그램(pad-gateway · pad-sim) 연결. 패드가 알려 준 큐브를 등록된 큐브(mac4)에 반영한다.
// 미정: 큐브 상태 기계(들림 대기 · 끊김 보류 …)와 LED 명령은 아직 없다. 자리 · 연결 · 배터리만 옮긴다.
export function createPadLink(store: Store, api: CubeSpaceApi) {
  const known = new Map<string, PadCube>();

  // 등록된 큐브에 패드 상태를 옮긴다. 패드가 모르는 큐브는 끊김
  function reflect() {
    store.change((s) => {
      for (const c of s.cubes) {
        const p = known.get(c.mac4);
        c.link = p?.link ?? "down";
        if (c.link === "down") c.downReason = "link";
        else delete c.downReason;
        c.xy = p?.xy ?? null;
        if (p) {
          c.battPct = p.battPct;
          c.battLevel = battLevel(p.battPct);
        }
      }
    });
  }

  function update(id: string, patch: Partial<PadCube>) {
    const p = known.get(id) ?? { id, xy: null, link: "up", battPct: null };
    known.set(id, { ...p, ...patch });
    reflect();
  }

  // 장치 추가 중이면 확인점 안의 켜진 미등록 큐브 하나를 가장 앞 빈 슬롯에 등록한다. 이름은 슬롯 알파벳(0 = A … 5 = F)
  function tryPair() {
    const s0 = store.get();
    const pr = s0.pairing;
    if (!pr || pr.done.length >= pr.total) return;
    const slot = ([0, 1, 2, 3, 4, 5] as const).find((i) => !s0.cubes.some((c) => c.slot === i));
    const [cx, cy] = PAD_CHECK.xy;
    const p = [...known.values()].find(
      (x) => x.link === "up" && x.xy && Math.hypot(x.xy[0] - cx, x.xy[1] - cy) <= PAD_CHECK.r && !s0.cubes.some((c) => c.mac4 === x.id),
    );
    if (slot === undefined || !p) return;
    store.change((s) => {
      s.cubes.push({
        slot,
        name: "ABCDEF"[slot]!,
        mac4: p.id,
        link: "up",
        battPct: p.battPct,
        battLevel: battLevel(p.battPct),
        state: "idle",
        mode: "window",
        xy: p.xy,
        window: null,
        icon: "heart",
        ai: null,
        aiChoices: [],
      });
      s.cubes.sort((a, b) => a.slot - b.slot);
      s.pairing!.done.push(slot);
    });
  }

  function attach(conn: Conn) {
    conn.onMessage((raw) => {
      const e = raw as PadToCore;
      switch (e.type) {
        case "hello":
          store.change((s) => {
            s.pad = { ...s.pad, session: "up", fw: e.payload.fw };
            s.notices = s.notices.filter((n) => n.code !== "padLost");
          });
          break;
        case "sync":
          known.clear();
          for (const p of e.payload.cubes) known.set(p.id, p);
          reflect();
          tryPair();
          break;
        case "cube":
          update(e.payload.id, { xy: e.payload.xy, link: "up" });
          tryPair();
          break;
        case "diag":
          update(e.payload.id, { battPct: e.payload.battPct });
          break;
        case "button": {
          // 짧게 = 창 켜고 끄기(큐브 설정 toggle). 고르기(pick)는 화면 쪽 동작이라 아직 없다
          const s = store.get();
          const c = s.cubes.find((x) => x.mac4 === e.payload.id);
          const button = s.settings.cubes.find((x) => x.slot === c?.slot)?.button ?? "toggle";
          if (c?.window && e.payload.press === "short" && button === "toggle")
            void api.windowCommand(c.window, "min").catch(() => {});
          break;
        }
      }
    });
    conn.onClose(() => {
      known.clear();
      store.change((s) => {
        s.pad.session = "lost";
        s.pairing = null; // 장치 추가는 멈춘다(등록한 큐브는 남는다)
        if (!s.notices.some((n) => n.code === "padLost")) s.notices.push({ code: "padLost" });
      });
    });
  }

  return { attach, cubes: () => [...known.values()], tryPair };
}
