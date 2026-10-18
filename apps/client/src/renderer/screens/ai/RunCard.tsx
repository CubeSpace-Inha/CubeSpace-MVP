import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { AiRun } from "./useAiRun";

// 진행 카드: 단계 목록 · 쓰는 구성 · 중지 / 새 작업(시안 #aRun)
export function RunCard({ run, onStop, onReset }: { run: AiRun; onStop: () => void; onReset: () => void }) {
  const done = run.status === "done";
  const stopped = run.status === "stopped";
  const title = done ? "다 끝났어요" : stopped ? "중지했어요" : `${run.steps[run.step]![0]} 하는 중`;
  const meta = done ? "완료" : stopped ? "중지" : `${run.step + 1} / ${run.steps.length}`;
  return (
    <Card title={title} meta={meta} n={1} className="arun">
      <ol className="stp">
        {run.steps.map(([n, who], i) => {
          const cp = done || i < run.step;
          const cu = !done && !stopped && i === run.step;
          return (
            <li key={n} className={cp ? "cp" : cu ? "cu" : "wt"}>
              <span className="sn">{cp ? "✓" : i + 1}</span>
              <div>
                <b>{n}</b>
                <small>{who}</small>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="runchips">
        {run.names.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className="runacts">
        {run.status === "running" ? (
          <Button variant="danger" onClick={onStop}>
            중지
          </Button>
        ) : (
          <Button variant="primary" onClick={onReset}>
            새 작업
          </Button>
        )}
      </div>
    </Card>
  );
}
