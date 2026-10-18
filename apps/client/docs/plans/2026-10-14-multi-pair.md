# 큐브 여러 개 한 번에 등록 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장치 추가에서 켜 둔 큐브 여러 개를 한 흐름으로 등록한다. 큐브를 하나씩 패드 확인점에 올린 순서대로 빈 슬롯에 들어가고, core가 이를 자동으로 감지한다.

**Architecture:** 진행 상태는 스냅샷 `pairing`에 둔다. 화면은 `startPairing` / `stopPairing`만 부른다. core에서는 api가 등록할 개수를 세고, padLink가 `cube` · `sync` 메시지를 받을 때마다 `tryPair()`로 확인점 위의 미등록 큐브 하나를 등록한다. 화면 단계(idle / place / done / none)는 스냅샷에서 계산한다.

**Tech Stack:** TypeScript · React 19 · vitest(jsdom) · `@cubespace/protocol`

**Spec:** `apps/client/docs/specs/2026-10-14-multi-pair-design.md`

## Global Constraints

- `Snapshot.pairing: { total: number; done: Slot[] } | null`이고 처음 값은 `null`이에요.
- `startPairing(): Promise<number>`과 `stopPairing(): Promise<void>`를 넣고 `registerCube()`는 지워요.
- 확인점은 `PAD_CHECK = { xy: [PAD_W / 2, PAD_H / 2], r: 20 }`(mm)로, `packages/protocol/src/split.ts`에 둬요.
- 등록 이름은 슬롯 알파벳이에요(0 = A … 5 = F). 큐브 기본값은 지금 `registerCube`와 같아요(state idle, mode window, icon heart).
- 문구는 스펙 그대로 써요.
  - "큐브 하나를 확인점에 올려 주세요 (k/N)"
  - "{글자}로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (k/N)"
  - "그만하기"
  - "큐브 N개 등록 완료"
  - "찾은 큐브가 없어요" / "등록할 큐브를 켜 주세요"
- k는 **지금 올릴 큐브의 번째**(= `done.length + 1`)예요. 스펙의 손 확인 "1/4 → 2/4"를 따랐어요.
- 완료(done)와 0개(none) 표시는 1.7초 뒤 처음 상태로 돌아가요.
- 화면 문구 · 주석 · 커밋 메시지는 한국어로 써요. 커밋은 한 줄 `-m`이고 접두사만 영어예요.
- 기존 파일에 `npx prettier`나 `git checkout`을 돌리지 않아요. 저장소에 prettier 설정이 없고 기존 코드는 긴 줄 스타일이에요.
- 명령
  - core: `pnpm --dir apps/core test`
  - client: `pnpm --dir apps/client test` · `pnpm --dir apps/client typecheck` · `pnpm --dir apps/client lint`. typecheck는 WSL에서 2분 넘게 걸릴 수 있어요(timeout 300 s).

## 계획에서 정한 것 (스펙에 없던 것)

- **미등록 큐브 수는 켜진 것(`link === "up"`)만 세요.** 꺼진 큐브는 확인점에 올려도 등록되지 않으니, 세면 끝나지 않는 흐름이 돼요.
- **`tryPair`는 padLink에 두고, api는 `Side.tryPair()`로 불러요.** api에 두면 core pipe 서버가 이름만으로 메서드를 찾아 부르기 때문에 `tryPair`가 바깥에 열려요. 패드가 아는 큐브(`known`)도 padLink에 있어요.
- **설정 카드(DeviceCard)의 안내 문구도 바꿔요.** "한 번에 하나씩 켜" → "모두 켜". 페어링 화면과 같은 문장이에요.
- **작업 3(SW 임시)은 스펙에 없어요. 사용자 확인이 필요해요.**
  - pad-sim 큐브는 처음에 모두 패드 밖(xy null)이고, 시뮬레이션 화면은 등록된 큐브만 그려요.
  - 그래서 SW에서는 미등록 큐브를 확인점에 올릴 방법이 없어요. pad-sim은 core가 띄우므로 stdin도 쓸 수 없어요.
  - 작업 3이 없으면 SW에서 큐브를 등록할 수 없어요.

## Review Focus

1. **등록 중 패드 끊김**: core가 `pairing = null`로 바꿔야 해요. 그러면 화면은 idle로 돌아가고 "패드를 먼저 연결해 주세요"가 보여야 해요. → 작업 1 "패드 끊김 → pairing null" 테스트
2. **화면을 떠났다 돌아옴**(설정 → 시뮬레이션 → 설정): 이전에 등록한 슬롯으로 등록 토스트가 다시 뜨면 안 돼요. 진행 표시(k/N)는 이어져야 해요. → 작업 2 "다시 열면 지난 등록은 알리지 않는다" 테스트
3. **등록한 큐브를 확인점에서 안 내림**: 그 큐브가 다시 등록되면 안 돼요. → 작업 1 "등록된 큐브를 다시 올려도 무시" 테스트
4. **켜진 미등록 큐브가 0개**: pairing이 시작되지 않아야 해요. 화면은 "찾은 큐브가 없어요"를 1.7초 보여 준 뒤 idle로 가요. → 작업 1 0개 테스트, 작업 2 none 테스트
5. **N개를 다 채운 뒤 새 큐브가 켜짐**: 확인점에 올려도 더 등록하지 않아요. 완료 표시 뒤 `stopPairing`이 불려 idle로 가요. → 작업 1 "다 채운 뒤에는 등록 안 함", 작업 2 done 테스트

---

