import type { ReactNode } from "react";

type Props = { label: string; current?: boolean; badge?: number; onClick?: () => void; children: ReactNode };

// 왼쪽 메뉴의 아이콘 버튼. 올리거나 초점을 두면 오른쪽에 label이 뜬다. 스타일은 Rail.css.
export function RailButton({ label, current, badge, onClick, children }: Props) {
  return (
    <button
      type="button"
      className="rbtn"
      data-tip={label}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
    >
      {children}
      {badge ? <b className="num">{badge}</b> : null}
    </button>
  );
}
