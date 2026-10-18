import type { CSSProperties, ReactNode } from "react";
import "./Board.css";

type Props = { columns?: string; children: ReactNode };

// 한 화면의 영역 배치. columns는 grid-template-columns 값. 1180px보다 좁으면 한 칸으로 쌓인다.
export function Board({ columns = "minmax(0, 1fr)", children }: Props) {
  return (
    <section className="board" style={{ "--cols": columns } as CSSProperties}>
      {children}
    </section>
  );
}
