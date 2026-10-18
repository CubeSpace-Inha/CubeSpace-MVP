import { afterEach, expect, it } from "vitest";
import type { Server } from "node:net";
import { connect, pipePath, type Conn } from "@cubespace/protocol/pipe";
import type { Snapshot } from "@cubespace/protocol";
import { createApi } from "../src/api";
import { serveClients } from "../src/server";
import { createStore } from "../src/store";

let server: Server | undefined;
let client: Conn | undefined;
afterEach(() => {
  client?.close();
  server?.close();
});

it("client pipe: 붙으면 스냅샷을 받고, call로 화면 API를 부른다", async () => {
  const store = createStore();
  const api = createApi(store, { padCubes: () => [], tryPair: () => {}, command: () => {}, launch: () => {} });
  const path = pipePath("core", `srv${process.pid}`);
  let down = false;
  server = await serveClients(path, api, () => (down = true));
  client = await connect(path);
  const snaps: Snapshot[] = [];
  client.onMessage((e) => e.type === "snapshot" && snaps.push(e.payload as Snapshot));

  await client.request("call", { method: "setRules", args: [{ split2: "half" }] });
  await expect(client.request("call", { method: "unregisterCube", args: [0] })).rejects.toThrow("슬롯 0에 큐브 없음");
  await expect(client.request("call", { method: "nope", args: [] })).rejects.toThrow("없는 메서드");
  expect(snaps.at(-1)!.settings.rules.split2).toBe("half");

  client.send("shutdown", {});
  await new Promise((r) => setTimeout(r, 30));
  expect(down).toBe(true);
});
