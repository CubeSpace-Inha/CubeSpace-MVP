import type { CSSProperties } from "react";
import type { Pixels } from "./led";
import "./LedMatrix.css";

// 8 × 8 LED 점. 켜진 칸은 그 색으로 빛난다. 크기 · 간격은 감싸는 쪽(className)이 정한다.
export function LedMatrix({ pixels, className }: { pixels: Pixels; className?: string }) {
  return (
    <span className={className ? `ledm ${className}` : "ledm"} aria-hidden="true">
      {pixels.map((p, i) => (p ? <i key={i} className="on" style={{ "--p": p } as CSSProperties} /> : <i key={i} />))}
    </span>
  );
}
