import "./Switch.css";

type Props = { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void };

// 켜고 끄는 줄: 왼쪽 이름(+ 설명), 오른쪽 스위치.
export function Switch({ label, hint, checked, onChange }: Props) {
  return (
    <div className="sw">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={checked ? "tg on" : "tg"}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
