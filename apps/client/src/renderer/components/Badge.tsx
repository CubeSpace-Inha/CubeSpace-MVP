import type { ReactNode } from "react";
import "./Badge.css";

export type Tone = "ok" | "warn" | "warnd" | "danger" | "neutral" | "muted";

type Props = { tone?: Tone; children: ReactNode };

// 상태 글자 배지. 색(톤)과 글자를 함께 쓴다.
export function Badge({ tone = "neutral", children }: Props) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}
