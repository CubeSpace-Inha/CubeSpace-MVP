import { Badge } from "../../components/Badge";
import { EFFORTS, type Effort } from "../../model/ai";
import { EFFORT_INFO } from "../../model/aiAdv";

// 고급 설정 · 사용 강도: 실패 시 수정 반복 한도. 맡길 일 카드의 꼼꼼함 탭과 같은 값(시안 toolEffort)
export function EffortTool({ effort, onChange }: { effort: Effort; onChange: (e: Effort) => void }) {
  return (
    <>
      <div className="sec-t sec-row">
        <span>실행 설정 · 어느 정도로 살펴볼까요?</span>
        <Badge>{EFFORTS.find(([v]) => v === effort)![1]}</Badge>
      </div>
      <p className="muted">실패했을 때 수정할 반복 횟수를 정해요. 실제 시간과 사용량은 작업에 따라 달라집니다.</p>
      <div className="efs">
        {EFFORTS.map(([id, label]) => {
          const e = EFFORT_INFO[id];
          return (
            <button key={id} type="button" className={id === effort ? "ef on" : "ef"} aria-pressed={id === effort} onClick={() => onChange(id)}>
              <span className="lv">
                {[0, 1, 2].map((i) => (
                  <i key={i} className={i <= e.rounds ? "f" : undefined} />
                ))}
              </span>
              <b>{label}</b>
              <p>{e.description}</p>
              <small>{e.detail}</small>
            </button>
          );
        })}
      </div>
      <div className="toolnote">
        시작하면 현재 설정을 작업에 고정해요. 진행 중에 바꾸면 다음 작업에 반영됩니다.
        <br />
        ‘사용 강도’는 반복 한도이며, 요금이나 실제 토큰 한도를 설정하는 기능은 아니에요.
      </div>
    </>
  );
}
