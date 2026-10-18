import { BrowserWindow, ipcMain } from "electron";
import type { ApiMethod, SimApi, Source } from "@cubespace/protocol";
import type { CoreClient } from "./coreClient";
import { readSource, writeSource } from "./source";

// renderer(preload) ↔ core 중계. 호출은 그대로 넘기고, 스냅샷은 모든 창에 밀어준다.
export function relay(core: CoreClient, sim: SimApi, dir: string) {
  ipcMain.handle("core:call", (_, method: ApiMethod, args: unknown[]) => core.call(method, args));
  core.onSnapshot((s) => {
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send("core:snapshot", s);
  });

  // HW 통합 후 제거: HW/SW 선택 · 가상 패드 조작
  ipcMain.on("source:get", (e) => {
    e.returnValue = readSource(dir);
  });
  ipcMain.handle("source:set", async (_, v: Source) => {
    writeSource(dir, v);
    await core.restart();
    for (const w of BrowserWindow.getAllWindows()) w.webContents.reload();
  });
  ipcMain.handle("sim:call", (_, method: keyof SimApi, args: unknown[]) =>
    (sim[method] as (...a: unknown[]) => Promise<void>)(...args),
  );
}
