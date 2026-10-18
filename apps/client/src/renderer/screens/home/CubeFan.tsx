import type { CSSProperties } from "react";
import { LedIcon } from "../../cube/LedIcon";
import type { Branch } from "../../model/home";
import "./CubeFan.css";

// 세 갈래 카드 60 px · 간격 18 px → 높이 216, 가지 끝 y = 30 · 108 · 186(가운데 = 창)
const FAN_W = 96;
const FAN_Y = [30, 108, 186];

// 큐브에 올렸을 때(또는 메뉴의 연결 점에 올렸을 때 .hot) 펴지는 세 갈래: 패드 무선 · 창 · AI. 시안 fanHTML.
// 선은 큐브 쪽(뿌리)에서 카드 쪽으로 그려 흐름이 바깥으로 간다. left = 왼쪽으로 편다.
export function CubeFan({ branches, left }: { branches: Branch[]; left: boolean }) {
  const x0 = left ? FAN_W : 0;
  const x1 = FAN_W - x0;
  const m = FAN_W / 2;
  return (
    <span className="fan" aria-hidden="true">
      <svg width={FAN_W} height="216" viewBox={`0 0 ${FAN_W} 216`}>
        {branches.map((b, i) => {
          const d = `M${x0} 108 C${m} 108 ${m} ${FAN_Y[i]} ${x1} ${FAN_Y[i]}`;
          const cls = `k-${b.kind}${b.on ? " on" : ""}`;
          const style = { "--c": b.color } as CSSProperties;
          return (
            <g key={i}>
              <path className={cls} style={style} d={d} />
              {b.on && b.kind === "ok" && <path className="flow" d={d} />}
              <circle className={cls} style={style} cx={x1} cy={FAN_Y[i]} r="3.5" />
            </g>
          );
        })}
        <circle className="root" cx={x0} cy="108" r="4" />
      </svg>
      <span className="fan-labels">
        {branches.map((b, i) => (
          <span
            key={i}
            className={`fan-label k-${b.kind}${b.on ? " on" : ""}`}
            style={{ "--i": i, "--c": b.color } as CSSProperties}
          >
            {b.icon ? <LedIcon pixels={b.icon} size={30} /> : <i className={`cdot k-${b.kind}`} />}
            <span>
              <small>
                {b.head}
                {b.note && ` · ${b.note}`}
              </small>
              <b>{b.text}</b>
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