### Task 1: protocol · core — startPairing · stopPairing · 확인점 자동 등록

**Files:**

- Modify
  - `packages/protocol/src/snapshot.ts`: `Snapshot` 끝에 `pairing`을 넣어요.
  - `packages/protocol/src/api.ts`: `registerCube` 줄을 바꿔요.
  - `packages/protocol/src/split.ts`: `PAD_H` 아래에 `PAD_CHECK`를 넣어요.
  - `apps/core/src/store.ts`: `emptySnapshot()`에 `pairing: null`을 넣어요.
  - `apps/core/src/api.ts`: `Side`에 `tryPair`를 넣고, `registerCube`를 `startPairing`과 `stopPairing`으로 바꿔요.
  - `apps/core/src/padLink.ts`: `tryPair`를 만들고 `sync` · `cube` 뒤에 불러요. `onClose`에서 `pairing = null`로 바꿔요.
  - `apps/core/src/index.ts`: Side에 `tryPair`를 넣어요.
- Test
  - `apps/core/test/core.test.ts`
  - `apps/core/test/server.test.ts:22,28`

**Interfaces:**

- Produces
  - `Snapshot.pairing: { total: number; done: Slot[] } | null`
  - `CubeSpaceApi.startPairing(): Promise<number>`
  - `CubeSpaceApi.stopPairing(): Promise<void>`
  - `PAD_CHECK: { xy: [number, number]; r: number }`(`@cubespace/protocol`에서 export)
  - `registerCube`가 없어져요.
- core 안
  - `Side.tryPair(): void`
  - `createPadLink(...)`가 `{ attach, cubes, tryPair }`를 돌려줘요.
- 이 작업이 끝나면 client typecheck와 test는 깨져요(registerCube, pairing 필드). 작업 2에서 고쳐요.

- [ ] **Step 1: protocol 타입부터 바꾸기(테스트가 컴파일되도록)**

`packages/protocol/src/snapshot.ts`의 `Snapshot` 끝(`monitor` 줄 아래):

```ts
  // 장치 추가 중일 때만 값이 있다: 등록할 큐브 수와 이번에 등록한 슬롯(순서대로). 확인점에 올린 순서로 core가 등록한다
  pairing: { total: number; done: Slot[] } | null;
```

`packages/protocol/src/api.ts`: `registerCube` 줄을 지우고 그 자리에 쓴다.

```ts
  startPairing(): Promise<number>; // 장치 추가 시작: 켜진 미등록 큐브 수(빈 슬롯 수까지)를 돌려준다. 0이면 시작하지 않는다
  stopPairing(): Promise<void>; // 장치 추가 끝. 이미 등록한 큐브는 남는다
```

`packages/protocol/src/split.ts`의 `PAD_H` 아래:

```ts
// 장치 추가 확인점(mm): 패드 가운데. 반경은 큐브 한 변(35 mm)보다 조금 크게
export const PAD_CHECK = {
  xy: [PAD_W / 2, PAD_H / 2] as [number, number],
  r: 20,
};
```

`apps/core/src/store.ts`의 `emptySnapshot()` 끝(`monitor` 줄 아래)에 `pairing: null,`을 넣는다.

- [ ] **Step 2: core 테스트를 새 흐름으로 고치고 새 테스트 쓰기**

`apps/core/test/core.test.ts`

머리말 import에 `PAD_CHECK`를 넣는다.

```ts
import { PAD_CHECK, type PadCube } from "@cubespace/protocol";
```

`setup()`의 `side`에 `tryPair`를 넣는다.

```ts
const side: Side = {
  padCubes: () => pad.cubes(),
  tryPair: () => pad.tryPair(),
  command: (hwnd, cmd) => (calls.push(`${cmd} ${hwnd}`), win.command(hwnd, cmd)),
  launch: (app, slot) => win.launch(app, slot),
};
```

`cubes` 아래에 도우미를 넣는다.

```ts
type Pad = ReturnType<typeof fakeConn>;
type Api = ReturnType<typeof setup>["api"];

// 장치 추가로 등록: 확인점에 올렸다가 sync 때 자리로 되돌린다
async function register(api: Api, p: Pad, ids: string[]) {
  await api.startPairing();
  for (const id of ids) {
    p.emit("cube", { id, xy: PAD_CHECK.xy });
    p.emit("cube", { id, xy: cubes.find((c) => c.id === id)!.xy });
  }
  await api.stopPairing();
}
```

테스트 "패드가 붙으면 알림이 사라지고, 아는 큐브를 등록할 수 있다"에서 `registerCube` 세 줄을 바꾼다.

```ts
await register(api, p, ["A2:F0", "A2:F1"]);
```

- 이 테스트의 나머지(이름 · mac4 · battLevel 확인, 들기, 끊김)는 그대로 둔다.
- 테스트 이름은 "패드가 붙으면 알림이 사라지고, 확인점에 올린 순서로 등록된다"로 바꾼다.

다른 테스트의 `await api.registerCube();`도 바꾼다.

- "창 목록을 받고…"의 두 줄 → `await register(api, p, ["A2:F0", "A2:F1"]);`
- "프로그램을 열면…"의 한 줄 → `await register(api, p, ["A2:F0"]);`
- "묶음을 풀면…"의 한 줄 → `await register(api, p, ["A2:F0"]);`

`describe("core")` 안 끝에 새 테스트를 넣는다.

