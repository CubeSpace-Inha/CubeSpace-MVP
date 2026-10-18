import { afterEach, expect, it } from "vitest";
import { connect, pipePath, type Conn } from "@cubespace/protocol/pipe";
import type { Envelope, PadCube } from "@cubespace/protocol";
import { runLine, startSim } from "../src/sim";

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach((x) => x.close()));

it("core에 hello · sync를 보내고, sim 조작을 cube · button · sync로 옮긴다", async () => {
  const tag = `sim${process.pid}`;
  const sim = await startSim(pipePath("pad", tag), pipePath("sim", tag));
  open.push(sim);

  const got: Envelope[] = [];
  const core: Conn = await connect(pipePath("pad", tag));
  open.push(core);
  core.onMessage((e) => got.push(e));
  const ctl: Conn = await connect(pipePath("sim", tag));
  open.push(ctl);

  await ctl.request("simCube", { id: "A2:F0", xy: [40, 60] });
  await ctl.request("simButton", { id: "A2:F0", press: "long" });
  await ctl.request("simLink", { id: "A2:F1", link: "down" });
  await expect(ctl.request("simCube", { id: "XX", xy: null })).rejects.toThrow("없는 큐브");
  const state = await ctl.request<PadCube[]>("simState", {});
  expect(state[0]!.xy).toEqual([40, 60]);
  expect(state[1]!.link).toBe("down");

  await new Promise((r) => setTimeout(r, 30));
  expect(got.map((e) => e.type)).toEqual(["hello", "sync", "cube", "button", "sync"]);
  expect((got[1]!.payload as { cubes: PadCube[] }).cubes).toHaveLength(6);
});

it("stdin 명령", async () => {
  const tag = `simln${process.pid}`;
  const sim = await startSim(pipePath("pad", tag), pipePath("sim", tag));
  open.push(sim);
  expect(runLine(sim.ops, "move A2:F2 10 20")).toBe("ok");
  expect(runLine(sim.ops, "list")).toContain("A2:F2 up 10,20 27%");
  expect(runLine(sim.ops, "?")).toContain("명령:");
  expect(() => runLine(sim.ops, "lift ZZ")).toThrow("없는 큐브");
});

it("simPad · drop은 core 연결을 끊는다(패드 끊김)", async () => {
  const tag = `simpad${process.pid}`;
  const sim = await startSim(pipePath("pad", tag), pipePath("sim", tag));
  open.push(sim);

  const core: Conn = await connect(pipePath("pad", tag));
  open.push(core);
  await new Promise((r) => core.onMessage(r)); // hello: 서버가 연결을 등록한 뒤
  const closed = new Promise<void>((r) => core.onClose(r));
  const ctl: Conn = await connect(pipePath("sim", tag));
  open.push(ctl);

  await expect(ctl.request("simPad", {})).resolves.toBeNull();
  await closed;
  expect(runLine(sim.ops, "drop")).toBe("ok"); // 붙은 core가 없어도 된다
  expect(runLine(sim.ops, "?")).toContain("drop");
});
