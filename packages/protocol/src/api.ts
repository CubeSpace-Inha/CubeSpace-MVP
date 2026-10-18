import type { CubeMode, CubeSettings, Rules, Slot, Snapshot, WindowId } from "./snapshot";

// 화면 ↔ core 경계. 화면은 이 인터페이스로만 상태를 받는다.
// 앱은 preload의 window.cubeSpace(core 중계)를, 테스트는 견본으로 도는 가짜(client test/fakeApi.ts)를 쓴다.
// 조작(배정 · 설정 바꾸기 등)은 화면을 옮기면서 필요한 것만 더한다. 결과는 onSnapshot으로 다시 온다.
export type CubeSpaceApi = {
  getSnapshot(): Promise<Snapshot>;
  onSnapshot(listener: (s: Snapshot) => void): () => void; // 돌려받은 함수로 구독을 끊는다
  setMode(slot: Slot, mode: CubeMode): Promise<void>;
  assignWindow(slot: Slot, window: WindowId): Promise<void>; // 다른 큐브의 창이면 맞바꾼다
  assignAi(slot: Slot, profile: string | null): Promise<void>; // 다른 큐브의 구성이면 맞바꾼다. null = 배정 해제
  setAiChoices(slot: Slot, profiles: string[]): Promise<void>; // AI 모드 전환 목록(순서대로)
  // 창 화면
  openApp(slot: Slot, app: string): Promise<void>; // 프로그램을 새로 열어 큐브에 묶는다
  releaseCube(slot: Slot): Promise<void>; // 묶음 풀기: 창은 최소화, 큐브는 ?로 남는다
  windowCommand(window: WindowId, cmd: WindowCommand): Promise<void>;
  setMonitor(no: number): Promise<void>;
  setCubeSettings(slot: Slot, patch: Partial<Omit<CubeSettings, "slot">>): Promise<void>;
  // 설정 화면
  setRules(patch: Partial<Rules>): Promise<void>;
  startPairing(): Promise<number>; // 장치 추가 시작: 켜진 미등록 큐브 수(빈 슬롯 수까지)를 돌려준다. 0이면 시작하지 않는다
  stopPairing(): Promise<void>; // 장치 추가 끝. 이미 등록한 큐브는 남는다
  unregisterCube(slot: Slot): Promise<void>; // 맡던 창은 담당 없는 창이 되고 슬롯이 빈다
};

// 열린 창 버튼: 왼쪽 · 오른쪽 절반, 최소화 · 올리기, 항상 위, 닫기
export type WindowCommand = "left" | "right" | "min" | "top" | "close";

// HW 통합 후 제거: core가 붙을 패드(hw = pad-gateway, sw = 가상 패드 pad-sim)
export type Source = "hw" | "sw";
