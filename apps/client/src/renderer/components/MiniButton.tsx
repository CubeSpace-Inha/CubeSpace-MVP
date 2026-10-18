import type { ReactNode } from "react";
import "./MiniButton.css";

type Props = { label: string; on?: boolean; onClick?: () => void; children: ReactNode };

// 줄 끝의 작은 네모 버튼(시안 .wa button). 켜진 상태는 진하게.
export function MiniButton({ label, on, onClick, children }: Props) {
  return (
    <button type="button" className={on ? "mini on" : "mini"} title={label} aria-label={label} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
