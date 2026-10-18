import type { ReactNode } from "react";
import "./SectionTitle.css";

type Props = { hint?: ReactNode; children: ReactNode };

// 영역 안의 소제목. hint는 옆에 흐리게.
export function SectionTitle({ hint, children }: Props) {
  return (
    <h3 className="sec-t">
      {children}
      {hint && <small>{hint}</small>}
    </h3>
  );
}
