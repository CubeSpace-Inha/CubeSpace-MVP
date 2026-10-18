# client

CUBE SPACE 화면과 트레이. Electron + React + TypeScript. 설치 · 실행은 루트 [README](../../README.md).

| 명령         | 하는 일                 |
| ------------ | ----------------------- |
| `pnpm dev`   | 개발 모드로 앱 실행     |
| `pnpm build` | `out/`에 빌드           |
| `pnpm check` | lint · typecheck · test |

개발 모드에서 `/template`(화면 오른쪽 아래 "템플릿 보기")에 공통 레이아웃 · 부품 모음이 있다. 배포 빌드에는 들어가지 않는다.

## 폴더

```
src/main/        Electron 메인: core 띄우기 · 중계(ipc) · 트레이
src/preload/     renderer에 여는 window.cubeSpace(화면 API)
src/renderer/    React 화면
  screens/       페이지(홈 · 창 · AI · 설정 · 페어링)와 페이지 전용 부품
  model/         스냅샷 → 화면 값 계산(순수 함수)
  cube/          큐브 · 패드 · LED 부품
  components/    Card · Button · Dialog · Drawer · Toast …
  layout/        AppShell · Rail(왼쪽 메뉴) · Board · Column
  hooks/         useSnapshot · useTheme · useToast …
  styles/        토큰(색 · 다크/라이트) · 글꼴 · 기본
  template/      /template 카탈로그
  dev/           견본 상태(테스트용)
test/            Vitest 테스트 · 가짜 API(fakeApi.ts)
```

화면 시안은 루트 `docs/pad-home.html`. 코드 주석의 "시안 pad-home.html"이 이 파일이다.
