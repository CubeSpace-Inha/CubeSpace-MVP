import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { CubeTop } from "./CubeTop";
import type { Pixels } from "./led";
import "./Cube.css";

type Props = {
  label: string; // 화면 읽기용 설명
  pixels: Pixels;
  x: number; // 패드 위 가운데 자리(0~1 비율)
  y: number;
  line?: string; // 윗면 테두리 색(맡은 창 색)
  selected?: boolean;
  caption?: ReactNode; // 큐브 아래 글자(이름 · 배터리)
  slot?: number; // data-slot(확대 · 초점 되돌리기에 쓴다)
  className?: string; // 더 붙일 클래스(hot · fan-left 등)
  children?: ReactNode; // 큐브에 붙는 것(세 갈래 등)
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

// 패드 위 큐브 하나. 한 변 = 패드 폭의 17.5 %(35 mm / 200 mm).
export function Cube({ label, pixels, x, y, line, selected, caption, slot, className, children, onClick }: Props) {
  const style = { left: `${x * 100}%`, top: `${y * 100}%`, "--cube-line": line } as CSSProperties;
  const cls = ["cube", selected && "selected", className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={cls}
      style={style}
      aria-label={label}
      aria-pressed={selected}
      data-slot={slot}
      onClick={onClick}
    >
      <CubeTop pixels={pixels} />
      {caption && <span className="cube-caption">{caption}</span>}
      {children}
    </button>
  );
}
