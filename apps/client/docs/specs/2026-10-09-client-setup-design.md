# CubeSpace-Client 기본 세팅 설계

날짜: 2026-10-09 · 상태: 승인됨

## 목적

`cube-space-ui/pad-home.html` 시안을 Electron 앱으로 옮기기 전에, 빈 프로젝트 뼈대를 세운다.
다음 단계는 템플릿(토큰 · 레이아웃 · 부품)과 개발자용 카탈로그 화면 `/template`이다.

## 결정

| 항목          | 선택                                                                             | 이유                                                  |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 앱 틀         | Electron 44 + React 19 + TypeScript 6.0                                          | 시안 HTML/CSS를 그대로 옮길 수 있다                   |
| 빌드          | electron-vite 5 (vite 7)                                                         | main · preload · renderer를 한 설정으로, renderer HMR |
| 라우팅        | react-router 8, `BrowserRouter`                                                  | `/` 앱, `/template` 카탈로그                          |
| 검사 · 테스트 | ESLint 10 + typescript-eslint, `tsc --noEmit`, Vitest 5 + Testing Library(jsdom) | 기존 cube-space와 같은 도구                           |
| 패키지 관리자 | pnpm                                                                             | 기존과 같다                                           |
| 저장소        | 패키지 하나                                                                      | 모노레포는 나눌 이유가 생기면 그때                    |

기존 `cube-space` 모노레포는 구조만 참고하고 코드는 가져오지 않는다. win32 창 제어와 HW 연결은 필요할 때 `src/main/` 아래에 옮기며 검증한다.

## `/template`

- 개발 전용. `import.meta.env.DEV`일 때만 경로를 등록하고, 배포 빌드에서는 빠진다.
- 개발 서버(`http://localhost:5173/template`)라 Electron 없이 브라우저로도 볼 수 있다.
- 배포 빌드는 `file://`로 열려 `BrowserRouter` 경로가 동작하지 않는다. 패키징 단계에서 사용자 정의 프로토콜(`app://`)로 해결한다(이번 범위 밖).

## 폴더 구조

```
src/
  main/       Electron 메인(창 생성). 나중에 win32/, device/
  preload/    contextBridge 노출
  shared/     main ↔ renderer 공용 타입(IPC 계약)
  renderer/
    index.html · main.tsx · App.tsx(라우터)
    styles/ layout/ components/ hooks/ model/ screens/
    template/  TemplatePage(카탈로그)
test/
docs/
```

빈 폴더는 만들지 않는다. 파일이 생길 때 폴더도 생긴다.

## 첫 커밋 완료 조건

- `pnpm dev`로 창이 뜨고 "CUBE SPACE"가 보인다.
- `/template`에 빈 카탈로그 페이지가 있다.
- `pnpm check`(lint · typecheck · test)가 통과한다. 렌더 테스트 1개 포함.
- `.gitignore`, `README.md`(실행 방법).

## 실행 환경

Electron과 esbuild는 OS별 바이너리를 받으므로 `pnpm install` · `pnpm dev`는 Windows PowerShell에서 한다.
WSL에서 설치한 `node_modules`는 Windows에서 쓸 수 없으니 Windows에서 다시 설치한다.
