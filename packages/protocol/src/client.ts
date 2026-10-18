import type { CubeSpaceApi } from "./api";
import type { Empty, Envelope, Result } from "./envelope";
import type { Snapshot } from "./snapshot";

// client(Electron main) ↔ core. 화면 API(CubeSpaceApi)를 그대로 원격 호출로 옮긴다.

export type ApiMethod = Exclude<keyof CubeSpaceApi, "onSnapshot">;

export type ClientToCore =
  | Envelope<"hello", { role: "client" }>
  | Envelope<"call", { method: ApiMethod; args: unknown[] }> // id 필수 → result
  | Envelope<"shutdown", Empty>; // 트레이 "종료": core가 하위 프로그램까지 끈다

export type CoreToClient = Envelope<"result", Result> | Envelope<"snapshot", Snapshot>; // 상태가 바뀔 때마다 밀어준다
