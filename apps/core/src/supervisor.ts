import { spawn, type ChildProcess } from "node:child_process";
import { connect, keepAlive, type Conn } from "@cubespace/protocol/pipe";

// 하위 프로그램 하나를 띄우고 그 pipe에 붙는다. 죽거나 끊기면 1 · 2 · 4 …초(최대 30초) 뒤 다시 한다.
// cmd가 없으면 띄우지 않고 붙기만 한다(개발 중 따로 켠 pad-sim 등).
export type Child = {
  name: string;
  pipe: string;
  cmd?: string;
  args?: string[];
  onConn(conn: Conn): void;
  log?(m: string): void;
};

const MAX_BACKOFF = 30_000;

export function supervise(o: Child) {
  const log = o.log ?? (() => {});
  let backoff = 1000;
  let child: ChildProcess | null = null;
  let conn: Conn | null = null;
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  function retry() {
    child?.kill();
    child = null;
    if (stopped) return;
    log(`${o.name}: ${backoff / 1000}초 뒤 다시`);
    timer = setTimeout(start, backoff);
    backoff = Math.min(backoff * 2, MAX_BACKOFF);
  }

  // 막 띄운 프로그램은 pipe를 여는 데 시간이 걸리므로 5초 동안 붙어 본다
  async function connectSoon(): Promise<Conn> {
    for (let i = 0; ; i++) {
      try {
        return await connect(o.pipe);
      } catch (e) {
        if (i >= 25 || stopped) throw e;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  async function start() {
    if (o.cmd) {
      const c = spawn(o.cmd, o.args ?? [], { stdio: "inherit", windowsHide: true });
      child = c;
      c.on("error", (e) => log(`${o.name}: 실행 실패 ${e.message}`));
      c.on("exit", (code) => {
        log(`${o.name}: 끝남(${code})`);
        if (child !== c) return;
        if (conn)
          conn.close(); // 끊김 처리(onClose)에서 다시 띄운다
        else child = null;
      });
    }
    try {
      const c = await connectSoon();
      if (stopped) return c.close();
      conn = c;
      backoff = 1000;
      log(`${o.name}: 연결됨`);
      c.onClose(() => {
        conn = null;
        log(`${o.name}: 끊김`);
        retry();
      });
      keepAlive(c, () => c.close());
      o.onConn(c);
    } catch {
      retry();
    }
  }

  void start();
  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      conn?.close();
      child?.kill();
    },
  };
}
