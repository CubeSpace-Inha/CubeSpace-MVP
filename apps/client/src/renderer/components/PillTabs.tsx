import "./PillTabs.css";

type Props<T extends string> = { options: [T, string][]; value: T; onChange: (id: T) => void; label?: string };

// 알약 모양 탭 줄(시안 .ptabs). 고른 것은 진하게. 미끄러지는 Tabs와 달리 칸이 따로 떠 있다.
export function PillTabs<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div className="ptabs" role="group" aria-label={label}>
      {options.map(([id, name]) => (
        <button key={id} type="button" className={id === value ? "on" : undefined} aria-pressed={id === value} onClick={() => onChange(id)}>
          {name}
        </button>
      ))}
    </div>
  );
}
