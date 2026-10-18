import { useEffect, useState } from "react";

// 임시: AI 실행 API가 아직 없어 화면에서 단계를 1.5초마다 넘긴다(시안 startRun · tickRun). 실제 연결 때 바꾼다.
export type AiRun = { steps: [string, string][]; names: string[]; step: number; status: "running" | "done" | "stopped" };

export function useAiRun(onDone: () => void) {
  const [run, setRun] = useState<AiRun | null>(null);
  const running = run?.status === "running";

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRun((r) => {
        if (!r || r.status !== "running") return r;
        if (r.step + 1 < r.steps.length) return { ...r, step: r.step + 1 };
        onDone();
        return { ...r, status: "done" };
      });
    }, 1500);
    return () => clearInterval(t);
  }, [running, onDone]);

  return {
    run,
    running,
    start: (steps: [string, string][], names: string[]) => setRun({ steps, names, step: 0, status: "running" }),
    stop: () => setRun((r) => r && { ...r, status: "stopped" }),
    reset: () => setRun(null),
  };
}
