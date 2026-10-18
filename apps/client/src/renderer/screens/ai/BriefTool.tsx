import { useState } from "react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { TextArea } from "../../components/TextArea";
import { TextInput } from "../../components/TextInput";

// 작업 구체화 내용. source = 쓸 때의 채팅 요청. 요청이 바뀌면 처음부터 다시 쓴다.
export type Brief = { source: string; scope: string; done: string; exclude: string; confirmed: boolean };
export const emptyBrief = (source: string): Brief => ({ source, scope: "", done: "", exclude: "", confirmed: false });

const EX = { scope: "로그인 화면과 입력 검증", done: "잘못된 이메일을 입력하면 이유를 안내하고 다시 시도할 수 있다", exclude: "서버 API와 디자인 시스템 변경" };

type Props = { brief: Brief; onChange: (b: Brief) => void; show: (t: string) => void };

// 고급 설정 · 작업 구체화: 바꿀 범위 · 완료 기준 · 제외할 것(시안 toolBrief)
export function BriefTool({ brief: b, onChange, show }: Props) {
  const [warn, setWarn] = useState(false);
  const set = (patch: Partial<Brief>) => {
    setWarn(false);
    onChange({ ...b, ...patch, confirmed: false });
  };
  const apply = () => {
    if (!b.done.trim()) return setWarn(true);
    onChange({ ...b, confirmed: true });
    show("작업 구체화 내용을 반영했어요");
  };
  return (
    <>
      <div className="sec-t sec-row">
        <span>작업 준비 · 원하는 결과를 더 분명하게</span>
        <Badge tone={b.confirmed ? "ok" : "neutral"}>{b.confirmed ? "반영됨" : "작성 중"}</Badge>
      </div>
      <p className="muted">변경할 범위와 완료 기준을 정해 두면 같은 요청을 다시 설명할 일이 줄어요.</p>
      <div className="reqbox">
        <small>채팅의 요청</small>
        {b.source || "먼저 위 채팅에 원하는 작업을 적어 주세요."}
      </div>
      <label className="fl" htmlFor="brief-scope">
        어디까지 바꿀까요?
      </label>
      <TextArea id="brief-scope" rows={2} maxLength={1000} placeholder={`예: ${EX.scope}`} value={b.scope} onChange={(e) => set({ scope: e.target.value })} />
      <label className="fl" htmlFor="brief-done">
        어떻게 되면 완료인가요?
      </label>
      <TextArea id="brief-done" rows={2} maxLength={1000} placeholder={`예: ${EX.done}`} value={b.done} onChange={(e) => set({ done: e.target.value })} />
      <label className="fl" htmlFor="brief-exclude">
        제외할 것 <small>선택 사항</small>
      </label>
      <TextInput id="brief-exclude" maxLength={1000} placeholder={`예: ${EX.exclude}`} value={b.exclude} onChange={(e) => set({ exclude: e.target.value })} />
      <div className="acts">
        <Button onClick={() => set(EX)}>입력 예시 채우기</Button>
        <Button variant="primary" disabled={!b.source} onClick={apply}>
          작업에 반영
        </Button>
      </div>
      <p className="muted fb">{warn ? "완료 기준을 한 줄 이상 적어 주세요." : b.confirmed ? "시작할 때 이 내용도 함께 전달됩니다." : "예시는 직접 검토하고 수정해 주세요."}</p>
    </>
  );
}