```ts
it("startPairing: 켜진 미등록 큐브를 빈 슬롯 수까지 센다. 0이면 시작하지 않는다", async () => {
  const { store, api, pad } = setup();
  const p = fakeConn();
  pad.attach(p.conn);
  p.emit("sync", {
    cubes: [...cubes, { id: "A2:F9", xy: null, link: "down", battPct: null }],
  });
  await expect(api.startPairing()).resolves.toBe(2); // 꺼진 A2:F9는 세지 않는다
  expect(store.get().pairing).toEqual({ total: 2, done: [] });

  // 빈 슬롯이 하나뿐이면 1
  store.change((s) => {
    for (const slot of [0, 1, 2, 3, 4] as const)
      s.cubes.push({
        slot,
        name: "ABCDE"[slot]!,
        mac4: `x${slot}`,
        link: "down",
        battPct: null,
        battLevel: "ok",
        state: "idle",
        mode: "window",
        xy: null,
        window: null,
        icon: "heart",
        ai: null,
        aiChoices: [],
      });
  });
  await expect(api.startPairing()).resolves.toBe(1);

  p.emit("sync", { cubes: [] });
  await expect(api.startPairing()).resolves.toBe(0);
  expect(store.get().pairing).toBeNull();
});

it("확인점 안에 올린 켜진 큐브만 등록하고, 이미 올려 둔 큐브는 시작하자마자 등록한다", async () => {
  const { store, api, pad } = setup();
  const p = fakeConn();
  pad.attach(p.conn);
  const [cx, cy] = PAD_CHECK.xy;
  p.emit("sync", {
    cubes: [{ ...cubes[0]!, xy: [cx, cy] }, cubes[1]!, { id: "A2:F9", xy: [cx, cy], link: "down", battPct: null }],
  });
  await api.startPairing();
  expect(store.get().cubes.map((c) => [c.name, c.mac4])).toEqual([["A", "A2:F0"]]);
  expect(store.get().pairing).toEqual({ total: 2, done: [0] });

  p.emit("cube", { id: "A2:F1", xy: [cx + PAD_CHECK.r + 5, cy] }); // 확인점 밖
  expect(store.get().cubes).toHaveLength(1);
  p.emit("cube", { id: "A2:F1", xy: [cx + PAD_CHECK.r - 5, cy] });
  expect(store.get().cubes.map((c) => [c.name, c.mac4, c.battLevel])).toEqual([
    ["A", "A2:F0", "ok"],
    ["B", "A2:F1", "low30"],
  ]);
  expect(store.get().pairing).toEqual({ total: 2, done: [0, 1] });
});

it("등록된 큐브를 다시 올려도 무시하고, 다 채운 뒤에는 더 등록하지 않는다", async () => {
  const { store, api, pad } = setup();
  const p = fakeConn();
  pad.attach(p.conn);
  p.emit("sync", { cubes: [cubes[0]!] });
  await api.startPairing();
  p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
  p.emit("cube", { id: "A2:F0", xy: null });
  p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
  expect(store.get().cubes).toHaveLength(1);

  p.emit("cube", { id: "A2:F7", xy: PAD_CHECK.xy }); // 새로 켜진 큐브
  expect(store.get().cubes).toHaveLength(1);
  expect(store.get().pairing).toEqual({ total: 1, done: [0] });
});

it("stopPairing · 패드 끊김이면 pairing이 없어지고 등록한 큐브는 남는다", async () => {
  const { store, api, pad } = setup();
  const p = fakeConn();
  pad.attach(p.conn);
  p.emit("sync", { cubes });
  await api.startPairing();
  p.emit("cube", { id: "A2:F0", xy: PAD_CHECK.xy });
  await api.stopPairing();
  expect(store.get().pairing).toBeNull();
  expect(store.get().cubes).toHaveLength(1);

  await api.startPairing();
  p.conn.close();
  expect(store.get().pairing).toBeNull();
});
```

`apps/core/test/server.test.ts`

- 22줄의 Side 리터럴에 `tryPair: () => {}`를 넣는다.

```ts
const api = createApi(store, {
  padCubes: () => [],
  tryPair: () => {},
  command: () => {},
  launch: () => {},
});
```

- 28줄의 `registerCube` 줄은 지워진 메서드를 쓰므로 바꾼다.

```ts
await expect(client.request("call", { method: "unregisterCube", args: [0] })).rejects.toThrow("슬롯 0에 큐브 없음");
```

- [ ] **Step 3: 테스트가 실패하는지 보기**

Run: `pnpm --dir apps/core test > $SCRATCH/core.txt 2>&1; tail -40 $SCRATCH/core.txt`
Expected: FAIL이 나와야 해요.

- `api.startPairing is not a function`이 나오거나, `pad.tryPair`가 없다는 TypeError가 나와요.
- 새 테스트와 `register`를 쓰는 기존 테스트가 실패해요.

- [ ] **Step 4: core 구현**

`apps/core/src/api.ts`

`Side`를 바꾼다.

```ts
export type Side = {
  padCubes(): PadCube[]; // 패드가 아는 큐브(등록 여부와 상관없이)
  tryPair(): void; // 장치 추가 중이면 확인점 위 미등록 큐브 하나를 등록한다(padLink)
  command(hwnd: string, cmd: WindowCommand): void;
  launch(app: string, slot: Slot): void; // 열린 창은 그 큐브에 묶인다
};
```

`registerCube() { … }` 메서드 전체(주석 포함)를 지우고 그 자리에 쓴다.

