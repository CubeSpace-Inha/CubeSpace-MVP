import { connect, pipePath, type Conn } from "@cubespace/protocol/pipe";
import type { SimApi } from "@cubespace/protocol";

// HW 통합 후 제거: 시뮬레이션 화면의 가상 패드 조작을 pad-sim(sim pipe)에 넘긴다.
// 처음 부를 때 붙고, 끊기면(pad-sim 재시작) 다음 부를 때 다시 붙는다.
export function createSimLink(path = pipePath("sim")): SimApi {
  let conn: Promise<Conn> | null = null;

  function get() {
    conn ??= connect(path).then(
      (c) => {
        c.onClose(() => (conn = null));
        return c;
      },
      () => {
        conn = null;
        throw new Error("pad-sim에 연결할 수 없어요");
      },
    );
    return conn;
  }

  const req = async (type: string, payload: unknown) => {
    await (await get()).request(type, payload, 3000);
  };

  return {
    moveCube: (id, xy) => req("simCube", { id, xy }),
    press: (id, press) => req("simButton", { id, press }),
    setLink: (id, link) => req("simLink", { id, link }),
    dropPad: () => req("simPad", {}),
  };
}
