import type { Conn } from "@cubespace/protocol/pipe";
import type {
  AppWindow,
  LayoutItem,
  MonitorInfo,
  Slot,
  Snapshot,
  WinInfo,
  WindowCommand,
  WinToCore,
} from "@cubespace/protocol";
import type { CubeSpaceApi } from "@cubespace/protocol";
import { appOf, exeOf } from "./apps";
import type { Store } from "./store";

// 창 프로그램(win-driver) 연결. 창 목록을 상태에 옮기고, 배치가 바뀌면 창을 옮기게 시킨다.
export function createWinLink(store: Store, api: CubeSpaceApi, log: (m: string) => void = () => {}) {
  let conn: Conn | null = null;
  const launching = new Map<string, Slot>(); // 실행 파일 → 열리면 묶을 큐브

  const toWindow = (s: Snapshot, w: WinInfo): AppWindow => ({
    id: w.hwnd,
    app: appOf(w.exe),
    title: w.title,
    owner: s.cubes.find((c) => c.window === w.hwnd)?.name ?? null,
    status: w.minimized ? "minimized" : "linked",
  });

  function applyLayout(s: Snapshot) {
    if (!conn || !s.monitor.count) return;
    const items: LayoutItem[] = s.layout.map((p) => ({ hwnd: p.window, rect: p.rect }));
    conn.request("applyLayout", { monitor: s.monitor.no, items }).catch((e: Error) => log(`배치 실패: ${e.message}`));
  }

  // 배치나 모니터가 바뀌면 다시 옮긴다
  store.subscribe((s, prev) => {
    if (JSON.stringify(s.layout) !== JSON.stringify(prev.layout) || s.monitor.no !== prev.monitor.no) applyLayout(s);
  });

  async function attach(c: Conn) {
    conn = c;
    c.onClose(() => {
      if (conn === c) conn = null;
    });
    c.onMessage((raw) => {
      const e = raw as WinToCore;
      if (e.type === "windowOpened") {
        const w = e.payload;
        store.change((s) => {
          if (!s.windows.some((x) => x.id === w.hwnd)) s.windows.push(toWindow(s, w));
        });
        const slot = launching.get(w.exe.toLowerCase());
        if (slot !== undefined) {
          launching.delete(w.exe.toLowerCase());
          void api.assignWindow(slot, w.hwnd).catch(() => {});
        }
      }
      if (e.type === "windowClosed")
        store.change((s) => {
          s.windows = s.windows.filter((x) => x.id !== e.payload.hwnd);
          for (const cube of s.cubes) if (cube.window === e.payload.hwnd) cube.window = null;
        });
    });
    try {
      const monitors = await c.request<MonitorInfo[]>("listMonitors", {});
      const list = await c.request<WinInfo[]>("listWindows", {});
      store.change((s) => {
        s.monitor = { no: s.monitor.no <= monitors.length ? s.monitor.no : 1, count: monitors.length };
        s.windows = list.map((w) => toWindow(s, w));
        // 사라진 창을 맡던 큐브는 빈다
        for (const cube of s.cubes) if (cube.window && !list.some((w) => w.hwnd === cube.window)) cube.window = null;
      });
      applyLayout(store.get());
    } catch (e) {
      log(`창 목록 실패: ${(e as Error).message}`);
    }
  }

  const send = (type: string, payload: unknown) =>
    conn?.request(type, payload).catch((e: Error) => log(`${type} 실패: ${e.message}`));

  return {
    attach,
    command(hwnd: string, cmd: WindowCommand) {
      void send("command", { hwnd, cmd, monitor: store.get().monitor.no });
    },
    launch(app: string, slot: Slot) {
      const exe = exeOf(app);
      launching.set(exe, slot);
      void send("launch", { exe, args: [] });
    },
  };
}
