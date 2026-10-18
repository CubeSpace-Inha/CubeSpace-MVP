import type { ReactNode } from "react";
import "./Rows.css";

export type RowItem = { key: string; title: ReactNode; value?: ReactNode; note?: ReactNode; dot?: string; lead?: ReactNode };

// 상태 목록: 줄마다 색 점(또는 lead) · 이름 · 값, 필요하면 아래에 설명 한 줄.
export function Rows({ items }: { items: RowItem[] }) {
  return (
    <ul className="rows">
      {items.map((r) => (
        <li key={r.key}>
          {r.lead}
          {r.dot && <i className="tdot" style={{ background: r.dot, boxShadow: `0 0 8px ${r.dot}` }} />}
          <b>{r.title}</b>
          {r.value != null && <span>{r.value}</span>}
          {r.note && <p>{r.note}</p>}
        </li>
      ))}
    </ul>
  );
}