```ts
    // 장치 추가: 켜진 미등록 큐브를 빈 슬롯 수까지 센다. 0이면 시작하지 않는다.
    // 등록은 padLink가 확인점에 올린 순서대로 한다. 이미 올려 둔 큐브가 있으면 바로 등록된다
    startPairing() {
      const s0 = store.get();
      const n = side.padCubes().filter((x) => x.link === "up" && !s0.cubes.some((c) => c.mac4 === x.id)).length;
      const total = Math.min(n, 6 - s0.cubes.length);
      store.change((s) => (s.pairing = total ? { total, done: [] } : null));
      side.tryPair();
      return Promise.resolve(total);
    },
    stopPairing: () => done(() => store.change((s) => (s.pairing = null))),
```

- `battLevel` export는 padLink가 쓰므로 그대로 둔다.
- 이 파일에서 `Cube` · `Slot` 타입 import가 아직 쓰이는지 lint로 확인한다.

`apps/core/src/padLink.ts`

import를 바꾼다.

```ts
import { PAD_CHECK, type CubeSpaceApi, type PadCube, type PadToCore } from "@cubespace/protocol";
```

`update` 함수 아래에 넣는다.

```ts
// 장치 추가 중이면 확인점 안의 켜진 미등록 큐브 하나를 가장 앞 빈 슬롯에 등록한다. 이름은 슬롯 알파벳(0 = A … 5 = F)
function tryPair() {
  const s0 = store.get();
  const pr = s0.pairing;
  if (!pr || pr.done.length >= pr.total) return;
  const slot = ([0, 1, 2, 3, 4, 5] as const).find((i) => !s0.cubes.some((c) => c.slot === i));
  const [cx, cy] = PAD_CHECK.xy;
  const p = [...known.values()].find(
    (x) =>
      x.link === "up" &&
      x.xy &&
      Math.hypot(x.xy[0] - cx, x.xy[1] - cy) <= PAD_CHECK.r &&
      !s0.cubes.some((c) => c.mac4 === x.id),
  );
  if (slot === undefined || !p) return;
  store.change((s) => {
    s.cubes.push({
      slot,
      name: "ABCDEF"[slot]!,
      mac4: p.id,
      link: "up",
      battPct: p.battPct,
      battLevel: battLevel(p.battPct),
      state: "idle",
      mode: "window",
      xy: p.xy,
      window: null,
      icon: "heart",
      ai: null,
      aiChoices: [],
    });
    s.cubes.sort((a, b) => a.slot - b.slot);
    s.pairing!.done.push(slot);
  });
}
```

`attach` 안 `sync`와 `cube` 처리를 바꾼다.

```ts
        case "sync":
          known.clear();
          for (const p of e.payload.cubes) known.set(p.id, p);
          reflect();
          tryPair();
          break;
        case "cube":
          update(e.payload.id, { xy: e.payload.xy, link: "up" });
          tryPair();
          break;
```

`onClose`의 `store.change` 안, `s.pad.session = "lost";` 아래에 넣는다.

```ts
s.pairing = null; // 장치 추가는 멈춘다(등록한 큐브는 남는다)
```

돌려주는 값은 `return { attach, cubes: () => [...known.values()], tryPair };`로 바꾼다.

`apps/core/src/index.ts`: `createApi`의 Side에 `padCubes` 아래 한 줄을 넣는다.

```ts
    tryPair: () => pad.tryPair(),
```

- [ ] **Step 5: 테스트가 통과하는지 보기**

Run: `pnpm --dir apps/core test > $SCRATCH/core.txt 2>&1; tail -20 $SCRATCH/core.txt`
Expected: PASS. 전체 테스트가 통과해야 해요(기존 + 새 4개).

`apps/core`에 lint나 typecheck 스크립트가 있으면(`cat apps/core/package.json`) 그것도 돌려요.
Expected: 0 errors.

- [ ] **Step 6: 커밋**

```bash
git add packages/protocol/src apps/core/src apps/core/test
git commit -m "feat: 확인점에 올린 순서로 큐브 여러 개 등록(core startPairing·stopPairing, registerCube 제거)"
```

---

### Task 2: client — 새 등록 흐름 화면

**Files:**

- Modify
  - `apps/client/src/preload/index.ts:20`: `registerCube`를 `startPairing`과 `stopPairing`으로 바꿔요.
  - `apps/client/src/renderer/dev/fixtures.ts:270`: `OK` 끝에 `pairing: null`을 넣어요.
  - `apps/client/test/empty.test.tsx:24`: 스냅샷 리터럴에 `pairing: null`을 넣어요.
  - `apps/client/test/fakeApi.ts:150-174`: `registerCube`를 `startPairing`과 `stopPairing`으로 바꿔요.
  - `apps/client/src/renderer/model/settings.ts:13-20`: `PairPhase`, `pairPhase`, `pairStep`, `placeText`
  - `apps/client/src/renderer/hooks/usePairing.ts`: 전체를 바꿔요.
  - `apps/client/src/renderer/cube/PairPanel.tsx`: 단계별 body와 button을 바꿔요.
  - `apps/client/src/renderer/screens/PairingScreen.tsx:31`: 안내 문구
  - `apps/client/src/renderer/screens/settings/DeviceCard.tsx:40`: 안내 문구
- Test
  - `apps/client/test/settings.test.ts:4,11-16,35-46`
  - 새 파일 `apps/client/test/pairPanel.test.tsx`

**Interfaces:**

- Consumes(작업 1)
  - `Snapshot.pairing`
  - `CubeSpaceApi.startPairing(): Promise<number>`
  - `CubeSpaceApi.stopPairing(): Promise<void>`
