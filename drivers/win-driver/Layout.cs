using System.Diagnostics;
using System.Runtime.InteropServices;
using static WinDriver.Native;

namespace WinDriver;

public sealed record LayoutItem(string Hwnd, double[] Rect);
public sealed record ItemResult(string Hwnd, bool Ok, string? Error = null);

// 창 옮기기 · 창 버튼 · 프로그램 실행
internal static class Layout
{
    static RECT Work(int monitor)
    {
        var list = Windows.Monitors();
        var m = list.FirstOrDefault(x => x.No == monitor) ?? list.FirstOrDefault(x => x.Primary) ?? list[0];
        return new RECT { Left = m.Work[0], Top = m.Work[1], Right = m.Work[0] + m.Work[2], Bottom = m.Work[1] + m.Work[3] };
    }

    // Windows 10 · 11 창은 보이지 않는 테두리가 있어, 그만큼 넓혀야 화면에 딱 맞는다
    static RECT WithBorder(IntPtr hwnd, RECT r)
    {
        if (!GetWindowRect(hwnd, out var outer)) return r;
        if (DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, out RECT visible, Marshal.SizeOf<RECT>()) != 0) return r;
        return new RECT
        {
            Left = r.Left - (visible.Left - outer.Left),
            Top = r.Top - (visible.Top - outer.Top),
            Right = r.Right + (outer.Right - visible.Right),
            Bottom = r.Bottom + (outer.Bottom - visible.Bottom),
        };
    }

    static RECT ToPixels(RECT work, double[] n)
    {
        int w = work.Right - work.Left, h = work.Bottom - work.Top;
        return new RECT
        {
            Left = work.Left + (int)Math.Round(n[0] * w),
            Top = work.Top + (int)Math.Round(n[1] * h),
            Right = work.Left + (int)Math.Round(n[2] * w),
            Bottom = work.Top + (int)Math.Round(n[3] * h),
        };
    }

    const uint MOVE = SWP_NOZORDER | SWP_NOACTIVATE;

    // 한 번에 옮긴다(DeferWindowPos). 하나라도 막히면 하나씩 옮겨서 어느 창이 안 되는지 알린다
    public static List<ItemResult> Apply(int monitor, List<LayoutItem> items)
    {
        var work = Work(monitor);
        var targets = new List<(LayoutItem item, IntPtr hwnd, RECT r)>();
        var results = new List<ItemResult>();
        foreach (var item in items)
        {
            var hwnd = Windows.Parse(item.Hwnd);
            if (!IsWindow(hwnd)) { results.Add(new(item.Hwnd, false, "창 없음")); continue; }
            if (IsIconic(hwnd)) ShowWindow(hwnd, SW_RESTORE);
            targets.Add((item, hwnd, WithBorder(hwnd, ToPixels(work, item.Rect))));
        }

        var info = BeginDeferWindowPos(targets.Count);
        foreach (var (_, hwnd, r) in targets)
            if (info != IntPtr.Zero) info = DeferWindowPos(info, hwnd, IntPtr.Zero, r.Left, r.Top, r.Right - r.Left, r.Bottom - r.Top, MOVE);
        if (info != IntPtr.Zero && EndDeferWindowPos(info))
            return [.. results, .. targets.Select(t => new ItemResult(t.item.Hwnd, true))];

        foreach (var (item, hwnd, r) in targets)
        {
            if (SetWindowPos(hwnd, IntPtr.Zero, r.Left, r.Top, r.Right - r.Left, r.Bottom - r.Top, MOVE))
            {
                results.Add(new(item.Hwnd, true));
                continue;
            }
            int err = Marshal.GetLastWin32Error();
            results.Add(new(item.Hwnd, false, err == 5 ? "관리자 권한 창" : $"Win32 오류 {err}"));
        }
        return results;
    }

    // 왼쪽 · 오른쪽 절반, 최소화 ↔ 올리기, 항상 위 켜고 끄기, 닫기
    public static void Command(string hwndText, string cmd, int monitor)
    {
        var hwnd = Windows.Parse(hwndText);
        if (!IsWindow(hwnd)) throw new InvalidOperationException("창 없음");
        switch (cmd)
        {
            case "left":
            case "right":
                var r = Apply(monitor, [new(hwndText, cmd == "left" ? [0, 0, 0.5, 1] : [0.5, 0, 1, 1])])[0];
                if (!r.Ok) throw new InvalidOperationException(r.Error);
                break;
            case "min":
                ShowWindow(hwnd, IsIconic(hwnd) ? SW_RESTORE : SW_MINIMIZE);
                break;
            case "top":
                bool top = (GetWindowLong(hwnd, GWL_EXSTYLE) & WS_EX_TOPMOST) != 0;
                SetWindowPos(hwnd, top ? HWND_NOTOPMOST : HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
                break;
            case "close":
                PostMessage(hwnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
                break;
            default:
                throw new InvalidOperationException($"모르는 창 명령: {cmd}");
        }
    }

    // 셸로 실행한다(App Paths에 있는 code.exe 등도 찾는다)
    public static void Launch(string exe, string[] args)
    {
        var info = new ProcessStartInfo(exe) { UseShellExecute = true };
        foreach (var a in args) info.ArgumentList.Add(a);
        Process.Start(info);
    }
}
