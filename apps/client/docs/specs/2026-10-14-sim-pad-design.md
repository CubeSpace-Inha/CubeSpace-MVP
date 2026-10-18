# 시뮬레이션 패드 조작(SW) 설계

날짜: 2026-10-14 · 상태: 검토 중

## 목적

HW(패드 펌웨어 · pad-gateway)를 합치기 전에, 시뮬레이션 화면의 패드에서 큐브를 움직여 HW와 같은 흐름(core padLink → store → layout → WinDriver)을 시험한다.
**임시 기능이다.** HW가 완성되면 걷어낸다. 그래서 코드는 최소로, 한곳에 모으고, 파일마다 `HW 통합 후 제거` 주석을 단다.

## 결정

| 항목         | 선택                                                                                     | 이유                                               |
| ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SW의 뜻      | core + **pad-sim**(가상 패드) + WinDriver. 실제 창도 움직인다                            | core 로직을 복제하지 않고 HW와 같은 길을 탄다      |
| HW의 뜻      | core + pad-gateway(USB). 아직 없으므로 `--pad` 없이 띄운다(패드 끊김으로 보임)           |                                                    |
| 가짜 API     | 앱(`main.tsx` · `pnpm web`)에서 뺀다. `createFakeApi`는 `test/`로 옮겨 테스트 대역으로만 | 테스트 5개가 쓴다                                  |
| HW ↔ SW 전환 | main이 선택을 파일로 저장 → core `shutdown` → 새 `--pad` 인자로 다시 띄움 → 창 새로고침  | core는 따로 사는 프로세스라 인자를 바꾸려면 재시작 |
| 조작 UI      | 끌어 놓기 + 큐브 클릭 메뉴 + 카드 머리 "패드 끊김" 버튼                                  |                                                    |
| core 로직    | 바꾸지 않는다                                                                            |                                                    |

## 흐름

```
SimScreen(끌기 · 메뉴) → window.cubeSpace.sim.* → preload → IPC "sim:call"
  → main/simLink.ts → (pipe "sim") → pad-sim → (pipe "pad") → core → 스냅샷 → 화면
```

## 부분별

### pad-sim (`apps/pad-sim`)

- 있는 것: `simCube` · `simButton` · `simLink` · `simState`.
- 더할 것: `simPad` — core 연결을 모두 끊는다.
  - core는 pad pipe가 끊기면 `pad.session = "lost"`로 본다. supervisor가 pad-sim을 다시 띄우므로 약 1초 뒤 자동 복귀하고, 큐브 자리는 처음(모두 패드 밖)으로 돌아간다.
  - 끊긴 채로 두는 스위치는 supervisor를 바꿔야 해서 하지 않는다. 실제 USB 끊김을 pad-gateway가 어떻게 알릴지는 HW 쪽에서 정한다.
- `SimControl` 타입(`packages/protocol/src/pad.ts`)에 `simPad`를 더한다.

### main (`apps/client/src/main`)

- `source.ts`(새): `hw | sw` 선택을 `userData/source.json`에 읽고 쓴다. 기본 `sw`(pad-gateway가 없으므로).
- `coreClient.ts`: `coreArgs`가 선택에 따라 `--pad pad-sim.cjs`를 넣거나 뺀다. `restart()`를 더한다(shutdown → 끊김 확인 → 다시 띄우기).
- `simLink.ts`(새): SW일 때만 IPC `sim:call`을 pipe `"sim"`으로 넘긴다. 처음 부를 때 붙고, 끊기면(pad-sim 재시작) 다음 부를 때 다시 붙는다.
- `ipc.ts`: `source:get` · `source:set`(저장 → core 재시작 → 모든 창 새로고침), `sim:call`.

### preload

- `cubeSpace.source`(지금 값)와 `cubeSpace.setSource(v)`를 연다.
- SW일 때만 `cubeSpace.sim`을 연다: `moveCube(mac4, xy | null)` · `press(mac4, "short" | "long")` · `setLink(mac4, "up" | "down")` · `dropPad()`.
- 타입은 `@cubespace/protocol`에 `SimApi`로 둔다(`CubeSpaceApi`와 따로).

### renderer

- `main.tsx`: 언제나 `window.cubeSpace`를 쓴다. 가짜 API · `dev/source.ts` 제거.
- 설정 화면의 HW/SW 선택은 `cubeSpace.setSource`를 부른다.
- `LayoutContext`에 `sim?: SimApi`. HW이면 `undefined`.
- `SimScreen`: `sim`이 있을 때만 조작을 켠다. 없으면 지금처럼 보기만.
  - **끌기**: 패드 위 큐브를 끌면 옮기기, 슬롯 칸 큐브를 패드로 끌면 놓기, 패드 밖으로 끌면 들기. 놓은 자리를 mm로 바꿔 `moveCube`. 끄는 동안에는 화면 위치만 바뀌고, 놓을 때 한 번 보낸다.
  - **좌표 변환**: 패드는 `rotateX(32deg)`로 눕혀 있다. 패드 전체를 덮는 투명 판(`.simhit`)에 포인터를 붙잡고(pointer capture), Chromium이 변환을 거꾸로 풀어 주는 `offsetX/Y`(판 기준)를 판 크기로 나눠 0~1을 얻는다. 0~1 → mm 변환은 `model/sim.ts`의 순수 함수 `toPadMm`. 범위 밖이면 `null`(들기).
  - **큐브 클릭**(4px 넘게 움직이지 않음): 큐브 옆 작은 메뉴 — 버튼 짧게 · 버튼 꾹 · 무선 끊기/잇기. 무선이 끊긴 큐브는 슬롯 칸에서만 보이므로 슬롯 칸 큐브도 클릭 메뉴를 연다.
  - **카드 머리**: "패드 끊김" 버튼(`dropPad`). 끊긴 동안은 기존 `off-ov`가 덮는다.
  - 호출 실패는 토스트로 알린다.

## 처음 쓸 때

SW로 처음 켜면 core 상태가 비어 있다. 페어링 화면에서 pad-sim 큐브(A2:F0 ~ A2:F3)를 등록한 뒤 시뮬레이션 화면에서 조작한다.

## 테스트

- `model/sim.ts` 좌표 변환: 패드 가운데 · 모서리 · 범위 밖.
- pad-sim `simPad`: core 연결이 닫힌다(`apps/pad-sim/test/sim.test.ts`에 추가).
- `SimScreen`: `sim`이 있을 때만 끌기 · 메뉴 · 패드 끊김 버튼이 나온다. 메뉴 항목이 맞는 `sim` 메서드를 부른다.
- `createFakeApi`를 `test/`로 옮긴 뒤 기존 테스트 통과.
- 손으로: Electron SW에서 큐브 등록 → 놓기 · 옮기기 · 들기 → PC 창 결과와 실제 창이 같이 바뀌는지.

## 걷어낼 때

`main/simLink.ts` · `main/source.ts`의 SW 분기 · preload `sim` · `SimApi` · `SimScreen` 조작 부분 · `simPad`. 각 파일의 `HW 통합 후 제거` 주석으로 찾는다.

## 범위 밖

- 끊긴 채로 유지하는 패드 스위치(supervisor 변경)
- 들림 대기 · 내렸을 때 창 처리 · 꾹 누르기 동작 · LED 명령 — core에 아직 없고, 생기면 이 조작으로 자동으로 시험된다.
