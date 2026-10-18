using static WinDriver.Native;

namespace WinDriver;

// 창이 열리고 닫히는 것을 지켜본다(SetWinEventHook). 이 스레드에서 메시지 루프를 돌려야 알림이 온다.
internal static class Watcher
{
    static readonly HashSet<IntPtr> known = [];
    static WinEventProc? proc; // GC가 지우지 않게 붙잡아 둔다

    // 목록을 보낸 창은 이미 아는 창이다
    public static void Know(IEnumerable<WinInfo> list)
    {
        lock (known) foreach (var w in list) known.Add(Windows.Parse(w.Hwnd));
    }

    public static void Run(Action<WinInfo> opened, Action<string> closed)
    {
        Know(Windows.List());
        proc = (_, ev, hwnd, idObject, idChild, _, _) =>
        {
            if (idObject != OBJID_WINDOW || idChild != 0 || hwnd == IntPtr.Zero) return;
            lock (known)
            {
                if (ev == EVENT_OBJECT_DESTROY)
                {
                    if (known.Remove(hwnd)) closed(hwnd.ToInt64().ToString());
                }
                // 제목이 늦게 붙는 창이 있어 이름 바뀜도 본다
                else if (!known.Contains(hwnd) && Windows.IsUserWindow(hwnd))
                {
                    known.Add(hwnd);
                    opened(Windows.Info(hwnd));
                }
            }
        };
        uint flags = WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS;
        SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_SHOW, IntPtr.Zero, proc, 0, 0, flags);
        SetWinEventHook(EVENT_OBJECT_NAMECHANGE, EVENT_OBJECT_NAMECHANGE, IntPtr.Zero, proc, 0, 0, flags);
        while (GetMessage(out var msg, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }
    }
}
