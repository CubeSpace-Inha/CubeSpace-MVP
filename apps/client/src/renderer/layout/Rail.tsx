import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "../components/Icon";
import { RailButton } from "./RailButton";
import "./Rail.css";

export type RailItem = { icon: IconName; label: string };

type Props = { items: RailItem[]; current: number; onSelect: (index: number) => void; children?: ReactNode };

// 왼쪽 메뉴: 아이콘만 있는 세로 막대. 고른 항목의 밑판(.rthumb)이 미끄러져 옮겨 간다. children은 아래 묶음(알림 · 테마 등).
export function Rail({ items, current, onSelect, children }: Props) {
  return (
    <nav className="rail float" aria-label="주 메뉴" style={{ "--n": 2 } as CSSProperties}>
      <div className="rnav" style={{ "--vi": current } as CSSProperties}>
        <i className="rthumb" aria-hidden="true" />
        {items.map((item, i) => (
          <RailButton key={item.label} label={item.label} current={i === current} onClick={() => onSelect(i)}>
            <Icon name={item.icon} size={22} />
          </RailButton>
        ))}
      </div>
      <div className="rbot">{children}</div>
    </nav>
  );
}
