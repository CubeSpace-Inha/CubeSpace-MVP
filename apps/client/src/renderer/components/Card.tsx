import type { CSSProperties, ReactNode } from "react";
import "./Card.css";

type Props = {
  title?: ReactNode; // 영역 제목
  meta?: ReactNode; // 제목 오른쪽 흐린 글자(개수 등)
  actions?: ReactNode; // 제목 오른쪽 버튼
  scroll?: boolean; // 본문만 스크롤
  n?: number; // 등장 순서(늦게 떠오름)
  className?: string;
  children?: ReactNode;
};

// 영역: 떠 있는 카드 하나.
export function Card({ title, meta, actions, scroll, n = 0, className, children }: Props) {
  const right = actions ? (
    <span className="hr">
      {meta && <em>{meta}</em>}
      {actions}
    </span>
  ) : (
    meta && <em>{meta}</em>
  );
  return (
    <section className={className ? `card ${className}` : "card"} style={{ "--n": n } as CSSProperties}>
      {title && (
        <h2>
          <span>{title}</span>
          {right}
        </h2>
      )}
      {scroll ? <div className="cbody">{children}</div> : children}
    </section>
  );
}
