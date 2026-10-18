import "./Battery.css";

// 배터리 잔량(가로 막대 + %). 30 % 이하 주황, 10 % 이하 빨강.
export function Battery({ pct }: { pct: number }) {
  const lvl = pct <= 10 ? " low10" : pct <= 30 ? " low30" : "";
  return (
    <span className={`cap-batt${lvl}`}>
      <span className="batt">
        <i style={{ width: `${pct}%` }} />
      </span>
      <span className="num">{pct} %</span>
    </span>
  );
}
