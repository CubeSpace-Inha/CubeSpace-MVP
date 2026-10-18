import type { CSSProperties } from "react";
import { CubeState, type CubeStateKind } from "./CubeState";
import { LedIcon } from "./LedIcon";
import type { Pixels } from "./led";
import "./CubeList.css";

export type CubeInfo = { id: string; name: string; pixels: Pixels; color: string; state: CubeStateKind; pct: number; win?: string };

type Props = { placed: CubeInfo[]; tray: CubeInfo[]; slots?: number; selected?: string; onSelect?: (id: string) => void };

// 창 화면 왼쪽: 패드 위 칸(최대 slots개, 나머지는 빈 칸) + 패드 밖 큐브 칩.
export function CubeList({ placed, tray, slots = 4, selected, onSelect }: Props) {
  const sel = (c: CubeInfo) => ({ "--sel": c.color }) as CSSProperties;
  return (
    <div className="clist">
      <div className="csub">패드 위</div>
      <div className="cgrid">
        {placed.map((c) => (
          <button key={c.id} type="button" className={c.id === selected ? "ctile on" : "ctile"} style={sel(c)} onClick={() => onSelect?.(c.id)}>
            <LedIcon pixels={c.pixels} size={40} />
            <span className="tn">
              <b className="num">큐브 {c.name}</b>
              <CubeState kind={c.state} color={c.color} />
            </span>
            <span className="ta">{c.win ? `${c.win}${c.state === "off" ? " · 꺼짐" : ""}` : "묶인 창 없음"}</span>
          </button>
        ))}
        {Array.from({ length: Math.max(0, slots - placed.length) }, (_, i) => (
          <div key={i} className="cempty">빈 칸</div>
        ))}
      </div>
      {tray.length > 0 && (
        <>
          <div className="csub">
            패드 밖<small>패드에 올리면 창을 배치할 수 있어요</small>
          </div>
          <div className="ctray">
            {tray.map((c) => (
              <button key={c.id} type="button" className={c.id === selected ? "ctc on" : "ctc"} style={sel(c)} onClick={() => onSelect?.(c.id)}>
                <LedIcon pixels={c.pixels} size={28} />
                <span>{c.name}</span>
                {c.pct < 25 && <em className="cbat num">{c.pct}%</em>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
