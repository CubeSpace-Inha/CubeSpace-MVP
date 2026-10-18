import "./MonitorSwitch.css";

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

// ◀ 모니터 이름 ▶ (시안 .monsw). disabled: 모니터가 하나뿐일 때
export function MonitorSwitch({ label, onPrev, onNext, disabled }: Props) {
  return (
    <div className="monsw">
      <button type="button" aria-label="이전 모니터" disabled={disabled} onClick={onPrev}>
        ◀
      </button>
      <span>{label}</span>
      <button type="button" aria-label="다음 모니터" disabled={disabled} onClick={onNext}>
        ▶
      </button>
    </div>
  );
}
