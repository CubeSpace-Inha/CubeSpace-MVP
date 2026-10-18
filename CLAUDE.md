# CUBE SPACE

큐브를 패드에 올려 PC 창을 배치하는 Windows 앱(MVP). 화면 · core 개발과 테스트는 macOS에서도 된다. 구조는 `README.md`, 커밋 · 브랜치 · PR 규칙은 아래 파일을 따른다.

@CONTRIBUTING.md

## [CRITICAL] 반드시 지킬 것

- 화면 API(`CubeSpaceApi`) 동작을 바꾸면 `apps/core/src/api.ts`(실제)와 `apps/client/test/fakeApi.ts`(테스트 대역)를 같은 커밋에서 함께 고친다. 두 곳의 규칙이 같아야 화면 테스트가 실제 동작을 검증한다.
- 프로그램끼리 주고받는 메시지 형식은 `packages/protocol/src`에만 정의한다. `win.ts`를 고치면 `packages/protocol/fixtures/win` 견본도 고치고 Windows에서 `pnpm check:win`으로 C# 쪽이 읽는지 확인한다(macOS에서는 실행되지 않으니 PR에 확인 못 했다고 적는다).
- 커밋 · PR 명령을 주기 전에 올라갈 diff에 키 · 토큰 · 비밀번호(`sk-ant-` · `ghp_` · `AKIA` · `PRIVATE KEY` 등)가 없는지 확인하고, 있으면 멈추고 알린다.
- 작업을 끝냈다고 말하기 전에 루트에서 `pnpm check`(포맷 · lint · 타입 · 테스트)를 실행해 통과를 확인한다. 한 패키지만 볼 때는 `pnpm --filter @cubespace/client check`.

## [IMPORTANT] 자주 빠지는 함정

- 명령은 `pnpm install`을 한 OS에서 실행한다(Electron · esbuild가 OS별 바이너리). Windows에 설치하고 WSL에서 작업할 때는 `cmd.exe`를 거친다.
  ```
  cmd.exe /c "cd /d <레포의 Windows 경로> && pnpm check"
  ```
- core는 client 창을 닫아도 계속 돈다(트레이 "종료"에서만 꺼진다). `apps/core` · `apps/pad-sim` · `packages/protocol`을 고친 뒤에는 트레이 "종료"로 core까지 끄고 `pnpm dev`로 다시 띄운다. 그래야 바뀐 코드가 돈다.
- 실제 HW가 붙으면 지울 코드에는 표시 주석을 단다. 지울 때 이 문구로 검색한다.
  ```ts
  // HW 통합 후 제거: 가상 패드 조작을 pad-sim에 넘긴다
  // 임시(MVP): 큐브 6개 페어링된 가정
  ```

## [PREFERRED] 권장

- 스냅샷 → 화면 값 계산은 `apps/client/src/renderer/model/`의 순수 함수로 두고, `apps/client/test/`에 테스트를 붙인다.
- 화면 테스트는 사용자가 보는 역할과 이름으로 요소를 찾는다. 아이콘만 있는 버튼에는 `label`을 준다.
  <!-- prettier-ignore -->
  ```tsx
  <MiniButton label="창 닫기" onClick={close}>✕</MiniButton>
  // 테스트
  fireEvent.click(screen.getByRole("button", { name: "창 닫기" }));
  ```
- 결과를 쓰지 않는 Promise 호출 앞에는 `void`를 붙여 일부러 버린다는 걸 드러낸다: `void api.releaseCube(slot)`.
- 컴포넌트 파일 하나에 컴포넌트 하나를 두고, 파일 이름을 export 이름과 같게 한다(`WindowRow.tsx` → `WindowRow`).
- 주석은 한국어 한두 줄로, 코드만 봐서는 모를 이유를 적는다.
- 줄 정리 · 따옴표 · 들여쓰기는 `pnpm format`(Prettier)으로 맞춘다.
