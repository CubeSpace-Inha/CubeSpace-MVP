import { Menu, Tray, type BrowserWindow } from "electron";

// 트레이에 늘 남는다. ✕는 창만 숨기고, 트레이의 "종료"에서만 전부 끈다.
export function createTray(icon: string, getWindow: () => BrowserWindow, onQuit: () => void) {
  const show = () => {
    const w = getWindow();
    if (w.isMinimized()) w.restore();
    w.show();
    w.focus();
  };
  const tray = new Tray(icon);
  tray.setToolTip("CUBE SPACE");
  tray.setContextMenu(
    Menu.buildFromTemplate([{ label: "열기", click: show }, { type: "separator" }, { label: "종료", click: onQuit }]),
  );
  tray.on("click", show);
  return { tray, show };
}
