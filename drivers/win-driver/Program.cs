using System.IO.Pipes;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using WinDriver;

// win-driver 시작점. 쓰는 법: WinDriver [--check-fixtures <protocol/fixtures/win 폴더>]
// pipe cubespace-win(-태그)을 열고 core가 붙기를 기다린다. 메시지는 JSON 한 줄씩(protocol/src/win.ts).

const int Version = 1;
var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);

if (args.Length == 2 && args[0] == "--check-fixtures") return CheckFixtures(args[1]);

var tag = Environment.GetEnvironmentVariable("CUBESPACE_PIPE_TAG");
var name = "cubespace-win" + (string.IsNullOrEmpty(tag) ? "" : $"-{tag}");
NamedPipeServerStream pipe;
try
{
    // 한 개만 받는다. 이미 다른 win-driver가 열고 있으면 끝낸다
    pipe = new NamedPipeServerStream(name, PipeDirection.InOut, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
}
catch (IOException)
{
    Console.Error.WriteLine($"[win] 이미 실행 중: {name}");
    return 0;
}

StreamWriter? writer = null;
var writeLock = new object();

void Send(string type, object? payload, string? id = null)
{
    var e = new JsonObject { ["v"] = Version, ["type"] = type };
    if (id != null) e["id"] = id;
    e["ts"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    e["payload"] = JsonSerializer.SerializeToNode(payload, json);
    lock (writeLock)
    {
        try { writer?.Write(e.ToJsonString() + "\n"); writer?.Flush(); }
        catch (IOException) { } // 끊김은 읽는 쪽에서 처리한다
    }
}

object? Handle(string type, JsonNode payload)
{
    switch (type)
    {
        case "ping": return null;
        case "listWindows":
            var list = Windows.List();
            Watcher.Know(list);
            return list;
        case "listMonitors": return Windows.Monitors();
        case "applyLayout":
            return Layout.Apply((int)payload["monitor"]!, payload["items"].Deserialize<List<LayoutItem>>(json)!);
        case "command":
            Layout.Command((string)payload["hwnd"]!, (string)payload["cmd"]!, (int)payload["monitor"]!);
            return null;
        case "launch":
            Layout.Launch((string)payload["exe"]!, payload["args"].Deserialize<string[]>(json) ?? []);
            return null;
        default: throw new InvalidOperationException($"모르는 요청: {type}");
    }
}

// core와 주고받는 스레드. 끊기면 다음 core를 기다린다
new Thread(() =>
{
    var utf8 = new UTF8Encoding(false);
    while (true)
    {
        pipe.WaitForConnection();
        var reader = new StreamReader(pipe, utf8, false, 4096, leaveOpen: true);
        lock (writeLock) writer = new StreamWriter(pipe, utf8, 4096, leaveOpen: true);
        Send("hello", new { role = "win" });
        try
        {
            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                JsonNode e;
                try { e = JsonNode.Parse(line)!; } catch (JsonException) { continue; } // 틀린 줄은 버린다
                if ((int?)e["v"] != Version) break; // 규약 버전이 다르면 끊는다
                var id = (string?)e["id"];
                try { Send("result", new { ok = true, value = Handle((string)e["type"]!, e["payload"] ?? new JsonObject()) }, id); }
                catch (Exception ex) { Send("result", new { ok = false, error = ex.Message }, id); }
            }
        }
        catch (IOException) { }
        lock (writeLock) writer = null;
        if (pipe.IsConnected) pipe.Disconnect();
    }
}) { IsBackground = true }.Start();

// 이 스레드는 창 열림 · 닫힘 알림을 받는다(메시지 루프)
Watcher.Run(w => Send("windowOpened", w), hwnd => Send("windowClosed", new { hwnd }));
return 0;

// 견본(protocol/fixtures/win)을 우리 형식으로 읽을 수 있는지 확인한다
int CheckFixtures(string dir)
{
    int bad = 0;
    foreach (var f in Directory.GetFiles(dir, "*.json").Order())
    {
        try
        {
            var e = JsonNode.Parse(File.ReadAllText(f))!;
            if ((int?)e["v"] != Version) throw new InvalidDataException("v");
            var p = e["payload"] ?? throw new InvalidDataException("payload 없음");
            var v = p["value"];
            _ = (string)e["type"]! switch
            {
                "applyLayout" => p["items"].Deserialize<List<LayoutItem>>(json)!.Count + (int)p["monitor"]!,
                "command" => ((string)p["hwnd"]! + (string)p["cmd"]! + (int)p["monitor"]!).Length,
                "launch" => ((string)p["exe"]!).Length + p["args"].Deserialize<string[]>(json)!.Length,
                "listWindows" or "listMonitors" => 0,
                "windowOpened" => p.Deserialize<WinInfo>(json)!.Hwnd.Length,
                "windowClosed" => ((string)p["hwnd"]!).Length,
                "result" when (bool)p["ok"]! == false => ((string)p["error"]!).Length,
                "result" when f.Contains("listWindows") => v.Deserialize<List<WinInfo>>(json)!.Count,
                "result" when f.Contains("listMonitors") => v.Deserialize<List<MonitorInfo>>(json)!.Count,
                "result" when f.Contains("applyLayout") => v.Deserialize<List<ItemResult>>(json)!.Count,
                var t => throw new InvalidDataException($"모르는 type: {t}"),
            };
            Console.WriteLine($"ok   {Path.GetFileName(f)}");
        }
        catch (Exception ex)
        {
            bad++;
            Console.WriteLine($"FAIL {Path.GetFileName(f)}: {ex.Message}");
        }
    }
    return bad == 0 ? 0 : 1;
}