- Produces(작업 3이 씀): 없음. 작업 3은 `PAD_CHECK`와 `Snapshot.pairing`만 써요.

- [ ] **Step 1: 컴파일 맞추기(테스트 대역 · 견본 · preload)**

`apps/client/src/renderer/dev/fixtures.ts`: `OK`의 `monitor: { no: 1, count: 2 },` 아래에 `pairing: null,`을 넣는다. `PAD_LOST`가 `OK`를 펼쳐 쓰면 따로 고칠 것은 없다. 펼쳐 쓰지 않으면 거기에도 넣는다.

`apps/client/test/empty.test.tsx`: `monitor: { no: 1, count: 0 },` 아래에 `pairing: null,`을 넣는다.

`apps/client/src/preload/index.ts`: `registerCube: true,` 자리에 쓴다.

```ts
  startPairing: true,
  stopPairing: true,
```

`apps/client/test/fakeApi.ts`: 주석과 `registerCube() { … }` 전체를 지우고 그 자리에 쓴다.

```ts
    // 장치 추가: 패드가 없으니 빈 슬롯 수만큼 센다. 등록(확인점에 올리기)은 테스트가 push로 흉내 낸다
    startPairing() {
      const total = 6 - current.cubes.length;
      push({ ...current, pairing: total ? { total, done: [] } : null });
      return Promise.resolve(total);
    },
    stopPairing() {
      push({ ...current, pairing: null });
      return Promise.resolve();
    },
```

- [ ] **Step 2: 모델 · 화면 테스트 쓰기**

`apps/client/test/settings.test.ts`

4줄 import를 바꾼다.

```ts
import {
  cubeLineText,
  freeSlot,
  pairPhase,
  pairStep,
  placeText,
  programList,
  STATUS_ICONS,
} from "../src/renderer/model/settings";
```

"단계: …" 테스트(11-16줄)를 바꾼다.

```ts
test("단계: 패드가 끊기면 0, 시작 전 · 찾은 큐브 없음은 1, 올리는 중 · 완료는 3", () => {
  expect(pairStep(PAD_LOST, "idle")).toBe(0);
  expect(pairStep(OK, "idle")).toBe(1);
  expect(pairStep(OK, "none")).toBe(1);
  expect(pairStep(OK, "place")).toBe(3);
  expect(pairStep(OK, "done")).toBe(3);
});

test("단계는 스냅샷 pairing에서: 없으면 idle(0개였으면 none), 덜 채웠으면 place, 다 채웠으면 done", () => {
  expect(pairPhase(OK, false)).toBe("idle");
  expect(pairPhase(OK, true)).toBe("none");
  expect(pairPhase({ ...OK, pairing: { total: 2, done: [4] } }, false)).toBe("place");
  expect(pairPhase({ ...OK, pairing: { total: 2, done: [4, 5] } }, false)).toBe("done");
});

test("올리는 중 안내: k는 지금 올릴 큐브 번째, 하나라도 등록했으면 그 글자", () => {
  expect(placeText({ total: 4, done: [] })).toBe("큐브 하나를 확인점에 올려 주세요 (1/4)");
  expect(placeText({ total: 4, done: [2] })).toBe("C로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/4)");
});
```

"가짜 API: 등록 해제하면…" 테스트(35-46줄)를 바꾼다.

```ts
test("가짜 API: 등록 해제하면 맡던 창은 담당 없음, 장치 추가는 빈 슬롯 수만큼 센다", async () => {
  const { api } = createFakeApi();
  await api.unregisterCube(0);
  let s = await api.getSnapshot();
  expect(s.cubes.some((c) => c.slot === 0)).toBe(false);
  expect(s.windows.some((w) => w.owner === "A")).toBe(false);
  expect(await api.startPairing()).toBe(1);
  expect((await api.getSnapshot()).pairing).toEqual({ total: 1, done: [] });
  await api.stopPairing();
  s = await api.getSnapshot();
  expect(s.pairing).toBeNull();
  await api.setRules({ backSec: 2 });
  expect((await api.getSnapshot()).settings.rules.backSec).toBe(2);
});
```

새 파일 `apps/client/test/pairPanel.test.tsx`

