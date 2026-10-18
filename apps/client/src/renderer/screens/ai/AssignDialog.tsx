import type { CSSProperties } from "react";
import type { Cube, Profile, Snapshot } from "@cubespace/protocol";
import { Dialog } from "../../components/Dialog";
import { profOf } from "../../model/home";
import { cubeCol, linked } from "../../model/ai";
import "./AssignDialog.css";

type Props = { s: Snapshot; profile: Profile | null; onClose: () => void; onSet: (cube: Cube | null) => void };

// 구성을 눌렀을 때: 어느 큐브에(다른 큐브가 쓰던 구성이면 맞바꿈) · 배정 해제(시안 assignDialog)
export function AssignDialog({ s, profile: p, onClose, onSet }: Props) {
  const cur = p && s.cubes.find((c) => c.ai === p.id);
  return (
    <Dialog open={!!p} onClose={onClose} title={p ? `${p.name} · 어느 큐브에?` : ""}>
      <div className="aopts">
        {s.cubes.filter(linked).map((c) => {
          const now = profOf(s, c);
          const hint = cur === c ? "지금 이 큐브가 써요" : now ? `지금: ${now.name}${cur ? " → 맞바꿈" : ""}` : "배정 없음";
          return (
            <button key={c.slot} type="button" className={cur === c ? "aopt on" : "aopt"} onClick={() => onSet(c)}>
              <span className="tok" style={{ "--c": cubeCol(c) } as CSSProperties}>{c.name}</span>
              <span className="oc">
                <b>큐브 {c.name}</b>
                <small>{hint}</small>
              </span>
              {cur === c && <em>지금</em>}
            </button>
          );
        })}
        {cur && (
          <button type="button" className="aopt" onClick={() => onSet(null)}>
            <span className="oc">
              <b>배정 해제</b>
              <small>큐브 {cur.name}에서 빼요</small>
            </span>
          </button>
        )}
      </div>
    </Dialog>
  );
}
