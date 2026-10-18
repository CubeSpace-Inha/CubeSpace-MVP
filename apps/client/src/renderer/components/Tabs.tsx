import type { CSSProperties } from "react";
import "./Tabs.css";

type Props = { options: string[]; value: number; onChange: (index: number) => void; label?: string; small?: boolean };

// 밑판이 고른 칸으로 미끄러지는 탭(시안 .tabs · .seg를 하나로). small = 설정 줄 오른쪽에 붙는 작은 것(시안 설정 .seg).
export function Tabs({ options, value, onChange, label, small }: Props) {
  const style = { "--n": options.length, "--i": value } as CSSProperties;
  return (
    <div className={small ? "tabs sm" : "tabs"} role="group" aria-label={label} style={style}>
      {options.map((option, i) => (
        <button key={option} type="button" aria-pressed={i === value} onClick={() => onChange(i)}>
          {option}
        </button>
      ))}
    </div>
  );
}