```tsx
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import type { Slot, Snapshot } from "@cubespace/protocol";
import { App } from "../src/renderer/App";
import { OK } from "../src/renderer/dev/fixtures";
import { createFakeApi } from "./fakeApi";

afterEach(cleanup);

// 슬롯 4 · 5가 빈 견본
const FREE2: Snapshot = { ...OK, cubes: OK.cubes.filter((c) => c.slot < 4) };

function renderAt(path: string, fake = createFakeApi(FREE2)) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App api={fake.api} />
    </MemoryRouter>,
  );
  return fake;
}

// core가 확인점 위 큐브를 등록한 것처럼 스냅샷을 바꾼다
async function registerAt(fake: ReturnType<typeof createFakeApi>, slot: Slot) {
  const s = structuredClone(await fake.api.getSnapshot());
  s.cubes.push({ ...OK.cubes.find((c) => c.slot === slot)! });
  s.cubes.sort((a, b) => a.slot - b.slot);
  s.pairing!.done.push(slot);
  act(() => fake.push(s));
}

test("설정: 시작하면 k/N 안내, 등록될 때마다 글자 · 토스트, 다 채우면 완료 뒤 처음으로", async () => {
  const fake = renderAt("/settings");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  expect(await screen.findByText("큐브 하나를 확인점에 올려 주세요 (1/2)")).toBeTruthy();

  await registerAt(fake, 4);
  expect(screen.getByText("E로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/2)")).toBeTruthy();
  expect(screen.getByText("큐브 E 등록 완료 · 슬롯 4")).toBeTruthy();

  await registerAt(fake, 5);
  expect(screen.getByText("큐브 2개 등록 완료")).toBeTruthy();
  await waitFor(() => expect(screen.getByRole("button", { name: /슬롯 6개가 모두 찼어요/ })).toBeTruthy(), {
    timeout: 2500,
  });
  expect((await fake.api.getSnapshot()).pairing).toBeNull();
});

test("그만하기를 누르면 stopPairing, 처음으로 돌아간다", async () => {
  const fake = renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  fireEvent.click(await screen.findByRole("button", { name: "그만하기" }));
  expect(await screen.findByRole("button", { name: "큐브 등록 시작" })).toBeTruthy();
  expect((await fake.api.getSnapshot()).pairing).toBeNull();
});

test("켜진 미등록 큐브가 없으면 안내 뒤 처음으로", async () => {
  const fake = createFakeApi(FREE2);
  vi.spyOn(fake.api, "startPairing").mockResolvedValue(0);
  renderAt("/", fake);
  fireEvent.click(await screen.findByRole("button", { name: "큐브 등록 시작" }));
  expect(await screen.findByText("찾은 큐브가 없어요")).toBeTruthy();
  expect(screen.getByText("등록할 큐브를 켜 주세요")).toBeTruthy();
  await waitFor(() => expect(screen.queryByText("찾은 큐브가 없어요")).toBeNull(), { timeout: 2500 });
});

test("다시 열면 지난 등록은 알리지 않고 진행 표시는 이어진다", async () => {
  const fake = createFakeApi({ ...FREE2, pairing: { total: 2, done: [] } });
  const s = structuredClone(await fake.api.getSnapshot());
  s.cubes.push({ ...OK.cubes.find((c) => c.slot === 4)! });
  s.pairing!.done.push(4);
  fake.push(s);
  renderAt("/settings", fake);
  expect(await screen.findByText("E로 등록했어요 · 내리고 다음 큐브를 올려 주세요 (2/2)")).toBeTruthy();
  expect(screen.queryByText("큐브 E 등록 완료 · 슬롯 4")).toBeNull();
});
```

- [ ] **Step 3: 테스트가 실패하는지 보기**

Run: `pnpm --dir apps/client test > $SCRATCH/client.txt 2>&1; tail -60 $SCRATCH/client.txt`
Expected: FAIL이 나와야 해요.

- settings.test는 `pairPhase is not a function` / `placeText is not a function`으로 실패해요.
- pairPanel.test는 "큐브 하나를 확인점에 올려 주세요 (1/2)"를 찾지 못해 실패해요(지금은 "근처 큐브를 찾는 중…"이 나와요).

- [ ] **Step 4: 모델 구현**

`apps/client/src/renderer/model/settings.ts`: 13-20줄(`// 장치 추가 단계` 주석부터 `pairStep` 끝까지)을 바꾼다.

```ts
// 장치 추가 단계: 패드 연결 → 큐브 등록 → 위치 확인. 등록은 확인점에 올린 순서대로 core가 한다(스냅샷 pairing)
export type PairPhase = "idle" | "place" | "done" | "none"; // none = 시작했지만 켜진 미등록 큐브가 없었다
export const PAIR_STEPS = ["패드 연결", "큐브 등록", "위치 확인"];
export function pairPhase(s: Snapshot, none: boolean): PairPhase {
  if (s.pairing) return s.pairing.done.length < s.pairing.total ? "place" : "done";
  return none ? "none" : "idle";
}
export function pairStep(s: Snapshot, phase: PairPhase): number {
  if (s.pad.session !== "up") return 0;
  return phase === "place" || phase === "done" ? 3 : 1;
}

// 올리는 중 안내. k = 지금 올릴 큐브 번째
export function placeText(p: NonNullable<Snapshot["pairing"]>): string {
  const k = `(${p.done.length + 1}/${p.total})`;
  const last = p.done[p.done.length - 1];
  return last === undefined
    ? `큐브 하나를 확인점에 올려 주세요 ${k}`
    : `${"ABCDEF"[last]}로 등록했어요 · 내리고 다음 큐브를 올려 주세요 ${k}`;
}
```

- [ ] **Step 5: usePairing · PairPanel 구현**

`apps/client/src/renderer/hooks/usePairing.ts` 전체:

```ts
import { useEffect, useRef, useState } from "react";
import type { CubeSpaceApi, Slot, Snapshot } from "@cubespace/protocol";
import { pairPhase } from "../model/settings";

// 장치 추가 흐름(시안 pairStart). 등록은 core가 한다: 시작하면 켜진 미등록 큐브를 세고,
// 확인점에 올린 순서대로 빈 슬롯에 등록한다(스냅샷 pairing). 완료 · 찾은 큐브 없음은 1.7초 뒤 처음으로 돌아간다.
export function usePairing(s: Snapshot, api: CubeSpaceApi, onRegistered: (slot: Slot) => void) {
  const [none, setNone] = useState(false);
  const phase = pairPhase(s, none);
  const done = s.pairing?.done;
  // 이미 알린 등록 수. 화면을 연 뒤 등록된 것만 알린다
  const seen = useRef(done?.length ?? 0);

  useEffect(() => {
    if (!done) {
      seen.current = 0;
      return;
    }
    for (const slot of done.slice(seen.current)) onRegistered(slot);
    seen.current = done.length;
  }, [done, onRegistered]);

  useEffect(() => {
    if (phase !== "none" && phase !== "done") return;
    const t = setTimeout(() => (phase === "none" ? setNone(false) : void api.stopPairing()), 1700);
    return () => clearTimeout(t);
  }, [phase, api]);

  return {
    phase,
    start: () => void api.startPairing().then((n) => setNone(n === 0)),
    stop: () => void api.stopPairing(),
  };
}
```

