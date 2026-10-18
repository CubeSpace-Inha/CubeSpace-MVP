import "./Stepper.css";

type Props = {
  label: string; // 무엇을 바꾸는지(화면 읽기용)
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
};

// − 값 + : 정해진 범위 안에서 step씩 바꾼다. 끝에 닿으면 그쪽 버튼이 꺼진다.
export function Stepper({ label, value, min, max, step, unit = "", onChange }: Props) {
  const move = (d: number) => onChange(Math.min(max, Math.max(min, Math.round((value + d * step) * 1000) / 1000)));
  return (
    <span className="stp" role="group" aria-label={label}>
      <button type="button" aria-label={`${label} 줄이기`} disabled={value <= min} onClick={() => move(-1)}>
        −
      </button>
      <b className="num">
        {value}
        {unit}
      </b>
      <button type="button" aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => move(1)}>
        +
      </button>
    </span>
  );
}
