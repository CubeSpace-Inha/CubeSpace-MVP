import { useState, type CSSProperties } from "react";
import type { Cube, ProfileKind, Snapshot } from "@cubespace/protocol";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PillTabs } from "../../components/PillTabs";
import { cubeCol } from "../../model/ai";
import { KIND_GLYPH, plc } from "../../model/aiAdv";
import { KIND_TEXT } from "../../model/status";

type Props = {
  s: Snapshot;
  sel: Cube;
  onSelect: (c: Cube) => void;
  onAdd: (id: string) => void;
};

// 큐브에 담을 구성: 큐브를 고르고 전환 후보를 추가한다(시안 renderAILib). 프리셋 · 구성 만들기/편집은 뺐다.
export function ProfileLib({ s, sel, onSelect, onAdd }: Props) {
  const [pf, setPf] = useState<"all" | ProfileKind>("all");
  const kinds = (Object.keys(KIND_TEXT) as ProfileKind[]).filter((k) => s.profiles.some((p) => p.kind === k));
  const list = s.profiles.filter((p) => pf === "all" || p.kind === pf);
  return (
    <Card title="큐브에 담을 구성" n={3} className="ailib">
      <p className="muted lead">큐브를 고르고 전환 후보를 추가하세요.</p>
      <div className="picker">
        {s.cubes.map((c) => (
          <button
            key={c.slot}
            type="button"
            className={c === sel ? "on" : undefined}
            style={{ "--c": cubeCol(c) } as CSSProperties}
            aria-pressed={c === sel}
            onClick={() => onSelect(c)}
          >
            큐브 {c.name}
            <small>
              {plc(c)} · {c.mode === "ai" ? "AI" : "창"}
            </small>
          </button>
        ))}
      </div>
      <PillTabs label="구성 목록" options={[["available", "전환 가능 목록"]]} value="available" onChange={() => {}} />
      <div className="cbody">
        <div className="pfilters" role="group" aria-label="종류">
          {(["all", ...kinds] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={pf === k ? "on" : undefined}
              aria-pressed={pf === k}
              onClick={() => setPf(k)}
            >
              {k === "all" ? "전체" : KIND_TEXT[k]}
            </button>
          ))}
        </div>
        <ul className="lib">
          {list.map((p) => {
            const added = sel.aiChoices.includes(p.id);
            return (
              <li key={p.id} className={added ? "added" : undefined}>
                <span className="lsym">{KIND_GLYPH[p.kind]}</span>
                <div className="lcopy">
                  <small>
                    {KIND_TEXT[p.kind]}
                    {p.kind === "prompt" && " · md"}
                  </small>
                  <b>{p.name}</b>
                  <span>{p.kind === "project" ? p.detail.split(/[\\/]/).pop() : p.detail}</span>
                </div>
                <div className="lact">
                  <Button
                    size="sm"
                    className={added ? "gh" : undefined}
                    aria-label={`${p.name} ${added ? "추가됨" : "추가"}`}
                    disabled={added}
                    onClick={() => onAdd(p.id)}
                  >
                    {added ? "추가됨" : "+ 추가"}
                  </Button>
                </div>
              </li>
            );
          })}
          {!list.length && (
            <li className="lempty">
              아직 저장한 구성이 없어요.
              <br />이 종류의 구성을 하나 만들어 보세요.
            </li>
          )}
        </ul>
        <p className="muted tail">
          후보는 여러 개, 현재 선택은 큐브마다 하나.
          <br />
          큐브의 이름이나 위치에 역할이 고정되지 않아요.
        </p>
      </div>
    </Card>
  );
}
