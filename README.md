# CUBE SPACE (MVP)

큐브를 패드에 올려 PC 창을 배치하는 프로그램.

## 구조

```
apps/
  client/      # Electron + React 화면 · 트레이
  core/        # 상태를 쥐는 상주 프로그램
  pad-sim/     # 가상 패드(큐브 6개)
packages/
  protocol/    # 프로그램끼리 주고받는 메시지 형식
drivers/
  win-driver/  # C# Win32 창 제어
```

client → core → win-driver · pad-sim (named pipe)

## 실행

Windows, node 22+, pnpm, .NET 8 SDK.

```
pnpm install
pnpm build:win   # win-driver 빌드(한 번)
pnpm dev
pnpm check       # lint · 타입 · 테스트
```
