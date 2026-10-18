import { LedIcon } from "../../cube/LedIcon";
import { appIcon } from "../../model/home";
import type { PickItem } from "../../model/windows";
import "./PickList.css";

// 큐브에 묶을 것 고르기: 담당 없는 열린 창 → 등록된 프로그램(시안 .cpk)
export function PickList({ items, onPick }: { items: PickItem[]; onPick: (item: PickItem) => void }) {
  return (
    <div className="cpk" role="group" aria-label="무엇을 열지 고르기">
      {items.map((x, i) => (
        <div key={x.window?.id ?? x.app}>
          {items[i - 1]?.group !== x.group && <small>{x.group}</small>}
          <button type="button" onClick={() => onPick(x)}>
            <LedIcon pixels={appIcon(x.app)} size={20} />
            <span>{x.app}</span>
            <em>{x.note}</em>
          </button>
        </div>
      ))}
    </div>
  );
}
