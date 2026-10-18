# CubeSpace-Client

CUBE SPACE PC 앱. 패드 위 큐브로 PC 창 배치를 제어한다. Electron + React + TypeScript.

## 실행

Electron은 OS별 바이너리를 쓰므로 **Windows PowerShell**에서 설치·실행한다.

```powershell
corepack enable          # pnpm이 없을 때 한 번
pnpm install
pnpm dev                 # Electron 창 + 화면 즉시 반영(HMR)
```

| 명령         | 하는 일                 |
| ------------ | ----------------------- |
| `pnpm dev`   | 개발 모드로 앱 실행     |
| `pnpm build` | `out/`에 빌드           |
| `pnpm check` | lint · typecheck · test |

## 템플릿 카탈로그

개발 모드에서 `/template` 경로에 공통 레이아웃·부품 모음이 있다. 배포 빌드에는 들어가지 않는다.
템플릿 카탈로그: `pnpm dev` 후 창에서 `/template`(화면 오른쪽 아래 "템플릿 보기" 버튼).

## 폴더

```
src/main/       Electron 메인 프로세스
src/preload/    renderer에 노출할 API
src/renderer/   React 화면
  styles/       토큰(색 · 다크/라이트) · 글꼴 · 기본
  layout/       AppShell · Rail(왼쪽 메뉴) · Board · Column
  components/   Card · Button · Badge · Tabs · Dialog · Drawer · Toast …
  hooks/        useTheme · useToast · useModalDialog
  template/     /template 카탈로그
test/           Vitest 테스트
docs/specs/     설계 문서
```