`apps/client/src/renderer/cube/PairPanel.tsx`

- import를 바꾼다. `regPixels`는 idle 슬롯 칸에서 계속 쓴다.

```ts
import { freeSlot, PAIR_STEPS, pairStep, placeText, regPixels, SLOTS } from "../model/settings";
```

- 위쪽 주석을 바꾼다.

```ts
// 장치 추가 흐름(시안 #devCard): 단계 막대 · 슬롯 6칸(또는 올리기 · 완료 안내) · 큰 버튼. 설정 · 페어링 화면이 같이 쓴다.
```

- `const pair = usePairing(api, onRegistered);`를 `const pair = usePairing(s, api, onRegistered);`로 바꾼다.
- `body` 객체에서 `scan` · `found` · `locate` · `done` 항목을 지우고, 이 셋을 넣는다. `idle` 항목은 그대로 둔다.

```tsx
    place: s.pairing && (
      <div className="pairmsg">
        <span className="hico warn">
          <Icon name="warn" size={26} stroke={2.2} />
        </span>
        <div>
          <b>{placeText(s.pairing)}</b>
          <small>확인점은 패드 가운데예요</small>
        </div>
      </div>
    ),
    done: (
      <div className="pairmsg">
        <span className="hico">
          <Icon name="ok" size={26} stroke={2.4} />
        </span>
        <div>
          <b>{`큐브 ${s.pairing?.total ?? 0}개 등록 완료`}</b>
          <small>이제 패드에서 사용할 수 있어요</small>
        </div>
      </div>
    ),
    none: (
      <div className="pairmsg">
        <span className="hico warn">
          <Icon name="warn" size={26} stroke={2.2} />
        </span>
        <div>
          <b>찾은 큐브가 없어요</b>
          <small>등록할 큐브를 켜 주세요</small>
        </div>
      </div>
    ),
```

- `button` 객체 전체를 바꾼다. idle과 none은 같은 시작 버튼을 써서 바로 다시 시도할 수 있게 한다.

```tsx
const startButton = (
  <Button variant="primary" wide disabled={slot === undefined || !padUp} onClick={pair.start}>
    {!padUp
      ? "패드를 먼저 연결해 주세요"
      : slot === undefined
        ? "슬롯 6개가 모두 찼어요 · 아래에서 등록을 해제하세요"
        : "큐브 등록 시작"}
  </Button>
);
const button = {
  idle: startButton,
  none: startButton,
  place: (
    <Button variant="primary" wide onClick={pair.stop}>
      그만하기
    </Button>
  ),
  done: (
    <Button variant="primary" wide disabled>
      등록 완료
    </Button>
  ),
}[pair.phase];
```

- `.radar` CSS는 `PadStep.tsx:56`도 쓰므로 지우지 않는다.

- [ ] **Step 6: 안내 문구 바꾸기**

`apps/client/src/renderer/screens/PairingScreen.tsx:31`: "등록할 큐브를 한 번에 하나씩 켜 주세요."를 "등록할 큐브를 모두 켜 주세요."로 바꾼다.

`apps/client/src/renderer/screens/settings/DeviceCard.tsx:40-41`: "등록할 큐브를 한 번에 하나씩 켜\n 주세요."를 "등록할 큐브를 모두 켜 주세요."로 바꾼다. 같은 줄의 `<b className="num">…</b>`는 그대로 둔다.

- [ ] **Step 7: 테스트 · 타입 · lint 통과 보기**

Run: `pnpm --dir apps/client test > $SCRATCH/client.txt 2>&1; tail -30 $SCRATCH/client.txt`
Expected: PASS. 전체가 통과해야 해요(App.test의 "설정: … 등록 해제는 한 번 더" 포함. 이 테스트는 "큐브 등록 시작" 버튼을 찾고, 그 버튼은 idle에 그대로 있어요).

Run: `pnpm --dir apps/client typecheck > $SCRATCH/tc.txt 2>&1; tail -20 $SCRATCH/tc.txt` (timeout 300 s)
Expected: 0 errors. `registerCube`를 남은 곳에서 쓰면 여기서 나와요.

Run: `pnpm --dir apps/client lint > $SCRATCH/lint.txt 2>&1; tail -20 $SCRATCH/lint.txt`
Expected: 0 problems

Run: `grep -rn "registerCube" apps packages --include=*.ts --include=*.tsx | grep -v node_modules | grep -v unregisterCube`
Expected: 아무것도 나오지 않아요.

- [ ] **Step 8: 커밋**

```bash
git add apps/client/src apps/client/test
git commit -m "feat: 장치 추가 화면을 확인점 순서 등록으로(k/N 안내·그만하기·완료·0개 안내)"
```

---

### Task 3: SW 임시 — 시뮬레이션 화면에서 미등록 큐브를 확인점에 올리기 (사용자 확인 필요)

**왜 필요한가**

