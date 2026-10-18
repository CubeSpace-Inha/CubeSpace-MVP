import { LedMatrix } from "./LedMatrix";
import type { Pixels } from "./led";
import "./CubeTop.css";

// 큐브 윗면: 어두운 타일(두께 그림자 포함) 안에 8 × 8. 크기는 감싸는 .cube 폭(cqw)을 따른다.
export function CubeTop({ pixels }: { pixels: Pixels }) {
  return (
    <span className="cube-top">
      <LedMatrix pixels={pixels} className="cube-win" />
    </span>
  );
}
