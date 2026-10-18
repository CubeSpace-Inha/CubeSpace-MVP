import { contextBridge, ipcRenderer } from "electron";
import type { ApiMethod, CubeSpaceApi, Snapshot } from "@cubespace/protocol";

// renderer에 window.cubeSpace(화면 API)를 연다. 호출은 main을 거쳐 core로 간다.
// Record로 적어 두면 API에 메서드가 늘었을 때 여기서 타입 오류가 난다.
const METHODS: Record<ApiMethod, true> = {
  getSnapshot: true,
  setMode: true,
  assignWindow: true,
  assignAi: true,
  setAiChoices: true,
  openApp: true,
  releaseCube: true,
  windowCommand: true,
  setMonitor: true,
  setCubeSettings: true,
  setRules: true,
  startPairing: true,
  stopPairing: true,
  unregisterCube: true,
};

const api = Object.fromEntries(
  Object.keys(METHODS).map((m) => [m, (...args: unknown[]) => ipcRenderer.invoke("core:call", m, args)]),
) as Omit<CubeSpaceApi, "onSnapshot">;

contextBridge.exposeInMainWorld("cubeSpace", {
  ...api,
  onSnapshot(listener: (s: Snapshot) => void) {
    const fn = (_: unknown, s: Snapshot) => listener(s);
    ipcRenderer.on("core:snapshot", fn);
    return () => void ipcRenderer.off("core:snapshot", fn);
  },
} satisfies CubeSpaceApi);
