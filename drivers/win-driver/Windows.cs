using System.Text;
using static WinDriver.Native;

namespace WinDriver;

public sealed record WinInfo(string Hwnd, string Exe, string Title, bool Minimized);
public sealed record MonitorInfo(int No, bool Primary, int[] Work);

// 창 · 모니터 목록. 사용자가 옮길 만한 창만 고른다.
internal static class Windows
{
    // 보이고, 제목이 있고, 툴윈도우(트레이 팝업 등) · 딸린 창 · 숨겨진(cloaked) UWP 창이 아닌 것
    public static bool IsUserWindow(IntPtr hwnd)
    {
        if (!IsWindowVisible(hwnd) || GetWindowTextLength(hwnd) == 0) return false;
        if ((GetWindowLong(hwnd, GWL_EXSTYLE) & WS_EX_TOOLWINDOW) != 0) return false;
        if (GetWindow(hwnd, GW_OWNER) != IntPtr.Zero) return false;
        return DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, out int cloaked, sizeof(int)) != 0 || cloaked == 0;
    }

    public static List<WinInfo> List()
    {
        var list = new List<WinInfo>();
        EnumWindows((hwnd, _) =>
        {
            if (IsUserWindow(hwnd)) list.Add(Info(hwnd));
            return true;
        }, IntPtr.Zero);
        return list;
    }

    public static WinInfo Info(IntPtr hwnd) => new(hwnd.ToInt64().ToString(), ExeOf(hwnd), Title(hwnd), IsIconic(hwnd));

    public static string Title(IntPtr hwnd)
    {
        int len = GetWindowTextLength(hwnd);
        var sb = new StringBuilder(len + 1);
        GetWindowText(hwnd, sb, sb.Capacity);
        return sb.ToString();
    }

    // 실행 파일 이름(소문자). 관리자 권한 프로세스 등 못 읽으면 ""
    static string ExeOf(IntPtr hwnd)
    {
        GetWindowThreadProcessId(hwnd, out uint pid);
        var h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
        if (h == IntPtr.Zero) return "";
        try
        {
            var sb = new StringBuilder(1024);
            int size = sb.Capacity;
            return QueryFullProcessImageName(h, 0, sb, ref size) ? Path.GetFileName(sb.ToString()).ToLowerInvariant() : "";
        }
        finally { CloseHandle(h); }
    }

    // 번호는 왼쪽 → 오른쪽, 위 → 아래 순으로 1부터
    public static List<MonitorInfo> Monitors()
    {
        var found = new List<(RECT work, bool primary)>();
        EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr m, IntPtr _, ref RECT _, IntPtr _) =>
        {
            var info = new MONITORINFO { cbSize = System.Runtime.InteropServices.Marshal.SizeOf<MONITORINFO>() };
            if (GetMonitorInfo(m, ref info)) found.Add((info.rcWork, (info.dwFlags & MONITORINFOF_PRIMARY) != 0));
            return true;
        }, IntPtr.Zero);
        return found
            .OrderBy(f => f.work.Left).ThenBy(f => f.work.Top)
            .Select((f, i) => new MonitorInfo(i + 1, f.primary,
                [f.work.Left, f.work.Top, f.work.Right - f.work.Left, f.work.Bottom - f.work.Top]))
            .ToList();
    }

    public static IntPtr Parse(string hwnd) => long.TryParse(hwnd, out var v) ? new IntPtr(v) : IntPtr.Zero;
}
