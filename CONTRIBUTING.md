# 함께 작업하기

## 처음 한 번

node 22 이상이 필요하다. 설치(`pnpm install`)는 실행할 OS에서 한다. Electron · esbuild가 OS별 바이너리라 Windows와 WSL처럼 서로 다른 OS가 node_modules를 같이 쓰면 안 돈다.

|                                                           | Windows          | macOS                     |
| --------------------------------------------------------- | ---------------- | ------------------------- |
| 화면 · core · pad-sim 개발, `pnpm dev` · `pnpm check`     | 된다             | 된다(창 제어 없이 돈다)   |
| win-driver(C#) 빌드 · `pnpm build:win` · `pnpm check:win` | 된다(.NET 8 SDK) | 안 된다(`net8.0-windows`) |
| 실제 창 배치 확인                                         | 된다             | 안 된다                   |

```
corepack enable
pnpm install
pnpm build:win   # Windows만: win-driver(C#) 빌드. .NET 8 SDK 필요
```

git 공통 설정(`scripts/git-settings.txt`)을 넣고 확인한다. 확인 스크립트가 아무것도 출력하지 않으면 끝. 넣기 전 전역 설정은 홈 폴더 `git-config-backup-날짜.txt`에 백업된다.

```
# macOS · Git Bash
scripts/setup-git.sh && scripts/verify-git.sh

# Windows PowerShell(실행 정책은 이 명령에만 풀린다)
powershell -ExecutionPolicy Bypass -File scripts\setup-git.ps1
powershell -ExecutionPolicy Bypass -File scripts\verify-git.ps1
```

| 설정                      | 이유                                       |
| ------------------------- | ------------------------------------------ |
| `init.defaultBranch main` | 새 레포 기본 브랜치를 main으로 맞춘다      |
| `pull.ff only`            | pull이 몰래 병합 커밋을 만들지 않는다      |
| `core.quotepath false`    | 한글 파일 이름이 `\354\225...`로 안 보인다 |
| `core.longpaths true`     | Windows에서 긴 경로(node_modules)도 받는다 |

VS Code를 열면 추천 확장(Prettier · ESLint · EditorConfig · C#)을 설치한다. 저장할 때 자동으로 포맷과 lint 수정이 된다.

## 공통 설정 파일

| 파일                | 하는 일                                       |
| ------------------- | --------------------------------------------- |
| `eslint.config.mjs` | 모든 패키지의 lint 규칙을 이 파일 하나에 둔다 |
| `.prettierignore`   | 포맷에서 뺄 파일(포맷 규칙은 Prettier 기본값) |
| `.editorconfig`     | UTF-8 · LF · 공백 2칸(C#은 4칸) · 줄 길이 120 |
| `.vscode/`          | 저장 시 포맷 · lint 수정, 추천 확장           |
| `CLAUDE.md`         | Claude Code가 따르는 프로젝트 규칙            |

## 커밋

커밋 하나에는 한 가지 변경만 담는다. 메시지는 아래 7가지 규칙을 따른다(Chris Beams, "How to Write a Git Commit Message"를 한국어에 맞춤).

1. **제목과 본문 사이는 빈 줄 하나로 나눈다.** 본문이 필요 없는 작은 변경은 제목만 쓴다.
2. **제목은 50자 이내로 쓴다.** 접두사 포함. 길어지면 변경을 나누거나 자세한 내용은 본문으로 옮긴다.
3. **제목은 `접두사: 설명` 형식으로 시작한다.** 접두사는 소문자 `feat` · `fix` · `refactor` · `chore` · `docs` · `test` 중 하나. (원래 규칙 "첫 글자는 대문자"를 대신한다)
4. **제목은 마침표 없이 끝낸다.**
5. **제목은 명사형으로 끝낸다.** "추가" · "수정" · "삭제" · "분리"처럼 이 커밋이 하는 일을 적는다. "추가했음" · "추가함"이 아니다. (원래 규칙 "명령형"을 대신한다)
6. **본문은 한 줄 72자 이내로 줄을 바꾼다.**
7. **본문에는 무엇을 왜 바꿨는지 적는다.** 어떻게는 코드가 보여 준다. 바꾸기 전 문제, 고른 방법의 이유, 영향 범위를 적는다.

`Co-Authored-By` 같은 꼬리 줄은 붙이지 않는다.

```
fix: 패드가 끊겨도 큐브 자리가 남지 않게 수정

패드가 끊기면 core가 큐브의 xy를 지우지 않아, 다시 붙기 전까지
홈 화면에 큐브가 패드 위에 있는 것처럼 보였다.

끊김을 받으면 모든 큐브를 패드 밖으로 옮긴다. 다시 붙으면 패드가
보내는 sync로 자리가 돌아온다.
```

```
docs: README에 macOS 안내 추가
```

명령줄에서는 `-m`을 여러 번 쓰면 문단이 나뉜다(Windows · macOS 모두 된다).

```
git commit -m "fix: 패드가 끊겨도 큐브 자리가 남지 않게 수정" -m "패드가 끊기면 core가 큐브의 xy를 지우지 않아, 다시 붙기 전까지 ..."
```

## 브랜치와 PR

- `main`에서 `feat/짧은-이름` · `fix/짧은-이름` 브랜치를 만들어 작업한다.
- PR을 올리기 전에 루트에서 `pnpm check`(포맷 · lint · 타입 · 테스트)를 통과시킨다.
- C# 코드나 `packages/protocol/fixtures/win`을 고쳤으면 Windows에서 `pnpm check:win`도 통과시킨다.
- PR을 올리기 전에 `git diff main...` 에서 API 키 · 토큰 · 비밀번호 · 개인 경로가 없는지 본다. 키는 `.env`에 두고(`.gitignore`에 있다) 코드에는 `process.env.이름`으로만 읽는다. 이미 push한 키는 지워도 기록에 남으니 바로 폐기하고 새로 발급한다.
- PR 설명에는 무엇을 왜 바꿨는지, 화면이 바뀌었으면 스크린샷을 넣는다.
