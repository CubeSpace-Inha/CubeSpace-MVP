import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { connect, pipePath, type Conn } from "@cubespace/protocol/pipe";
import type { ApiMethod, Snapshot, Source } from "@cubespace/protocol";

// core 연결. 붙어 보고 없으면 core를 띄운다. 끊기면 1 · 2 · 4 …초(최대 30초) 뒤 다시 붙는다.
// core는 client와 따로 산다(client가 죽어도 상태 · 창 배치는 이어진다).

// 개발 중 위치(저장소 안). 설치본 경로는 패키징 때 정한다
function coreArgs(appPath: string, source: Source) {
  const repo = join(appPath, "../..");
  const core = join(repo, "apps/core/dist/core.cjs");
  const padSim = join(repo, "apps/pad-sim/dist/pad-sim.cjs");
  const win = ["Release", "Debug"]
    .map((c) => join(repo, `drivers/win-driver/bin/${c}/net8.0-windows/WinDriver.exe`))
    .find(existsSync);
  // HW 통합 후 제거(SW 분기): SW면 가상 패드 pad-sim. HW(pad-gateway)는 아직 없어 --pad 없이 띄운다(패드 끊김으로 보임)
  const pad = source === "sw" ? ["--pad", padSim] : [];
  return [core, ...pad, ...(win ? ["--win", win] : [])];
}

function launchCore(appPath: string, source: Source) {
  const args = coreArgs(appPath, source);
  if (!existsSync(args[0]!)) throw new Error(`core가 빌드되지 않음: ${args[0]} (pnpm build)`);
  // Electron 실행 파일을 Node로 돌린다
  spawn(process.execPath, args, {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
}

export function createCoreClient(appPath: string, getSource: () => Source, log: (m: string) => void = console.log) {
  let conn: Conn | null = null;
  let last: Snapshot | null = null;
  let backoff = 1000;
  let quitting = false;
  const listeners = new Set<(s: Snapshot) => void>();
  let waiters: ((c: Conn) => void)[] = [];

  async function attach() {
    const path = pipePath("core");
    let c: Conn;
    try {
      c = await connect(path);
    } catch {
      // 없으면 띄우고 5초 동안 붙어 본다
      launchCore(appPath, getSource());
      for (let i = 0; ; i++) {
        await new Promise((r) => setTimeout(r, 200));
        try {
          c = await connect(path);
          break;
        } catch (e) {
          if (i >= 25) throw e;
        }
      }
    }
    backoff = 1000;
    conn = c;
    log("core 연결됨");
    c.send("hello", { role: "client" });
    c.onMessage((e) => {
      if (e.type !== "snapshot") return;
      last = e.payload as Snapshot;
      for (const l of listeners) l(last);
    });
    c.onClose(() => {
      conn = null;
      if (quitting) return;
      log("core 끊김");
      retry();
    });
    for (const w of waiters) w(c);
    waiters = [];
  }

  function retry() {
    setTimeout(() => void attach().catch(retry), backoff);
    backoff = Math.min(backoff * 2, 30_000);
  }

  const ready = () => (conn ? Promise.resolve(conn) : new Promise<Conn>((r) => waiters.push(r)));

  void attach().catch((e: Error) => {
    log(`core 연결 실패: ${e.message}`);
    retry();
  });

  return {
    // 붙을 때까지 기다렸다가 부른다
    call: async (method: ApiMethod, args: unknown[]) => (await ready()).request("call", { method, args }, 10_000),
    onSnapshot(fn: (s: Snapshot) => void) {
      listeners.add(fn);
      if (last) fn(last);
      return () => void listeners.delete(fn);
    },
    // 트레이 "종료": core가 하위 프로그램까지 끈다
    shutdown() {
      quitting = true;
      conn?.send("shutdown", {});
    },
    // HW 통합 후 제거: HW/SW를 바꾸면 core를 끄고 새 --pad로 다시 띄운다.
    // 끊기면 retry → 붙을 core가 없어 launchCore가 돈다. 새 core에 붙으면 끝난다
    restart() {
      return new Promise<void>((resolve) => {
        waiters.push(() => resolve());
        conn?.send("shutdown", {});
      });
    },
  };
}

export type CoreClient = ReturnType<typeof createCoreClient>;
