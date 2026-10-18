import type { CSSProperties } from "react";
import { Icon } from "../components/Icon";
import { CubeTop } from "./CubeTop";
import type { Pixels } from "./led";
import "./SpareTray.css";

export type SpareCube = { name: string; pixels: Pixels; pct: number; line?: string; charging?: boolean; label: string };

type Props = { cells: (SpareCube | null)[]; onSelect?: (index: number) => void };

// 안 쓰는 큐브 칸(패드 밖에 있는 큐브). 칸마다 이름 · 세로 배터리 막대, 충전 중이면 번개와 주황 테두리.
export function SpareTray({ cells, onSelect }: Props) {
  return (
    <div className="spare-body">
      <div className="spare-grid">
        {cells.map((c, i) => {
          if (!c) return <span key={i} className="spare-cell" />;
          const lvl = c.pct <= 10 ? " low10" : c.pct <= 30 ? " low30" : "";
          return (
            <button
              key={i}
              type="button"
              className={c.charging ? "spare-cell charging" : "spare-cell"}
              style={{ "--cube-line": c.line } as CSSProperties}
              aria-label={c.label}
              title={c.label}
              onClick={() => onSelect?.(i)}
            >
              <span className="cube">
                <CubeTop pixels={c.pixels} />
              </span>
              <b className="cell-name">{c.name}</b>
              {c.charging && (
                <span className="cell-bolt" aria-hidden="true">
                  <Icon name="bolt" size={11} stroke={2.4} />
                </span>
              )}
              <span className={`cell-batt${lvl}`}>
                <i style={{ height: `${c.pct}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
