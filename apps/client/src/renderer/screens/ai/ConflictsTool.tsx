import type { Snapshot } from "@cubespace/protocol";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { aiIssues } from "../../model/ai";
import { conflictChecks } from "../../model/aiAdv";

// 고급 설정 · 충돌 방지: 시작 전 확인 목록(시안 toolConflicts). 프리셋 문구는 뺐다.
export function ConflictsTool({
  s,
  onFix,
}: {
  s: Snapshot;
  onFix: () => void;
}) {
  const iss = aiIssues(s);
  return (
    <>
      <div className="sec-t sec-row">
        <span>시작 전 확인 · 구성 충돌 방지</span>
        <Badge tone={iss.length ? "warn" : "ok"}>
          {iss.length ? `${iss.length}개 확인 필요` : "준비됨"}
        </Badge>
      </div>
      <p className="muted">
        역할 중복과 프로젝트 중복을 확인해요. 문제가 있으면 시작 버튼에서 실행을
        막습니다.
      </p>
      <ul className="chk">
        {conflictChecks(s).map(([n, ok, d]) => (
          <li key={n} className={ok ? undefined : "bad"}>
            <i>{ok ? "✓" : "!"}</i>
            <div>
              <b>{n}</b>
              <small>{d}</small>
            </div>
            <span>{ok ? "확인됨" : "조정 필요"}</span>
          </li>
        ))}
      </ul>
      {iss.length ? (
        <>
          <div className="vmsg">
            {iss.map((x) => (
              <div key={x}>{x}</div>
            ))}
          </div>
          <Button variant="primary" className="mt" onClick={onFix}>
            배정 상태에서 조정
          </Button>
        </>
      ) : (
        <p className="muted okline">현재 조합으로 작업을 준비할 수 있어요.</p>
      )}
      <div className="toolnote">
        <b>함께 적용되는 규칙</b>
        <br />
        한 번에 작업 하나를 실행하고, 실행 도중 바뀐 큐브 구성은 다음 작업에만
        반영해요. 두 에이전트는 순서대로 작업합니다.
        <br />이 데모는 구조적 충돌만 검사해요. 자연어 지침의 모순과 실제
        파일·도구 충돌 검사는 후속 구현 범위입니다.
      </div>
    </>
  );
}
