import type { ReactNode } from "react";
import "./Chip.css";

type Props = { icon?: ReactNode; label: string; onRemove: () => void };

// 빼기 칩: 아이콘 + 이름 + ✕. 누르면 목록에서 뺀다(예: 건너뛸 프로그램). 여러 개는 .chips로 감싼다.
export function Chip({ icon, label, onRemove }: Props) {
  return (
    <button type="button" className="chip" title="빼기" aria-label={`${label} 빼기`} onClick={onRemove}>
      {icon}
      {label}
      <i aria-hidden="true">✕</i>
    </button>
  );
}
