# 패드에 열린 창 영역 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 · 시뮬레이션 패드 그림에, 대상 모니터에 열린 창의 실제 위치 · 크기(모니터 작업 영역 비율)를 LED 테두리로 보여 준다. 큐브가 없어도 보인다.

**Architecture:** win-driver(C#)가 창마다 모니터 번호 · 작업 영역 비율 `rect` · 위에서부터 순서 `z`를 계산해 `WinInfo`에 싣고, 끌기 끝 · 최소화 · 앞으로 옴 · 끌기 밖 이동 때 `windowsChanged`(전체 목록)를 보낸다. core는 이를 `AppWindow`에 옮긴다. client `homeView().leds`가 칸(24 × 16)마다 가장 위 창을 주인으로 정해 주인 테두리만 켠다.

**Tech Stack:** TypeScript(pnpm 모노레포, vitest), React(Electron), C# .NET 8(Win32 P/Invoke)

**Spec:** `apps/client/docs/specs/2026-10-14-window-regions-design.md`

## Global Constraints

- 비출 창: `monitor === s.monitor.no`, 최소화 제외.
- 색 · 밝기: 창 모드 큐브가 맡은 창 = `REGION[layout 순서]`, `EDGE[맡은 창 수]`. 나머지 = `NEUTRAL`, 0.2.
- 칸 주인 = 그 칸을 덮는 창 중 `z` 최소. 주인 테두리 칸만 켠다.
- 반올림해 0칸이 되는 창도 최소 1칸(가로 · 세로 각각).
- 갱신: 끌기 끝 · 최소화/복원 · 앞으로 옴 · 끌기 밖 `LOCATIONCHANGE`. 끄는 중(MOVESIZESTART ~ END) `LOCATIONCHANGE`는 무시. 100 ms 모아 한 번.
- core는 `windowsChanged`에서 큐브 묶음(`cube.window`) · `owner`를 건드리지 않는다.
- 실제 패드 LED · 모니터 꽂고 빼기 · 끄는 중 실시간은 범위 밖.
- 사용자 규칙: 커밋은 사용자가 요청할 때만. 각 작업 끝에 한 줄 커밋 명령(한글 메시지, `feat:`/`fix:` 접두사)만 제시한다.

## Review Focus

1. **화면 밖으로 삐져나간 창**(rect가 0 미만 · 1 초과): 잘린 테두리만 켜지고, 패드 밖 칸 번호(음수 · 384 이상)가 나오지 않는다. → 작업 2 "삐져나간 창은 잘라서" 테스트
2. **대상 모니터를 바꿈**(`s.monitor.no` 1 → 2): driver 알림 없이 바로 2번 모니터 창으로 바뀐다. → 작업 2 "대상 모니터의 창만" 테스트
3. **다시 열 수 있음 · 없음(relaunchable · gone) 창에 예전 rect가 남음**: 실제 창이 없으니 그리지 않는다. → 작업 2 "없는 창은 그리지 않는다" 테스트
4. **응답 없음 · 제외(noResponse · excluded) 창이 windowsChanged에 옴**: 위치는 바뀌되 상태는 그대로다. → 작업 1 "상태 덮지 않음" 테스트
5. **작업 영역 밖에만 있는 창**(잘랐더니 넓이 0): LED를 켜지 않는다(1칸 최소는 작업 영역 안에 걸친 창에만). → 작업 2 "삐져나간 창은 잘라서" 테스트

---

### Task 1: protocol · core — 창 위치 · 순서 받기

**Files:**

- Modify: `packages/protocol/src/win.ts` (`WinInfo`, `WinToCore`)
- Modify: `packages/protocol/src/snapshot.ts` (`AppWindow`)
- Modify: `packages/protocol/fixtures/win/windowOpened.json`, `packages/protocol/fixtures/win/listWindows.result.json`
- Create: `packages/protocol/fixtures/win/windowsChanged.json`
- Modify: `packages/protocol/test/fixtures.test.ts` (`TYPES.win`)
- Modify: `apps/core/src/winLink.ts` (`toWindow`, `windowsChanged` 처리)
- Test: `apps/core/test/core.test.ts`

**Interfaces:**

- Produces:
  - `WinInfo = { hwnd: string; exe: string; title: string; minimized: boolean; monitor: number; rect: [number, number, number, number]; z: number }`
  - `WinToCore`에 `Envelope<"windowsChanged", WinInfo[]>`
  - `AppWindow`에 `monitor?: number; rect?: [number, number, number, number]; z?: number` — 선택 값. 다시 열 수 있음 · 없음 창이나 driver 없이 만든 창(가짜 API)은 위치를 모른다.

- [ ] **Step 1: 실패하는 core 테스트 쓰기** — `apps/core/test/core.test.ts`의 `describe("core")` 안, "창 목록을 받고…" 테스트 뒤에 넣는다.

```ts
it("windowsChanged가 오면 창 위치 · 순서 · 최소화가 바뀌고, 새 창은 더하고, 큐브 묶음은 그대로", async () => {
  const { store, api, pad, win } = setup();
  const p = fakeConn();
  pad.attach(p.conn);
  p.emit("sync", { cubes });
  await register(api, p, ["A2:F0"]);
  const w = fakeConn((type) =>
    type === "listMonitors"
      ? [{ no: 1, primary: true, work: [0, 0, 1920, 1040] }]
      : type === "listWindows"
        ? [
            {
              hwnd: "11",
              exe: "code.exe",
              title: "a",
              minimized: false,
              monitor: 1,
              rect: [0, 0, 1, 1],
              z: 0,
            },
          ]
        : [],
  );
  await win.attach(w.conn);
  expect(store.get().windows[0]).toMatchObject({
    monitor: 1,
    rect: [0, 0, 1, 1],
    z: 0,
  });
  await api.assignWindow(0, "11");

  w.emit("windowsChanged", [
    {
      hwnd: "22",
      exe: "notepad.exe",
      title: "b",
      minimized: false,
      monitor: 2,
      rect: [0, 0, 0.5, 0.5],
      z: 0,
    },
    {
      hwnd: "11",
      exe: "code.exe",
      title: "a",
      minimized: true,
      monitor: 1,
      rect: [0.1, 0.2, 0.6, 0.9],
      z: 1,
    },
  ]);
  const s = store.get();
  expect(s.windows.find((x) => x.id === "11")).toMatchObject({
    rect: [0.1, 0.2, 0.6, 0.9],
    z: 1,
    monitor: 1,
    status: "minimized",
    owner: "A",
  });
  expect(s.windows.find((x) => x.id === "22")).toMatchObject({
    app: "메모장",
    monitor: 2,
    z: 0,
    status: "linked",
  });
  expect(s.cubes[0]!.window).toBe("11");
});

it("windowsChanged는 응답 없음 · 제외 창의 상태를 덮지 않는다", async () => {
  const { store, win } = setup();
  const w = fakeConn((type) =>
    type === "listMonitors" || type === "listWindows" ? [] : null,
  );
  await win.attach(w.conn);
  store.change((s) =>
    s.windows.push({
      id: "11",
      app: "작업 관리자",
      title: "",
      owner: null,
      status: "excluded",
    }),
  );
  w.emit("windowsChanged", [
    {
      hwnd: "11",
      exe: "",
      title: "",
      minimized: false,
      monitor: 1,
      rect: [0, 0, 1, 1],
      z: 0,
    },
  ]);
  expect(store.get().windows[0]).toMatchObject({
    status: "excluded",
    rect: [0, 0, 1, 1],
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir apps/core test`
Expected: 새 테스트 2개 FAIL(`monitor` · `rect` 없음, 22 창 없음). 기존 11개는 PASS.

- [ ] **Step 3: protocol 타입**

`packages/protocol/src/win.ts`의 `WinInfo`를 바꾼다.

```ts
export type WinInfo = {
  hwnd: string; // 창 핸들(10진수 문자열)
  exe: string; // 실행 파일 이름(소문자, 예: notepad.exe)
  title: string;
  minimized: boolean;
  monitor: number; // 창 가운데가 있는 모니터(listMonitors 번호, 1부터)
  rect: [number, number, number, number]; // 그 모니터 작업 영역 비율 [x0, y0, x1, y1], 보이는 틀 기준. 0~1 밖일 수 있다
  z: number; // 위에서부터 순서, 0이 가장 위
};
```

`WinToCore`에 한 줄 더한다.

```ts
  | Envelope<"windowClosed", { hwnd: string }>
  | Envelope<"windowsChanged", WinInfo[]>; // 끌기 끝 · 최소화 · 앞으로 옴 · 이동 뒤 전체 목록
```

`packages/protocol/src/snapshot.ts`의 `AppWindow`에 더한다(`top?` 다음).

```ts
  monitor?: number; // 창이 있는 모니터. 위치를 모르면 없다
  rect?: [number, number, number, number]; // 그 모니터 작업 영역 비율 [x0, y0, x1, y1]
  z?: number; // 위에서부터 순서, 0이 가장 위
```

- [ ] **Step 4: 견본**

`windowOpened.json` 한 줄 전체:

```json
{
  "v": 1,
  "type": "windowOpened",
  "ts": 1760400000000,
  "payload": {
    "hwnd": "132470",
    "exe": "mspaint.exe",
    "title": "제목 없음 - 그림판",
    "minimized": false,
    "monitor": 1,
    "rect": [0.1, 0.1, 0.6, 0.7],
    "z": 0
  }
}
```

`listWindows.result.json` 한 줄 전체:

```json
{
  "v": 1,
  "type": "result",
  "id": "r1",
  "ts": 1760400000001,
  "payload": {
    "ok": true,
    "value": [
      {
        "hwnd": "132456",
        "exe": "notepad.exe",
        "title": "제목 없음 - 메모장",
        "minimized": false,
        "monitor": 1,
        "rect": [0, 0, 0.5, 1],
        "z": 0
      }
    ]
  }
}
```

새 `windowsChanged.json`:

```json
{
  "v": 1,
  "type": "windowsChanged",
  "ts": 1760400000002,
  "payload": [
    {
      "hwnd": "132456",
      "exe": "notepad.exe",
      "title": "제목 없음 - 메모장",
      "minimized": false,
      "monitor": 1,
      "rect": [0.5, 0, 1, 1],
      "z": 0
    },
    {
      "hwnd": "132470",
      "exe": "mspaint.exe",
      "title": "제목 없음 - 그림판",
      "minimized": true,
      "monitor": 1,
      "rect": [0, 0, 0.5, 1],
      "z": 1
    }
  ]
}
```

`packages/protocol/test/fixtures.test.ts`의 `TYPES.win` 끝에 `"windowsChanged"`를 더한다.

- [ ] **Step 5: core 구현** — `apps/core/src/winLink.ts`

`toWindow`:

```ts
const toWindow = (s: Snapshot, w: WinInfo): AppWindow => ({
  id: w.hwnd,
  app: appOf(w.exe),
  title: w.title,
  owner: s.cubes.find((c) => c.window === w.hwnd)?.name ?? null,
  status: w.minimized ? "minimized" : "linked",
  monitor: w.monitor,
  rect: w.rect,
  z: w.z,
});
```

`c.onMessage` 안, `windowClosed` 처리 뒤에:

```ts
// 위치 · 순서 · 최소화만 바꾼다. 묶음 · owner는 그대로, 응답 없음 · 제외 상태도 그대로
if (e.type === "windowsChanged")
  store.change((s) => {
    for (const w of e.payload) {
      const cur = s.windows.find((x) => x.id === w.hwnd);
      if (!cur) {
        s.windows.push(toWindow(s, w));
        continue;
      }
      Object.assign(cur, { monitor: w.monitor, rect: w.rect, z: w.z });
      if (cur.status === "linked" || cur.status === "minimized")
        cur.status = w.minimized ? "minimized" : "linked";
    }
  });
```

- [ ] **Step 6: 통과 확인**

Run: `pnpm --dir apps/core test && pnpm --dir packages/protocol test && pnpm --dir apps/core typecheck && pnpm --dir packages/protocol typecheck`
Expected: core 13/13, protocol 전부 PASS(windowsChanged.json 포함), typecheck 0.

- [ ] **Step 7: 커밋 명령 제시**

```
git add packages/protocol apps/core/src/winLink.ts apps/core/test/core.test.ts
git commit -m "feat: 창 위치·순서를 받아 상태에 넣기(windowsChanged, AppWindow monitor·rect·z)"
```

---

### Task 2: client — 패드에 창 테두리

**Files:**

- Modify: `apps/client/src/renderer/model/home.ts` (`homeView().leds`, 새 `windowLeds`)
- Modify: `apps/client/src/renderer/dev/fixtures.ts` (`OK.windows` w1 · w2 · w3에 위치)
- Test: `apps/client/test/home.test.ts`

**Interfaces:**

- Consumes: 작업 1 `AppWindow.monitor?` · `rect?` · `z?`
- Produces: `homeView(s).leds: PadLed[]` (시뮬레이션 `simLeds`가 그대로 씀)

- [ ] **Step 1: 실패하는 테스트 쓰기**

`apps/client/test/home.test.ts`에서 기존 "패드 LED는 창 모드 큐브가 맡은 창(w1, 왼쪽 반)의 테두리만" 테스트를 아래로 바꾸고, 새 테스트를 더한다. 맨 위 import에 `import type { AppWindow, Snapshot } from "@cubespace/protocol";`, `import { NEUTRAL } from "../src/renderer/model/home";`(기존 homeView import에 합침), `import { PAD_COLS } from "../src/renderer/cube/led";`(기존 OFF import에 합침)를 더한다.

```ts
test("패드 LED: 맡은 창(w1, 왼쪽 반)은 영역 색, 나머지 열린 창(w2 · w3)은 회색", () => {
  const w1 = v.leds.filter((l) => l.color === "rgb(18 181 214)");
  expect(w1.length).toBe(2 * 12 + 2 * 14); // 12 × 16 칸의 바깥 한 줄
  expect(v.leds.filter((l) => l.color === NEUTRAL).length).toBe(
    2 * (2 * 12 + 2 * 6),
  ); // 12 × 8 두 개
  expect(
    v.leds.filter((l) => l.color === NEUTRAL).every((l) => l.b === 0.2),
  ).toBe(true);
});

// 큐브 없이 창만 있는 스냅샷
const win = (
  id: string,
  rect: AppWindow["rect"],
  z: number,
  more: Partial<AppWindow> = {},
): AppWindow => ({
  id,
  app: "메모장",
  title: "",
  owner: null,
  status: "linked",
  monitor: 1,
  rect,
  z,
  ...more,
});
const only = (windows: AppWindow[], no = 1): Snapshot => ({
  ...OK,
  cubes: [],
  layout: [],
  windows,
  monitor: { no, count: 2 },
});
const cells = (s: Snapshot) =>
  homeView(s)
    .leds.map((l) => l.i)
    .sort((a, b) => a - b);

test("큐브가 없어도 창 테두리가 켜진다", () => {
  // 6 × 4 칸(x 0~5, y 0~3)의 바깥 한 줄
  expect(cells(only([win("a", [0, 0, 0.25, 0.25], 0)]))).toEqual([
    0, 1, 2, 3, 4, 5, 24, 29, 48, 53, 72, 73, 74, 75, 76, 77,
  ]);
});

test("대상 모니터의 창만, 최소화 · 없는 창은 그리지 않는다", () => {
  const ws = [
    win("m2", [0, 0, 1, 1], 0, { monitor: 2 }),
    win("min", [0, 0, 1, 1], 1, { status: "minimized" }),
    win("gone", [0, 0, 1, 1], 2, { status: "gone" }),
    win("re", [0, 0, 1, 1], 3, { status: "relaunchable" }),
    win("nopos", undefined, 4),
  ];
  expect(cells(only(ws))).toEqual([]);
  expect(cells(only(ws, 2)).length).toBe(2 * 24 + 2 * 14); // 2번 모니터로 바꾸면 m2가 패드 전체
});

test("위 창에 가려진 아래 창 테두리는 꺼진다", () => {
  // 위(z 0): 왼쪽 반, 아래(z 1): 전체 → 아래 창의 왼쪽 반 테두리는 꺼지고 오른쪽 반만 남는다
  const s = only([
    win("top", [0, 0, 0.5, 1], 0),
    win("under", [0, 0, 1, 1], 1, { app: "Edge" }),
  ]);
  const leds = homeView(s).leds;
  expect(leds.length).toBe(new Set(leds.map((l) => l.i)).size); // 한 칸에 하나
  const top = 2 * 12 + 2 * 14;
  const under = 12 + 12 + 14; // 오른쪽 반의 위 · 아래 줄 12칸씩 + 오른쪽 세로 14칸
  expect(leds.length).toBe(top + under);
  expect(leds.some((l) => l.i === 0 * PAD_COLS + 0)).toBe(true); // 모서리는 위 창 것
});

test("작은 창도 최소 1칸, 삐져나간 창은 잘라서, 작업 영역 밖 창은 없다", () => {
  expect(cells(only([win("tiny", [0.5, 0.5, 0.51, 0.51], 0)]))).toEqual([
    8 * PAD_COLS + 12,
  ]);
  const out = cells(only([win("edge", [0.75, -0.5, 1.5, 0.25], 0)]));
  expect(out.every((i) => i >= 0 && i < 24 * 16)).toBe(true);
  expect(out.length).toBe(2 * 6 + 2 * 2); // 오른쪽 위 6 × 4 칸
  expect(cells(only([win("away", [1.1, 0, 1.6, 0.5], 0)]))).toEqual([]);
});
```

`OK` 견본의 w1 · w2 · w3에 위치를 넣는다(`apps/client/src/renderer/dev/fixtures.ts`, `layout`과 같은 자리).

```ts
    { id: "w1", app: "VS Code", title: "cube-space", owner: "A", status: "linked", monitor: 1, rect: [0, 0, 0.5, 1], z: 0 },
    { id: "w2", app: "Edge", title: "데이터시트", owner: "B", status: "linked", monitor: 1, rect: [0.5, 0, 1, 0.5], z: 1 },
    { id: "w3", app: "메모장", title: "todo.txt", owner: "C", status: "linked", monitor: 1, rect: [0.5, 0.5, 1, 1], z: 2 },
```

(기존 여러 줄 객체 모양을 지키며 세 필드만 더한다.)

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir apps/client test test/home.test.ts`
Expected: 새 · 바꾼 테스트 FAIL(회색 칸 0개, 큐브 없으면 LED 0개). 나머지 PASS.

- [ ] **Step 3: 구현** — `apps/client/src/renderer/model/home.ts`

`../cube/led` import에 `PAD_COLS`, `PAD_ROWS`를 더한다. `homeView` 위에 넣는다.

```ts
// 창이 실제로 있는 곳(대상 모니터 작업 영역 비율)을 패드 LED 테두리로. 큐브가 없어도 켠다.
// 칸마다 그 칸을 덮는 가장 위(z 최소) 창이 주인이고, 주인 테두리일 때만 켠다. 맡은 창은 영역 색, 나머지는 회색 어둡게.
function windowLeds(s: Snapshot, lit: Placement[]): PadLed[] {
  const clip = (v: number) => Math.min(1, Math.max(0, v));
  const gone: AppWindow["status"][] = ["minimized", "relaunchable", "gone"];
  const boxes = s.windows
    .filter(
      (w) => w.rect && w.monitor === s.monitor.no && !gone.includes(w.status),
    )
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
    .flatMap((w) => {
      const [rx0, ry0, rx1, ry1] = w.rect!.map(clip) as [
        number,
        number,
        number,
        number,
      ];
      if (rx1 <= rx0 || ry1 <= ry0) return []; // 작업 영역 밖
      const x0 = Math.min(Math.round(rx0 * PAD_COLS), PAD_COLS - 1);
      const y0 = Math.min(Math.round(ry0 * PAD_ROWS), PAD_ROWS - 1);
      const x1 = Math.max(Math.round(rx1 * PAD_COLS), x0 + 1); // 작은 창도 1칸
      const y1 = Math.max(Math.round(ry1 * PAD_ROWS), y0 + 1);
      const p = lit.find((q) => q.window === w.id);
      const color = p ? REGION[s.layout.indexOf(p)]! : NEUTRAL;
      const b = p ? (EDGE[lit.length] ?? 0.4) : 0.2;
      return [{ x0, y0, x1, y1, color, b }];
    });
  const out: PadLed[] = [];
  for (let y = 0; y < PAD_ROWS; y++)
    for (let x = 0; x < PAD_COLS; x++) {
      const o = boxes.find(
        (r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1,
      );
      if (o && (x === o.x0 || x === o.x1 - 1 || y === o.y0 || y === o.y1 - 1))
        out.push({ i: y * PAD_COLS + x, color: o.color, b: o.b });
    }
  return out;
}
```

`Placement`를 protocol type import에 더한다. `homeView`의 주석 "패드는 창 모드 큐브가 맡은 창의 영역만 테두리를 켠다"를 "창 모드 큐브가 맡은 창(영역 색으로 켤 창)"으로 고치고, 반환의 `leds: lit.flatMap(...)`을 `leds: windowLeds(s, lit),`로 바꾼다. `outlineLeds`를 home.ts에서 더 안 쓰면 import에서 뺀다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm --dir apps/client test > /tmp/c.log 2>&1; grep -E "×|Tests " /tmp/c.log; pnpm --dir apps/client typecheck; pnpm --dir apps/client lint`
Expected: 전부 PASS(시뮬레이션 · 홈 화면 테스트 포함), typecheck 0, lint 0.

- [ ] **Step 5: 커밋 명령 제시**

```
git add apps/client/src/renderer/model/home.ts apps/client/src/renderer/dev/fixtures.ts apps/client/test/home.test.ts
git commit -m "feat: 홈·시뮬레이션 패드에 대상 모니터의 열린 창 영역을 LED 테두리로(큐브 없어도)"
```

---

### Task 3: win-driver — 창 위치 · 순서 계산과 변경 알림

**Files:**

- Modify: `drivers/win-driver/Native.cs` (상수 · `MonitorFromWindow`)
- Modify: `drivers/win-driver/Windows.cs` (`WinInfo`, `List`, `Info`, `Place`)
- Modify: `drivers/win-driver/Watcher.cs` (알림 · 100 ms 모으기)
- Modify: `drivers/win-driver/Program.cs` (`Watcher.Run` 인자, `CheckFixtures`)

**Interfaces:**

- Consumes: 작업 1 견본 · `WinInfo` 모양(`monitor`, `rect`, `z`; JSON Web 기본값이라 C# `Monitor` · `Rect` · `Z`가 camelCase로 나간다)
- Produces: `windowsChanged` 메시지(작업 1 core가 받음)

자동 테스트가 없다. 검증은 견본 읽기(`--check-fixtures`) · 빌드 · Windows에서 손으로.

- [ ] **Step 1: 견본 읽기가 실패하는지 확인**

Run: `cd /mnt/d/git/CubeSpaceMain && dotnet.exe run --project drivers/win-driver -c Release -- --check-fixtures packages/protocol/fixtures/win`
Expected: `FAIL windowsChanged.json: 모르는 type: windowsChanged`, 종료 코드 1.

- [ ] **Step 2: Native.cs**

`GetMonitorInfo` 선언 아래:

```csharp
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);
```

상수 끝(`OBJID_WINDOW` 위)에:

```csharp
    public const uint MONITOR_DEFAULTTONEAREST = 2;
    public const uint EVENT_SYSTEM_FOREGROUND = 0x0003;
    public const uint EVENT_SYSTEM_MOVESIZESTART = 0x000A;
    public const uint EVENT_SYSTEM_MOVESIZEEND = 0x000B;
    public const uint EVENT_SYSTEM_MINIMIZESTART = 0x0016;
    public const uint EVENT_SYSTEM_MINIMIZEEND = 0x0017;
    public const uint EVENT_OBJECT_LOCATIONCHANGE = 0x800B;
```

- [ ] **Step 3: Windows.cs**

```csharp
public sealed record WinInfo(string Hwnd, string Exe, string Title, bool Minimized, int Monitor, double[] Rect, int Z);
```

`List` · `Info`를 바꾸고 `Place`를 더한다(`using System.Runtime.InteropServices;`를 맨 위에 더한다).

```csharp
    // EnumWindows는 위에서부터 돈다. 그 순서가 z
    public static List<WinInfo> List()
    {
        var mons = Monitors();
        var list = new List<WinInfo>();
        EnumWindows((hwnd, _) =>
        {
            if (IsUserWindow(hwnd)) list.Add(Info(hwnd, list.Count, mons));
            return true;
        }, IntPtr.Zero);
        return list;
    }

    // 막 열린 창 하나: 보통 맨 앞이라 z 0. 이어지는 windowsChanged가 바로잡는다
    public static WinInfo Info(IntPtr hwnd) => Info(hwnd, 0, Monitors());

    static WinInfo Info(IntPtr hwnd, int z, List<MonitorInfo> mons)
    {
        var (no, rect) = Place(hwnd, mons);
        return new(hwnd.ToInt64().ToString(), ExeOf(hwnd), Title(hwnd), IsIconic(hwnd), no, rect, z);
    }

    // 창 가운데가 있는 모니터 번호와, 그 작업 영역에 대한 보이는 틀 비율 [x0, y0, x1, y1]
    static (int, double[]) Place(IntPtr hwnd, List<MonitorInfo> mons)
    {
        if (mons.Count == 0) return (0, [0, 0, 0, 0]);
        if (DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, out RECT r, Marshal.SizeOf<RECT>()) != 0) GetWindowRect(hwnd, out r);
        var info = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
        GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), ref info);
        var m = mons.FirstOrDefault(x => x.Work[0] == info.rcWork.Left && x.Work[1] == info.rcWork.Top)
            ?? mons.FirstOrDefault(x => x.Primary) ?? mons[0];
        double w = m.Work[2], h = m.Work[3];
        return (m.No, [(r.Left - m.Work[0]) / w, (r.Top - m.Work[1]) / h, (r.Right - m.Work[0]) / w, (r.Bottom - m.Work[1]) / h]);
    }
```

- [ ] **Step 4: Watcher.cs**

필드 추가:

```csharp
    static bool sizing; // 끄는 중(MOVESIZESTART ~ END). 훅 스레드에서만 읽고 쓴다
    static Timer? later;
```

`Run` 시그니처와 본문:

```csharp
    // changed: 창 위치 · 순서 · 최소화가 바뀌면 100 ms 모았다가 전체 목록
    public static void Run(Action<WinInfo> opened, Action<string> closed, Action<List<WinInfo>> changed)
    {
        Know(Windows.List());
        void Soon()
        {
            later ??= new Timer(_ => changed(Windows.List()));
            later.Change(100, Timeout.Infinite);
        }
        proc = (_, ev, hwnd, idObject, idChild, _, _) =>
        {
            if (idObject != OBJID_WINDOW || idChild != 0 || hwnd == IntPtr.Zero) return;
            switch (ev)
            {
                case EVENT_SYSTEM_MOVESIZESTART: sizing = true; return;
                case EVENT_SYSTEM_MOVESIZEEND: sizing = false; Soon(); return;
                case EVENT_SYSTEM_FOREGROUND or EVENT_SYSTEM_MINIMIZESTART or EVENT_SYSTEM_MINIMIZEEND: Soon(); return;
                // 최대화 · Win+화살표 · applyLayout. 끄는 중이면 놓을 때 보낸다
                case EVENT_OBJECT_LOCATIONCHANGE:
                    if (!sizing && Windows.IsUserWindow(hwnd)) Soon();
                    return;
            }
            lock (known)
            {
                // (기존 DESTROY · SHOW · NAMECHANGE 처리 그대로)
            }
        };
        uint flags = WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS;
        SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_SHOW, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_OBJECT_NAMECHANGE, EVENT_OBJECT_NAMECHANGE, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_SYSTEM_MOVESIZESTART, EVENT_SYSTEM_MOVESIZEEND, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_SYSTEM_MINIMIZESTART, EVENT_SYSTEM_MINIMIZEEND, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE, EVENT_OBJECT_LOCATIONCHANGE, IntPtr.Zero, proc, 0, 0, flags);
        // (기존 메시지 루프 그대로)
    }
```

`lock (known)` 블록과 메시지 루프는 지금 코드를 그대로 둔다(위 주석 자리). 클래스 주석을 "창이 열리고 닫히고 옮겨지는 것을 지켜본다"로 고친다.

- [ ] **Step 5: Program.cs**

```csharp
Watcher.Run(w => Send("windowOpened", w), hwnd => Send("windowClosed", new { hwnd }), list => Send("windowsChanged", list));
```

`CheckFixtures`의 switch, `"windowClosed"` 줄 아래:

```csharp
                "windowsChanged" => p.Deserialize<List<WinInfo>>(json)!.Count,
```

- [ ] **Step 6: 견본 읽기 · 빌드 확인**

Run: `cd /mnt/d/git/CubeSpaceMain && dotnet.exe run --project drivers/win-driver -c Release -- --check-fixtures packages/protocol/fixtures/win && dotnet.exe build drivers/win-driver -c Release`
Expected: 모든 줄 `ok`, 빌드 경고 · 오류 0.

- [ ] **Step 7: 손으로 확인(Windows, 사용자)** — `pnpm build:win` 뒤 앱 실행, 홈 화면 패드를 보며:
  - 큐브 없이 창 2개를 띄우면 회색 테두리 2개
  - 창을 끄는 동안 패드가 안 바뀌고, 놓으면 바뀐다
  - 최대화하면 패드 전체, 최소화하면 사라진다
  - 다른 창을 클릭해 앞으로 가져오면 겹친 부분의 주인이 바뀐다
  - 창 화면에서 대상 모니터를 바꾸면(모니터 2개일 때) 그 모니터 창으로 바뀐다

- [ ] **Step 8: 커밋 명령 제시**

```
git add drivers/win-driver/Native.cs drivers/win-driver/Windows.cs drivers/win-driver/Watcher.cs drivers/win-driver/Program.cs
git commit -m "feat: win-driver가 창 위치·순서를 보내고 옮기면 windowsChanged로 알림"
```
