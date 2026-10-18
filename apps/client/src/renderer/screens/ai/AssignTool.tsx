import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import type { Cube, Snapshot } from "@cubespace/protocol";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { aiIssues, candidates, candProfiles, cubeCol, linked } from "../../model/ai";
import { kindLine, nextChoice, padOn, profName, rackCard, touchHint } from "../../model/aiAdv";
import { onPad } from "../../model/home";
import type { choiceActions } from "./choiceActions";

type Props = {
  s: Snapshot;
  sel: Cube;
  act: NonNullable<ReturnType<typeof choiceActions>>;
  running: boolean;
  onSelect: (c: Cube) => void;
  onCheck: () => void; // 충돌 방지 탭으로
};

// 고급 설정 · 배정 상태: 내 큐브(현재 선택과 다음 터치) · 터치 전환 목록 · 준비 상태(시안 toolAssign · rackHTML · touchHTML)
export function AssignTool({ s, sel, act, running, onSelect, onCheck }: Props) {
  const [edit, setEdit] = useState(false);
  const navigate = useNavigate();
  const iss = aiIssues(s);
  const ag = candProfiles(s).filter((p) => p.kind === "agent").length;
  const nx = nextChoice(s, sel);
  const t = touchHint(s, sel, running);
  const l = sel.aiChoices;
  return (
    <>
      <div className="sec-t sec-row">
        <span>내 큐브 · 현재 선택과 다음 터치</span>
        <span>AI 모드 · 패드 위 {candidates(s).length}개</span>
      </div>
      <div className="rack">
        {s.cubes.map((c) => {
          const r = rackCard(s, c);
          return (
            <button
              key={c.slot}
              type="button"
              className={["ccard", c === sel && "on", !linked(c) && "off"].filter(Boolean).join(" ")}
              style={{ "--c": cubeCol(c) } as CSSProperties}
              aria-pressed={c === sel}
              onClick={() => onSelect(c)}
            >
              <span className="ct">
                <span className="tok">{c.name}</span>큐브 {c.name}
                <span className={onPad(c) ? "pl on" : "pl"}>{r.place}</span>
              </span>
              <span className="cn">
                <em>현재</em>
                {r.cur}
              </span>
              <small>{r.detail}</small>
              <span className="cf">{r.foot}</span>
            </button>
          );
        })}
      </div>
      {running && (
        <div className="toolnote">
          <b>다음 작업을 준비하고 있어요.</b> 현재 실행은 시작 당시 구성으로 계속됩니다.
        </div>
      )}
      <div className="touch">
        <div className="touch-h">
          <span className="tok" style={{ "--c": cubeCol(sel) } as CSSProperties}>
            {sel.name}
          </span>
          <h3>
            터치 전환 목록<small>{l.length}개</small>
          </h3>
          <Button size="sm" variant={edit ? "primary" : "sub"} onClick={() => setEdit(!edit)}>
            {edit ? "편집 완료" : "순서·목록 편집"}
          </Button>
        </div>
        <p className="muted">선택한 큐브를 한 번 터치할 때마다 다음 항목으로 바뀝니다.</p>
        <ol className="tl">
          {l.map((id, i) => {
            const isC = id === sel.ai;
            const isN = id === nx;
            const name = profName(s, id);
            return (
              <li key={id} className={isC ? "cur" : isN ? "nx" : undefined}>
                <span className="qn">{i + 1}</span>
                <div className="qc">
                  <b>{name}</b>
                  <small>{kindLine(s.profiles.find((p) => p.id === id))}</small>
                </div>
                <span className="qs">{isC ? <Badge tone="ok">현재 선택</Badge> : isN && <Badge>다음 터치</Badge>}</span>
                {edit ? (
                  <div className="qe">
                    <Button size="sm" aria-label={`${name} 위로`} disabled={i === 0} onClick={() => act.move(id, -1)}>
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      aria-label={`${name} 아래로`}
                      disabled={i === l.length - 1}
                      onClick={() => act.move(id, 1)}
                    >
                      ↓
                    </Button>
                    <Button size="sm" className="gh dg" aria-label={`${name} 빼기`} onClick={() => act.remove(id)}>
                      빼기
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="gh"
                    aria-label={`${name} ${isC ? "선택됨" : "선택"}`}
                    disabled={isC}
                    onClick={() => act.pick(id)}
                  >
                    {isC ? "선택됨" : "선택"}
                  </Button>
                )}
              </li>
            );
          })}
          {!l.length && (
            <li className="empty-q">
              아직 전환할 항목이 없어요.
              <br />
              오른쪽 목록의 ‘추가’를 눌러 담아 주세요.
            </li>
          )}
        </ol>
        <div className="tfoot">
          <div>
            <b>{t.hint}</b>
            <small>{t.note}</small>
          </div>
          <Button variant="primary" className="touchbtn" disabled={!padOn(s) || !nx} onClick={act.touch}>
            ↻ 터치해 보기
          </Button>
        </div>
      </div>
      <div className="cfoot">
        <i className={iss.length ? "w" : undefined} />
        <span>{iss.length ? iss[0] : `프로젝트 1개 · 에이전트 ${ag}개 준비됨`}</span>
        <Button size="sm" onClick={() => navigate("/home")}>
          홈에서 큐브 보기
        </Button>
        <Button size="sm" className="gh" onClick={onCheck}>
          구성 확인
        </Button>
      </div>
    </>
  );
}
