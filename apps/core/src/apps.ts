// 실행 파일 ↔ 화면에 쓰는 프로그램 이름(client APP_ICONS 키). 표에 없으면 실행 파일 이름 그대로.
const EXE_APP: Record<string, string> = {
  "notepad.exe": "메모장",
  "mspaint.exe": "그림판",
  "explorer.exe": "파일 탐색기",
  "taskmgr.exe": "작업 관리자",
  "everything.exe": "Everything",
  "code.exe": "VS Code",
  "claude.exe": "Claude",
  "windowsterminal.exe": "Windows Terminal",
  "chrome.exe": "Chrome",
  "msedge.exe": "Edge",
  "discord.exe": "Discord",
  "slack.exe": "Slack",
  "spotify.exe": "Spotify",
  "notion.exe": "Notion",
  "excel.exe": "Excel",
  "winword.exe": "Word",
  "powerpnt.exe": "PowerPoint",
  "devenv.exe": "Visual Studio",
  "idea64.exe": "IntelliJ IDEA",
  "pycharm64.exe": "PyCharm",
  "studio64.exe": "Android Studio",
  "unity.exe": "Unity",
  "blender.exe": "Blender",
};

export const appOf = (exe: string) => EXE_APP[exe.toLowerCase()] ?? exe.replace(/\.exe$/i, "");

export const exeOf = (app: string) =>
  Object.keys(EXE_APP).find((k) => EXE_APP[k] === app) ?? (/\.exe$/i.test(app) ? app : `${app}.exe`);
