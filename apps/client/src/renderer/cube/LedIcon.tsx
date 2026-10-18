import type { CSSProperties } from "react";
import { LedMatrix } from "./LedMatrix";
import type { Pixels } from "./led";
import "./LedIcon.css";

// 작은 LED 아이콘(어두운 타일 + 8 × 8). 앱 · 프로그램 표시에 쓴다.
export function LedIcon({ pixels, size = 18 }: { pixels: Pixels; size?: number }) {
  return (
    <span className="aic" style={{ "--z": `${size}px` } as CSSProperties}>
      <LedMatrix pixels={pixels} />
    </span>
  );
}
