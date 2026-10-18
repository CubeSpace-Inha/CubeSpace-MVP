import { afterEach, describe, expect, it } from "vitest";
import { createConnection, type Server, type Socket } from "node:net";
import { Duplex } from "node:stream";
import { connect, keepAlive, listen, pipePath, wrap, type Conn } from "../src/pipe";

let tag = 0;
const servers: Server[] = [];
const conns: Conn[] = [];
afterEach(() => {
  for (const c of conns.splice(0)) c.close();
  for (const s of servers.splice(0)) s.close();
});

// 서버 하나와 붙은 클라이언트 하나
async function pair(onServer: (c: Conn) => void = () => {}) {
  const path = pipePath("core", `t${process.pid}-${++tag}`);
  servers.push(await listen(path, (c) => (conns.push(c), onServer(c))));
  const client = await connect(path);
  conns.push(client);
  return client;
}

describe("pipe", () => {
  it("요청에 같은 id로 응답한다", async () => {
    const client = await pair((s) =>
      s.onMessage((e) => s.reply(e.id, { ok: true, value: (e.payload as { n: number }).n * 2 })),
    );
    await expect(client.request("double", { n: 21 })).resolves.toBe(42);
  });

  it("실패 응답은 던진다", async () => {
    const client = await pair((s) => s.onMessage((e) => s.reply(e.id, { ok: false, error: "안 됨" })));
    await expect(client.request("x", {})).rejects.toThrow("안 됨");
  });

  it("ping에는 알아서 답한다", async () => {
    const client = await pair();
    await expect(client.request("ping", {})).resolves.toBeNull();
  });

  it("응답이 없으면 시간 초과", async () => {
    const client = await pair();
    await expect(client.request("silent", {}, 50)).rejects.toThrow("응답 없음");
  });

  it("끊기면 기다리던 요청이 실패한다", async () => {
    const client = await pair((s) => s.onMessage(() => s.close()));
    await expect(client.request("x", {})).rejects.toThrow("연결 끊김");
  });

  it("버전이 다르면 연결을 끊는다", async () => {
    const path = pipePath("core", `t${process.pid}-${++tag}`);
    const closed = new Promise<void>((done) => {
      void listen(path, (c) => (conns.push(c), c.onClose(done))).then((s) => servers.push(s));
    });
    await new Promise((r) => setTimeout(r, 20));
    // send는 늘 지금 버전이므로 원시 소켓으로 다른 버전을 보낸다
    const raw = createConnection(path);
    raw.on("error", () => {});
    raw.on("connect", () => raw.write('{"v":99,"type":"hello","ts":1,"payload":{}}\n'));
    await closed;
    raw.destroy();
  });

  it("keepAlive: 응답이 계속 없으면 onDead", async () => {
    // 보낸 것을 버리고 아무 답도 하지 않는 가짜 소켓
    const fake = new Duplex({ read() {}, write: (_c, _e, cb) => cb() }) as unknown as Socket;
    const c = wrap(fake);
    const dead = new Promise<void>((done) => keepAlive(c, done, 20, 3));
    await expect(dead).resolves.toBeUndefined();
  });
});