- pad-sim 큐브(A2:F0~F3)는 처음에 모두 패드 밖이에요.
- 시뮬레이션 화면은 등록된 큐브만 그려서, SW에서는 미등록 큐브를 확인점에 올릴 방법이 없어요.
- 장치 추가 중(`pairing`이 있음)이고 sim이 있을 때만, 패드 카드에 미등록 pad-sim 큐브별 버튼을 보여 줘요.
- 기존 `sim.moveCube`만 써요. main · preload · pad-sim은 바꾸지 않아요.

**Files:**

- Modify
  - `apps/client/src/renderer/model/sim.ts`: `SIM_IDS`를 넣어요.
  - `apps/client/src/renderer/screens/SimScreen.tsx`: 패드 카드 슬롯 칸 아래에 버튼 줄을 넣어요.
  - `apps/client/src/renderer/screens/SimScreen.css`: `.simpair`
- Test: `apps/client/test/simScreen.test.tsx`

**Interfaces:**

- Consumes
  - `PAD_CHECK`와 `Snapshot.pairing`(작업 1)
  - `SimApi.moveCube(id, xy)`(이미 있어요)

- [ ] **Step 1: 실패하는 테스트 쓰기**

`apps/client/test/simScreen.test.tsx` 끝에 넣는다. import에 `PAD_CHECK`를 더한다(`import { PAD_CHECK, type SimApi } from "@cubespace/protocol";`).

```tsx
test("장치 추가 중이면 미등록 pad-sim 큐브를 확인점에 올리는 버튼", async () => {
  const sim = mockSim();
  renderSim(sim, { ...OK, pairing: { total: 1, done: [] } });
  fireEvent.click(await screen.findByRole("button", { name: "A2:F0 확인점에" }));
  expect(sim.moveCube).toHaveBeenCalledWith("A2:F0", PAD_CHECK.xy);
});

test("장치 추가 중이 아니면 확인점 버튼이 없다", async () => {
  renderSim(mockSim());
  await screen.findByRole("heading", { level: 1, name: "시뮬레이션" });
  expect(screen.queryByRole("button", { name: /확인점에$/ })).toBeNull();
});
```

- [ ] **Step 2: 실패 보기**

Run: `pnpm --dir apps/client test simScreen > $SCRATCH/sim.txt 2>&1; tail -30 $SCRATCH/sim.txt`
Expected: 첫 테스트가 FAIL이에요(`Unable to find role="button" and name "A2:F0 확인점에"`). 두 번째는 PASS예요.

- [ ] **Step 3: 구현**

`apps/client/src/renderer/model/sim.ts` 끝:

```ts
// HW 통합 후 제거: pad-sim 큐브 id(apps/pad-sim/src/sim.ts와 같다). 미등록 큐브는 패드 그림에 없어 버튼으로 확인점에 올린다
export const SIM_IDS = ["A2:F0", "A2:F1", "A2:F2", "A2:F3"];
```

`apps/client/src/renderer/screens/SimScreen.tsx`

- import 줄에 넣는다.
  - `import { PAD_CHECK } from "@cubespace/protocol";`
  - `../model/sim`에서 `SIM_IDS`
- `.tray` div 닫는 태그(`</div>`, 189줄) 바로 아래, `</Card>` 위에 넣는다.

```tsx
{
  /* HW 통합 후 제거: 장치 추가 중 미등록 pad-sim 큐브를 확인점(패드 가운데)에 올린다 */
}
{
  live && s.pairing && (
    <div className="simpair">
      {SIM_IDS.filter((id) => !s.cubes.some((c) => c.mac4 === id)).map((id) => (
        <Button key={id} size="sm" onClick={() => run(sim!.moveCube(id, PAD_CHECK.xy))}>
          {id} 확인점에
        </Button>
      ))}
    </div>
  );
}
```

`apps/client/src/renderer/screens/SimScreen.css` 끝:

```css
/* HW 통합 후 제거: 장치 추가 중 확인점 버튼 줄 */
.simpair {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
```

- [ ] **Step 4: 통과 보기**

Run: `pnpm --dir apps/client test > $SCRATCH/client.txt 2>&1; tail -20 $SCRATCH/client.txt`
Expected: PASS(전체)

Run: `pnpm --dir apps/client typecheck` (timeout 300 s)과 `pnpm --dir apps/client lint`
Expected: 0

- [ ] **Step 5: 커밋**

```bash
git add apps/client/src/renderer/model/sim.ts apps/client/src/renderer/screens/SimScreen.tsx apps/client/src/renderer/screens/SimScreen.css apps/client/test/simScreen.test.tsx
git commit -m "feat: 시뮬레이션 화면에서 장치 추가 중 미등록 큐브를 확인점에 올리는 임시 버튼"
```

---

## 손으로 확인(SW, Electron)

1. 설정 → 장치 추가에서 "큐브 등록 시작"을 눌러요. "큐브 하나를 확인점에 올려 주세요 (1/4)"가 나와야 해요(pad-sim 큐브 4개).
2. 시뮬레이션 화면에서 "A2:F0 확인점에"를 눌러요. 큐브 A가 패드 가운데에 생겨야 해요.
3. 설정으로 돌아가면 "A로 등록했어요 · … (2/4)"가 나와야 해요.
4. 나머지를 올려요. "큐브 4개 등록 완료"가 나오고 1.7초 뒤 슬롯 칸으로 돌아가야 해요.
5. 등록 중에 시뮬레이션의 "패드 끊김"을 눌러요. 장치 추가가 처음으로 돌아가야 해요.
