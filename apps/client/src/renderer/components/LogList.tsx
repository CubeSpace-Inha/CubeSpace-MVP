import "./LogList.css";

export type LogItem = { id: string | number; text: string; time: string; color?: string; err?: boolean };

// 최근 기록: 색 점 · 내용 · 시각. 새 기록이 위로 온다(순서는 넘기는 쪽이 정한다).
export function LogList({ items }: { items: LogItem[] }) {
  return (
    <ul className="log">
      {items.map((it) => (
        <li key={it.id} className={it.err ? "err" : undefined}>
          <i style={it.color ? { background: it.color, boxShadow: `0 0 8px ${it.color}` } : undefined} />
          {it.text}
          <time className="num">{it.time}</time>
        </li>
      ))}
    </ul>
  );
}
