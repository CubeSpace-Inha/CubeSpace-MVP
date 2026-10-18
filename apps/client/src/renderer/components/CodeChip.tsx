import type { Tone } from "./Badge";
import "./CodeChip.css";

// 알림 · 오류 코드 칩(고정폭 글자). 색은 Badge와 같은 톤.
export function CodeChip({ tone = "warn", code }: { tone?: Tone; code: string }) {
  return <span className={`code-chip tone-${tone}`}>{code}</span>;
}
