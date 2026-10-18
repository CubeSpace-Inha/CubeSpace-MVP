import { BrowserWindow, ipcMain } from "electron";
import type { ApiMethod } from "@cubespace/protocol";
import type { CoreClient } from "./coreClient";

// renderer(preload) ↔ core 중계. 호출은 그대로 넘기고, 스냅샷은 모든 창에 밀어준다.
export function relay(core: CoreClient) {
  ipcMain.handle("core:call", (_, method: ApiMethod, args: unknown[]) => core.call(method, args));
  core.onSnapshot((s) => {
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send("core:snapshot", s);
  });
}
