import type { Xy } from "./pad";
import type { CubeMode, CubeSettings, ModeCube, Rules, Slot, Snapshot, WindowId } from "./snapshot";

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
  // id가 있으면 그 모드를 고친다. now = 지금 패드 그대로 저장(그 모드가 실행 중이 된다)
  saveMode(mode: { id?: string; name: string; cubes: ModeCube[]; now?: boolean }): Promise<void>;
  deleteMode(id: string): Promise<void>;
  // 설정 화면
  setRules(patch: Partial<Rules>): Promise<void>;
  startPairing(): Promise<number>; // 장치 추가 시작: 켜진 미등록 큐브 수(빈 슬롯 수까지)를 돌려준다. 0이면 시작하지 않는다
  stopPairing(): Promise<void>; // 장치 추가 끝. 이미 등록한 큐브는 남는다
  unregisterCube(slot: Slot): Promise<void>; // 맡던 창은 담당 없는 창이 되고 슬롯이 빈다
};

// 열린 창 버튼: 왼쪽 · 오른쪽 절반, 최소화 · 올리기, 항상 위, 닫기
export type WindowCommand = "left" | "right" | "min" | "top" | "close";

// HW 통합 후 제거: 화면이 붙을 곳(hw = pad-gateway, sw = 가상 패드 pad-sim)과 가상 패드 조작.
// id는 큐브 mac4(= pad-sim 큐브 id)
export type Source = "hw" | "sw";
export type SimApi = {
  moveCube(id: string, xy: Xy | null): Promise<void>; // null = 들기(패드 밖)
  press(id: string, press: "short" | "long"): Promise<void>;
  setLink(id: string, link: "up" | "down"): Promise<void>;
  dropPad(): Promise<void>; // 패드 끊김. 약 1초 뒤 큐브가 모두 패드 밖인 채로 돌아온다
};
// preload가 여는 window.cubeSpace. sim은 SW일 때만 있다
export type Bridge = CubeSpaceApi & { source: Source; setSource(v: Source): Promise<void>; sim?: SimApi };
