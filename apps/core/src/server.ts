import type { Server } from "node:net";
import { listen, type Conn } from "@cubespace/protocol/pipe";
import type { ApiMethod, ClientToCore, CubeSpaceApi } from "@cubespace/protocol";

// client가 붙는 pipe. call → 화면 API, 상태가 바뀔 때마다 snapshot을 밀어준다.
export async function serveClients(path: string, api: CubeSpaceApi, onShutdown: () => void): Promise<Server> {
  return listen(path, (c: Conn) => {
    void api.getSnapshot().then((s) => c.send("snapshot", s));
    const off = api.onSnapshot((s) => c.send("snapshot", s));
    c.onClose(off);
    c.onMessage((raw) => {
      const e = raw as ClientToCore;
      if (e.type === "shutdown") onShutdown();
      if (e.type !== "call") return;
      const { method, args } = e.payload;
      const fn = (api as Record<ApiMethod, (...a: unknown[]) => Promise<unknown>>)[method];
      if (typeof fn !== "function" || (method as string) === "onSnapshot")
        return c.reply(e.id, { ok: false, error: `없는 메서드: ${method}` });
      fn(...args).then(
        (value) => c.reply(e.id, { ok: true, value: value ?? null }),
        (err: Error) => c.reply(e.id, { ok: false, error: err.message }),
      );
    });
  });
}
