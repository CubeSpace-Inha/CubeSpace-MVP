import { pipePath } from "@cubespace/protocol/pipe";
import { createApi } from "./api";
import { createPadLink } from "./padLink";
import { seedPairedCubes } from "./seed";
import { serveClients } from "./server";
import { createStore } from "./store";
import { supervise } from "./supervisor";
import { createWinLink } from "./winLink";

// core 시작점. 쓰는 법: core [--win <WinDriver.exe>] [--pad <pad-sim.cjs | gateway.exe>]
// 하위 프로그램을 주지 않으면 띄우지 않고 그 pipe에 붙기만 한다.
// Electron이 ELECTRON_RUN_AS_NODE=1로 띄운다. .cjs는 같은 실행 파일(process.execPath)로 띄운다.

const log = (m: string) => console.log(`[core] ${m}`);

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

function command(path: string | undefined) {
  if (!path) return {};
  return /\.c?js$/.test(path)
    ? { cmd: process.execPath, args: [path] }
    : { cmd: path, args: [] };
}

async function main() {
  const store = createStore();
  seedPairedCubes(store); // 임시(MVP): 큐브 6개 페어링된 가정
  // api와 링크가 서로를 쓴다. Side 함수는 나중에 불리므로 아래 pad · win을 써도 된다
  const api = createApi(store, {
    padCubes: () => pad.cubes(),
    tryPair: () => pad.tryPair(),
    command: (hwnd, cmd) => win.command(hwnd, cmd),
    launch: (app, slot) => win.launch(app, slot),
  });
  const pad = createPadLink(store, api);
  const win = createWinLink(store, api, log);

  let children: { stop(): void }[] = [];
  const shutdown = () => {
    log("종료");
    for (const c of children) c.stop();
    process.exit(0);
  };

  try {
    await serveClients(pipePath("core"), api, shutdown);
  } catch (e) {
    // 이미 다른 core가 떠 있다: 하나만 돈다
    if ((e as NodeJS.ErrnoException).code === "EADDRINUSE") {
      log("이미 실행 중");
      process.exit(0);
    }
    throw e;
  }
  // 하나만 도는 게 확인된 뒤에 하위 프로그램을 띄운다
  children = [
    supervise({
      name: "win",
      pipe: pipePath("win"),
      ...command(arg("win")),
      onConn: (c) => void win.attach(c),
      log,
    }),
    supervise({
      name: "pad",
      pipe: pipePath("pad"),
      ...command(arg("pad")),
      onConn: (c) => pad.attach(c),
      log,
    }),
  ];

  log(`준비됨 ${pipePath("core")}`);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();
