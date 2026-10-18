import type { ReactNode } from "react";
import { LedIcon } from "./LedIcon";
import type { Pixels } from "./led";
import "./WindowRow.css";

type Props = { pixels: Pixels; name: string; sub: ReactNode; min?: boolean; children?: ReactNode };

// 열린 창 한 줄: 앱 아이콘 · 이름 + 아랫줄(묶인 큐브 · 상태) · 오른쪽 버튼들(children).
export function WindowRow({ pixels, name, sub, min, children }: Props) {
  return (
    <div className={min ? "wrow min" : "wrow"}>
      <LedIcon pixels={pixels} size={24} />
      <span className="wn">
        <b>{name}</b>
        <small>{sub}</small>
      </span>
      <span className="wa">{children}</span>
    </div>
  );
}
