import type { Server } from "node:net";
import { listen, type Conn } from "@cubespace/protocol/pipe";
import type { PadCube, SimControl, Xy } from "@cubespace/protocol";

// 가상 패드. pad pipe로는 core에 pad-gateway와 같은 메시지를 보내고,
// sim pipe(또는 stdin)로 받은 조작으로 가상 큐브를 움직인다.

export const SIM_CUBES: PadCube[] = [
  { id: "A2:F0", xy: null, link: "up", battPct: 82 },
  { id: "A2:F1", xy: null, link: "up", battPct: 64 },
  { id: "A2:F2", xy: null, link: "up", battPct: 27 },
  { id: "A2:F3", xy: null, link: "up", battPct: 95 },
  { id: "A2:F4", xy: null, link: "up", battPct: 51 },
  { id: "A2:F5", xy: null, link: "up", battPct: 73 },
];

export async function startSim(
  padPath: string,
  simPath: string,
  log: (m: string) => void = () => {},
) {
  const cubes = new Map(SIM_CUBES.map((c) => [c.id, { ...c }]));
  const cores = new Set<Conn>();
  const toCore = (type: string, payload: unknown) =>
    cores.forEach((c) => c.send(type, payload));
  const sync = () => toCore("sync", { cubes: [...cubes.values()] });

  function get(id: string) {
    const c = cubes.get(id);
    if (!c) throw new Error(`없는 큐브: ${id}`);
    return c;
  }

  // 조작 하나. 틀리면 던진다
  const ops = {
    cube(id: string, xy: Xy | null) {
      get(id).xy = xy;
      toCore("cube", { id, xy });
    },
    button(id: string, press: "short" | "long") {
      get(id);
      toCore("button", { id, press });
    },
    // 끊김은 따로 보내는 메시지가 없어 전체 상태(sync)로 알린다
    link(id: string, link: "up" | "down") {
      get(id).link = link;
      sync();
    },
    // HW 통합 후 제거: 패드 끊김 흉내. core supervisor가 pad-sim을 다시 띄우므로 약 1초 뒤 돌아온다
    dropPad() {
      cores.forEach((c) => c.close());
    },
    state: () => [...cubes.values()],
  };

  const pad: Server = await listen(padPath, (c) => {
    cores.add(c);
    c.onClose(() => cores.delete(c));
    // LED 등 core의 요청은 받았다고만 답한다
    c.onMessage((e) => {
      log(`core → ${e.type} ${JSON.stringify(e.payload)}`);
      if (e.id) c.reply(e.id, { ok: true, value: null });
    });
    c.send("hello", { role: "pad", padId: "sim", fw: "sim" });
    c.send("sync", { cubes: ops.state() });
    log("core 연결됨");
  });

  const sim: Server = await listen(simPath, (c) =>
    c.onMessage((raw) => {
      const e = raw as SimControl;
      try {
        let value: unknown = null;
        if (e.type === "simCube") ops.cube(e.payload.id, e.payload.xy);
        else if (e.type === "simButton")
          ops.button(e.payload.id, e.payload.press);
        else if (e.type === "simLink") ops.link(e.payload.id, e.payload.link);
        else if (e.type === "simState") value = ops.state();
        else if (e.type === "simPad") ops.dropPad();
        else return;
        c.reply(e.id, { ok: true, value });
      } catch (err) {
        c.reply(e.id, { ok: false, error: (err as Error).message });
      }
    }),
  );

  return {
    ops,
    close() {
      cores.forEach((c) => c.close());
      pad.close();
      sim.close();
    },
  };
}

export type Ops = Awaited<ReturnType<typeof startSim>>["ops"];

// stdin 한 줄 → 조작. 예: "move A2:F0 40 60" · "lift A2:F0" · "press A2:F0 long" · "link A2:F0 down" · "drop" · "list"
export function runLine(ops: Ops, line: string): string {
  const [cmd, id = "", a, b] = line.trim().split(/\s+/);
  switch (cmd) {
    case "move":
      ops.cube(id, [Number(a), Number(b)]);
      return "ok";
    case "lift":
      ops.cube(id, null);
      return "ok";
    case "press":
      ops.button(id, a === "long" ? "long" : "short");
      return "ok";
    case "link":
      ops.link(id, a === "down" ? "down" : "up");
      return "ok";
    case "drop":
      ops.dropPad();
      return "ok";
    case "list":
      return ops
        .state()
        .map(
          (c) =>
            `${c.id} ${c.link} ${c.xy ? c.xy.join(",") : "패드 밖"} ${c.battPct}%`,
        )
        .join("\n");
    default:
      return "명령: move <id> <x> <y> · lift <id> · press <id> [long] · link <id> up|down · drop · list";
  }
}
