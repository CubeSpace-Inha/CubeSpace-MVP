import { useCallback, useState, type CSSProperties } from "react";
import { useOutletContext } from "react-router";
import type { Cube, Profile } from "@cubespace/protocol";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Tabs } from "../components/Tabs";
import { TextArea } from "../components/TextArea";
import { Toast } from "../components/Toast";
import { LedIcon } from "../cube/LedIcon";
import { useToast } from "../hooks/useToast";
import type { LayoutContext } from "../layout/AppLayout";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";
import { aiStatus, cubeCol, EFFORTS, GOAL_EX, linked, pipeline, profileGroups, recommend, runProfiles, type Effort } from "../model/ai";
import { onPad, profileIcon } from "../model/home";
import { AdvPanel } from "./ai/AdvPanel";
import { AssignDialog } from "./ai/AssignDialog";
import { emptyBrief, type Brief } from "./ai/BriefTool";
import { RunCard } from "./ai/RunCard";
import { useAiRun } from "./ai/useAiRun";
import "./AiScreen.css";

// AI 모드(시안 pad-home.html .aiv): 맡길 일 · 구성 목록(쓰는 큐브 색) · 꼼꼼함 · 추천으로 채우기 · 시작.
// 프리셋은 뺐으므로(팀 결정) 개별 구성을 바로 큐브에 배정한다. 고급 설정을 펴면 오른쪽에 도구 카드가 붙는다.
export function AiScreen() {
  const { snapshot: s, api } = useOutletContext<LayoutContext>();
  const [goal, setGoal] = useState("");
  const [effort, setEffort] = useState<Effort>("balanced");
  const [target, setTarget] = useState<Profile | null>(null);
  const [adv, setAdv] = useState(false);
  const [brief, setBrief] = useState<Brief>(() => emptyBrief(""));
  const toast = useToast();
  const { show } = toast;
  const onDone = useCallback(() => show("AI 작업이 완료됐어요"), [show]);
  const ai = useAiRun(onDone);
  const status = aiStatus(s, goal, ai.running);
  // 작업 구체화는 채팅 요청이 바뀌면 처음부터(시안 ensureBrief)
  const b = brief.source === goal.trim() ? brief : emptyBrief(goal.trim());

  // 프로젝트 · 에이전트를 받은 큐브는 AI 모드로 둔다(시안 autoPlace. 패드에 올리는 건 사람이 한다)
  const give = (slot: Cube["slot"], p: Profile) => {
    void api.assignAi(slot, p.id);
    if (p.kind === "project" || p.kind === "agent") void api.setMode(slot, "ai");
  };
  const fill = () => {
    const r = recommend(s);
    r.forEach((x) => give(x.slot, x.profile));
    show("추천 구성으로 채웠어요");
    return r.map((x) => x.profile);
  };
  const start = () => {
    const l = runProfiles(s, fill());
    const names = [...l.filter((p) => p.kind === "project"), ...l.filter((p) => p.kind === "agent")].map((p) => p.name);
    ai.start(pipeline(l), names);
  };
  const assign = (c: Cube | null) => {
    if (!target) return;
    const cur = s.cubes.find((k) => k.ai === target.id);
    if (c) {
      give(c.slot, target);
      show(`${target.name} · 큐브 ${c.name}`);
    } else if (cur) {
      void api.assignAi(cur.slot, null);
      show(`${target.name} 배정을 풀었어요`);
    }
    setTarget(null);
  };

  return (
    <Board columns={adv ? "minmax(0, 620px) minmax(0, 1fr)" : "minmax(0, 760px)"}>
      <h1 className="sr-only">AI 모드</h1>
      <Column>
        <Card title="AI에게 맡길 일" meta={ai.running && <Badge tone="ok">진행 중</Badge>} className="ai-chat">
          <div className="composer">
            <TextArea aria-label="맡길 일" rows={5} maxLength={2000} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={`무엇을 맡길까요? 예: ${GOAL_EX.feature}`} />
            <div className="chs">
              <button type="button" onClick={() => setGoal(GOAL_EX.feature)}>기능 만들기</button>
              <button type="button" onClick={() => setGoal(GOAL_EX.bug)}>버그 고치기</button>
            </div>
          </div>
          <section className="asec" aria-label="구성">
            <h3>
              구성 <em>색 = 배정된 큐브 · 눌러서 바꾸기</em>
            </h3>
            <div className="alegend">
              {s.cubes.filter(linked).map((c) => (
                <span key={c.slot} className="lchip" style={{ "--c": cubeCol(c) } as CSSProperties}>
                  <i />
                  {c.name}
                </span>
              ))}
            </div>
            <div className="alist">
              {profileGroups(s).map((g) => (
                <div key={g.kind}>
                  <div className="agroup">{g.name}</div>
                  {g.items.map(({ p, cube: c, sub }) => (
                    <button
                      key={p.id}
                      type="button"
                      className={c ? "arow on" : "arow"}
                      style={{ "--c": c ? cubeCol(c) : "transparent" } as CSSProperties}
                      aria-label={`${g.name} ${p.name}. ${c ? `큐브 ${c.name} 배정` : "배정 없음"}. 눌러서 큐브 고르기`}
                      onClick={() => setTarget(p)}
                    >
                      <LedIcon pixels={profileIcon(p)} size={30} />
                      <span className="oc">
                        <b>{p.name}</b>
                        <small>{sub}</small>
                      </span>
                      {c ? (
                        <span className="atag" style={{ "--c": cubeCol(c) } as CSSProperties}>
                          큐브 {c.name}
                          {!onPad(c) && " · 패드 밖"}
                        </span>
                      ) : (
                        <span className="atag none">배정 없음</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <div className="aibar">
            <Tabs label="얼마나 꼼꼼하게" options={EFFORTS.map(([, n]) => n)} value={EFFORTS.findIndex(([v]) => v === effort)} onChange={(i) => setEffort(EFFORTS[i]![0])} />
            <div className="aibar-r">
              <Button onClick={fill}>✦ 추천으로 채우기</Button>
              <Button variant="primary" disabled={!goal.trim() || ai.running} onClick={start}>
                ▶ 시작
              </Button>
            </div>
          </div>
          <p className={`astatus ${status.kind}`} role="status">
            {status.text}
          </p>
        </Card>
        {ai.run && <RunCard run={ai.run} onStop={ai.stop} onReset={ai.reset} />}
        <button type="button" className="advbtn" aria-expanded={adv} onClick={() => setAdv(!adv)}>
          {adv ? "고급 설정 접기 ▴" : "고급 설정 ▾"}
        </button>
      </Column>
      {adv && <AdvPanel s={s} api={api} running={ai.running} effort={effort} onEffort={setEffort} brief={b} onBrief={setBrief} show={show} />}
      <AssignDialog s={s} profile={target} onClose={() => setTarget(null)} onSet={assign} />
      <Toast text={toast.text} visible={toast.visible} />
    </Board>
  );
}
