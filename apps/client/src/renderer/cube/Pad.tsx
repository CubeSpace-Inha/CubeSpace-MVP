import type { CSSProperties, ReactNode } from "react";
import { PAD_COLS, PAD_ROWS, type PadLed } from "./led";
import "./Pad.css";

type Props = {
  leds?: PadLed[]; // 켜진 패드 LED
  frozen?: boolean; // 패드 세션 끊김: 큐브가 회색(판정 동결)
  dim?: boolean; // hot 큐브 말고 나머지를 흐리게
  children?: ReactNode; // 큐브들
};

// 패드(200 × 133.3 mm, 3:2): 판 면 · LED 24 × 16 · 위에 올린 큐브. 폭은 감싸는 쪽을 가득 채운다.
export function Pad({ leds = [], frozen, dim, children }: Props) {
  return (
    <div className="padbox">
      <div className="padsurf" />
      <div className={["pad", frozen && "frozen", dim && "dim"].filter(Boolean).join(" ")}>
        <div className="pad-leds" />
        <div className="pad-lit">
          {leds.map((l) => {
            const left = `${(((l.i % PAD_COLS) + 0.5) / PAD_COLS) * 100}%`;
            const top = `${((Math.floor(l.i / PAD_COLS) + 0.5) / PAD_ROWS) * 100}%`;
            return <i key={l.i} className="led" style={{ left, top, "--c": l.color, "--b": l.b } as CSSProperties} />;
          })}
        </div>
        {children}
      </div>
    </div>
  );
}
