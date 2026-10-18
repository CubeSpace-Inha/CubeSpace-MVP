/// <reference types="electron-vite/node" />
import { app, BrowserWindow, Menu } from "electron";
import { join } from "node:path";
import icon from "../../resources/icon.png?asset"; // 로고 시안 I, 창 · 작업 표시줄 · 트레이 아이콘
import { createCoreClient } from "./coreClient";
import { relay } from "./ipc";
import { createSimLink } from "./simLink";
import { readSource } from "./source";
import { createTray } from "./tray";

let win: BrowserWindow | null = null;
let quitting = false;

function createWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    title: "CUBE SPACE",
    icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
    },
  });

  // 개발: electron-vite 개발 서버, 배포: 빌드된 파일
  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) {
    void w.loadURL(devUrl);
    // 기본 메뉴를 뺐으므로 개발 중에만 F12(개발자 도구) · Ctrl+R(새로고침)을 직접 단다
    w.webContents.on("before-input-event", (e, input) => {
      if (input.type !== "keyDown") return;
      if (input.key === "F12") w.webContents.toggleDevTools();
      else if (input.control && input.key.toLowerCase() === "r") w.webContents.reload();
      else return;
      e.preventDefault();
    });
  } else void w.loadFile(join(__dirname, "../renderer/index.html"));

  // ✕는 숨기기만 한다(트레이 상주). 트레이 "종료"에서만 닫힌다
  w.on("close", (e) => {
    if (quitting) return;
    e.preventDefault();
    w.hide();
  });
  win = w;
  return w;
}

// 하나만 뜬다. 두 번째로 켜면 떠 있는 창을 보여 준다
if (!app.requestSingleInstanceLock()) app.quit();
else
  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // 창 위 File · Edit · View · Window 메뉴 막대를 없앤다
    const dir = app.getPath("userData");
    const core = createCoreClient(app.getAppPath(), () => readSource(dir));
    relay(core, createSimLink(), dir);
    createWindow();
    const { show } = createTray(icon, () => win ?? createWindow(), () => {
      quitting = true;
      core.shutdown();
      app.quit();
    });
    app.on("second-instance", show);
  });
