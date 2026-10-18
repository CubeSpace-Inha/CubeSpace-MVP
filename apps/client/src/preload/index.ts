import { contextBridge, ipcRenderer } from "electron";
import type { ApiMethod, Bridge, CubeSpaceApi, SimApi, Snapshot, Source } from "@cubespace/protocol";

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
  saveMode: true,
  deleteMode: true,
  setRules: true,
  startPairing: true,
  stopPairing: true,
  unregisterCube: true,
};

const api = Object.fromEntries(
  Object.keys(METHODS).map((m) => [m, (...args: unknown[]) => ipcRenderer.invoke("core:call", m, args)]),
) as Omit<CubeSpaceApi, "onSnapshot">;

// HW 통합 후 제거: HW/SW 선택(창을 열 때 한 번 읽는다)과 SW일 때만 여는 가상 패드 조작
const source = ipcRenderer.sendSync("source:get") as Source;
const SIM: Record<keyof SimApi, true> = { moveCube: true, press: true, setLink: true, dropPad: true };
const sim = Object.fromEntries(
  Object.keys(SIM).map((m) => [m, (...args: unknown[]) => ipcRenderer.invoke("sim:call", m, args)]),
) as SimApi;

contextBridge.exposeInMainWorld("cubeSpace", {
  ...api,
  onSnapshot(listener: (s: Snapshot) => void) {
    const fn = (_: unknown, s: Snapshot) => listener(s);
    ipcRenderer.on("core:snapshot", fn);
    return () => void ipcRenderer.off("core:snapshot", fn);
  },
  source,
  setSource: (v: Source) => ipcRenderer.invoke("source:set", v),
  ...(source === "sw" && { sim }),
} satisfies Bridge);
