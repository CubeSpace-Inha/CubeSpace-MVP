import type { ReactNode } from "react";

// Board 안 한 칸에 영역(Card)을 세로로 쌓는다. 스타일은 Board.css.
export function Column({ children }: { children: ReactNode }) {
  return <div className="vcol">{children}</div>;
}
