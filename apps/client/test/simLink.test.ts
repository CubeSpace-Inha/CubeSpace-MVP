// @vitest-environment node
import type { Server } from "node:net";
import { afterEach, expect, test } from "vitest";
import { listen, pipePath, type Conn } from "@cubespace/protocol/pipe";
import type { Envelope } from "@cubespace/protocol";
import { createSimLink } from "../src/main/simLink";

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach((x) => x.close()));

// 가짜 pad-sim: 받은 요청을 적고 ok로 답한다
async function fakeSim(path: string) {
  const got: Envelope[] = [];
  const conns: Conn[] = [];
  const server: Server = await listen(path, (c) => {
    conns.push(c);
    c.onMessage((e) => {
      got.push(e);
      c.reply(e.id, { ok: true, value: null });
    });
  });
  open.push(server);
  return { got, conns };
}

test("조작을 sim pipe 요청으로 옮긴다", async () => {
  const path = pipePath("sim", `link${process.pid}`);
  const sim = await fakeSim(path);
  const link = createSimLink(path);
  await link.moveCube("A2:F0", [40, 60]);
  await link.moveCube("A2:F0", null);
  await link.press("A2:F1", "long");
  await link.setLink("A2:F2", "down");
  await link.dropPad();
  expect(sim.got.map((e) => [e.type, e.payload])).toEqual([
    ["simCube", { id: "A2:F0", xy: [40, 60] }],
    ["simCube", { id: "A2:F0", xy: null }],
    ["simButton", { id: "A2:F1", press: "long" }],
    ["simLink", { id: "A2:F2", link: "down" }],
    ["simPad", {}],
  ]);
  expect(sim.conns).toHaveLength(1); // 한 번 붙어 계속 쓴다
});

test("pad-sim이 없으면 알아볼 수 있는 오류", async () => {
  const link = createSimLink(pipePath("sim", `none${process.pid}`));
  await expect(link.dropPad()).rejects.toThrow("pad-sim에 연결할 수 없어요");
});

test("끊기면 다음 호출에서 다시 붙는다", async () => {
  const path = pipePath("sim", `again${process.pid}`);
  const sim = await fakeSim(path);
  const link = createSimLink(path);
  await link.press("A2:F0", "short");
  sim.conns[0]!.close();
  await new Promise((r) => setTimeout(r, 30));
  await link.press("A2:F0", "short");
  expect(sim.conns).toHaveLength(2);
});
