# 패드에 열린 창 영역 표시 설계

날짜: 2026-10-14 · 상태: 검토 중

## 목적

홈 · 시뮬레이션 화면의 패드 그림에, 대상 모니터에 열린 창이 **실제로 화면 어디에 전체 대비 어느 비율로** 떠 있는지 LED 테두리로 보여 준다. 큐브가 패드에 없어도 보인다.
지금은 core `layout`(창이 연결된 큐브가 패드 위에 있을 때만 생김)으로만 테두리를 켜서, 큐브가 없으면 아무것도 안 보인다.

## 결정

| 항목      | 선택                                                             | 이유                                                     |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| 비출 창   | 대상 모니터(`s.monitor.no`) 창만, 최소화 제외                    | 패드 = 대상 모니터 작업 영역. 큐브 배치 기준과 같다      |
| 갱신 시점 | 놓을 때(끌기 끝 · 최대화/복원/최소화 · 앞으로 옴 · 끌기 밖 이동) | 끄는 중 실시간은 알림이 많고 24×16 LED에선 차이가 작다   |
| 그리기    | LED 테두리                                                       |                                                          |
| 색        | 창 모드 큐브가 맡은 창 = 영역 색, 나머지 = 회색 어둡게           | 큐브가 맡은 창이 눈에 띈다                               |
| 겹침      | 칸마다 가장 위 창이 주인, 주인 테두리만 켠다                     | 가려진 아래 창 테두리가 위 창 안을 지나가지 않는다       |
| 위치 기준 | 맡은 창도 `layout` 대신 실제 `rect`                              | 기준 하나. `applyLayout` 뒤엔 같고, 손으로 옮기면 따라감 |
| 계산 위치 | win-driver가 모니터 · 비율 · 순서까지 계산                       | 모니터 목록 · 창 틀을 아는 곳. core는 옮기기만           |

## 인터페이스(`packages/protocol`)

- `WinInfo`(win.ts)에 더한다
  - `monitor: number` — 창이 있는 모니터 번호(`listMonitors`와 같은 번호, 1부터).
  - `rect: [number, number, number, number]` — 그 모니터 작업 영역에 대한 비율 `[x0, y0, x1, y1]`. 보이는 틀(`DWMWA_EXTENDED_FRAME_BOUNDS`) 기준. 0~1 밖일 수 있다(화면 밖으로 나간 창).
  - `z: number` — 위에서부터 순서, 0이 가장 위.
- `WinToCore`에 `windowsChanged: WinInfo[]`(전체 목록)를 더한다.
- `AppWindow`(snapshot.ts)에 `monitor` · `rect` · `z`를 같은 뜻으로 더한다.

## win-driver(`drivers/win-driver`, C#)

- `Windows.Info`가 `monitor`(`MonitorFromWindow` → `Monitors()` 번호와 맞춤) · `rect` · `z`를 채운다. `List()`는 `EnumWindows` 순서(위 → 아래)로 `z`를 매긴다. 하나만 읽는 `Info`(windowOpened)는 열린 직후라 `z = 0`.
- `Watcher`가 아래 알림을 더 받는다. 받으면 100 ms 모았다가 `windowsChanged`(전체 `List()`)를 한 번 보낸다.
  - `EVENT_SYSTEM_MOVESIZESTART` / `END` — START부터 END까지는 "끄는 중", END에서 보낸다.
  - `EVENT_SYSTEM_MINIMIZESTART` / `END`, `EVENT_SYSTEM_FOREGROUND`.
  - `EVENT_OBJECT_LOCATIONCHANGE`(`OBJID_WINDOW`, 사용자 창만) — 끄는 중이면 무시. 최대화 · Win+화살표 · 우리 `applyLayout`이 여기로 온다.

## core

- `winLink`: `toWindow`가 `monitor` · `rect` · `z`를 옮긴다. `windowsChanged`를 받으면 같은 `hwnd`의 `rect` · `z` · `monitor` · `status`(최소화)를 바꾸고, 목록에 없는 새 창은 더한다. 큐브 묶음(`cube.window`) · `owner`는 건드리지 않는다. 사라진 창은 `windowClosed`가 맡는다.

## 화면(`apps/client`)

`model/home.ts` `homeView().leds`만 바꾼다. 시뮬레이션 패드는 `simLeds`가 이것을 그대로 쓴다(AI 모드 LED는 그대로).

- 그릴 창: `monitor === s.monitor.no`, 최소화 아님. `rect`는 0~1로 자른다.
- 색 · 밝기: 창 모드 큐브가 맡은 창(지금 `lit`) = `REGION[layout 순서]`, `EDGE[맡은 창 수]`. 나머지 = `NEUTRAL`, 0.2.
- 칸(24 × 16) 주인: 그 칸을 덮는 창 중 `z`가 가장 작은 창. 칸이 주인 창 테두리일 때만 켠다.
- 반올림해 0칸이 되는 창도 최소 1칸(가로 · 세로 각각).
- 패드 끊김(동결)일 때도 지금처럼 그린다.
- `dev/fixtures.ts` 견본 창에 `monitor` · `rect` · `z`를 채운다.

## 테스트

- client(모델): 큐브 없이도 창 테두리 켜짐 · 다른 모니터 · 최소화 창 빠짐 · 맡은 창 영역 색, 나머지 회색 · 위 창에 가려진 아래 창 테두리 꺼짐 · 작은 창 1칸.
- core: `windowsChanged` → 위치 · 순서 · 최소화 바뀜, 큐브 묶음 그대로, 새 창 더함.
- win-driver: 자동 테스트 없음. Windows에서 손으로 — 창 끌어 놓기 · 최대화 · 다른 창 앞으로 · 최소화 때 홈 패드가 바뀐다, 끄는 중엔 안 바뀐다.

## 범위 밖

- 실제 패드 LED(패드 LED 명령이 core에 아직 없다)
- 모니터를 꽂거나 뺄 때 다시 세기
- 끄는 중 실시간 갱신
