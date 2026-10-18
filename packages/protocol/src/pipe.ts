// pipe 연결 도구(Node 전용). JSON 한 줄씩 주고받고, 요청 ↔ 응답을 id로 짝짓는다.
// Windows는 named pipe, 그 밖(WSL 테스트)은 유닉스 소켓 파일을 쓴다.
import { createConnection, createServer, type Server, type Socket } from "node:net";
import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { envelope, parseEnvelope, PROTOCOL_VERSION, type Envelope, type Result } from "./envelope";

// core: client가 붙는 곳 · win: win-driver · pad: 패드 프로그램 · sim: pad-sim 조작(개발용)
export type PipeName = "core" | "win" | "pad" | "sim";

// CUBESPACE_PIPE_TAG를 이름 뒤에 붙인다(테스트끼리 겹치지 않게)
export function pipePath(name: PipeName, tag = process.env["CUBESPACE_PIPE_TAG"] ?? ""): string {
  const base = `cubespace-${name}${tag ? `-${tag}` : ""}`;
  return process.platform === "win32" ? `\\\\.\\pipe\\${base}` : join(tmpdir(), `${base}.sock`);
}

export type Conn = {
  send(type: string, payload: unknown, extra?: { id?: string; seq?: number }): void;
  reply(id: string | undefined, result: Result): void;
  // 응답(result)을 기다린다. 실패 응답 · 시간 초과 · 연결 끊김이면 던진다
  request<T = unknown>(type: string, payload: unknown, timeoutMs?: number): Promise<T>;
  onMessage(fn: (e: Envelope) => void): void;
  onClose(fn: () => void): void;
  close(): void;
};

export function wrap(sock: Socket): Conn {
  const handlers: ((e: Envelope) => void)[] = [];
  const closers: (() => void)[] = [];
  const pending = new Map<string, { resolve(v: unknown): void; reject(e: Error): void; timer: NodeJS.Timeout }>();
  let buf = "";
  let n = 0;
  let closed = false;

  const conn: Conn = {
    send(type, payload, extra) {
      if (!closed) sock.write(JSON.stringify(envelope(type, payload, extra)) + "\n");
    },
    reply: (id, result) => conn.send("result", result, { id }),
    request(type, payload, timeoutMs = 3000) {
      if (closed) return Promise.reject(new Error("연결 끊김"));
      const id = `r${++n}`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${type} 응답 없음`));
        }, timeoutMs);
        pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
        conn.send(type, payload, { id });
      });
    },
    onMessage: (fn) => void handlers.push(fn),
    onClose: (fn) => void closers.push(fn),
    close: () => void sock.destroy(),
  };

  sock.setEncoding("utf8");
  sock.on("data", (chunk: string) => {
    buf += chunk;
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let e: Envelope;
      try {
        e = parseEnvelope(line);
      } catch {
        continue; // 틀린 줄은 버린다
      }
      if (e.v !== PROTOCOL_VERSION) {
        sock.destroy(new Error(`규약 버전이 다름: ${e.v} (우리 ${PROTOCOL_VERSION})`));
        return;
      }
      if (e.type === "ping") {
        conn.reply(e.id, { ok: true, value: null });
        continue;
      }
      const p = e.type === "result" && e.id ? pending.get(e.id) : undefined;
      if (p) {
        pending.delete(e.id!);
        clearTimeout(p.timer);
        const r = e.payload as Result;
        if (r.ok) p.resolve(r.value);
        else p.reject(new Error(r.error));
        continue;
      }
      for (const h of handlers) h(e);
    }
  });
  sock.on("error", () => {}); // 뒤따르는 close에서 처리한다
  sock.on("close", () => {
    closed = true;
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("연결 끊김"));
    }
    pending.clear();
    for (const c of closers) c();
  });
  return conn;
}

export function connect(path: string): Promise<Conn> {
  return new Promise((resolve, reject) => {
    const sock = createConnection(path);
    sock.once("connect", () => {
      sock.off("error", reject);
      resolve(wrap(sock));
    });
    sock.once("error", reject);
  });
}

// 이미 누가 열고 있으면 EADDRINUSE로 던진다(Windows: 한 개만 뜨게 하는 데 쓴다)
export function listen(path: string, onConn: (c: Conn) => void): Promise<Server> {
  // 유닉스 소켓은 죽은 프로세스가 파일을 남기므로 지운다(개발 · 테스트용)
  if (process.platform !== "win32" && existsSync(path)) unlinkSync(path);
  return new Promise((resolve, reject) => {
    const server = createServer((sock) => onConn(wrap(sock)));
    server.once("error", reject);
    server.listen(path, () => {
      server.off("error", reject);
      resolve(server);
    });
  });
}

// 1초마다 ping, 3번 연속 응답이 없으면 onDead. 돌려받은 함수로 멈춘다
export function keepAlive(conn: Conn, onDead: () => void, intervalMs = 1000, misses = 3): () => void {
  let miss = 0;
  const timer = setInterval(() => {
    conn.request("ping", {}, intervalMs).then(
      () => (miss = 0),
      () => {
        if (++miss < misses) return;
        clearInterval(timer);
        onDead();
      },
    );
  }, intervalMs);
  conn.onClose(() => clearInterval(timer));
  return () => clearInterval(timer);
}
