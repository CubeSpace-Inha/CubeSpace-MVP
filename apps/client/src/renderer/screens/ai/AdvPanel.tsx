import { useState } from "react";
import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Cube, Snapshot } from "@cubespace/protocol";
import { Card } from "../../components/Card";
import { PillTabs } from "../../components/PillTabs";
import { Column } from "../../layout/Column";
import type { Effort } from "../../model/ai";
import { proposalBad, proposeTargets, recommendIds } from "../../model/aiAdv";
import { onPad } from "../../model/home";
import { AssignTool } from "./AssignTool";
import { BriefTool, type Brief } from "./BriefTool";
import { choiceActions } from "./choiceActions";
import { ConflictsTool } from "./ConflictsTool";
import { EffortTool } from "./EffortTool";
import { ProfileLib } from "./ProfileLib";
import { ProposalDialog, type Proposal } from "./ProposalDialog";
import { RecommendTool } from "./RecommendTool";
import "./AdvPanel.css";

type Tool = "assignment" | "brief" | "conflicts" | "effort" | "recommend";
const TOOLS: [Tool, string][] = [
  ["assignment", "배정 상태"],
  ["brief", "작업 구체화"],
  ["conflicts", "충돌 방지"],
  ["effort", "사용 강도"],
  ["recommend", "추천 배정"],
];

type Props = {
  s: Snapshot;
  api: CubeSpaceApi;
  running: boolean;
  effort: Effort;
  onEffort: (e: Effort) => void;
  brief: Brief;
  onBrief: (b: Brief) => void;
  show: (t: string) => void;
};

// AI 화면 고급 설정(시안 #aAdv): 도구 카드(탭 5개) + 큐브에 담을 구성 + 추천 배정 미리보기
export function AdvPanel({ s, api, running, effort, onEffort, brief, onBrief, show }: Props) {
  const [vsel, setVsel] = useState(() => (s.cubes.find(onPad) ?? s.cubes[0])?.slot);
  const [tool, setTool] = useState<Tool>("assignment");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const sel = s.cubes.find((c) => c.slot === vsel) ?? s.cubes[0];
  const act = choiceActions(s, api, sel, running, show);
  const select = (c: Cube) => setVsel(c.slot);

  const preview = () => {
    const ids = recommendIds(s, effort);
    setProposal({ ids, targets: proposeTargets(s, ids) });
  };
  // 고른 큐브는 그 구성을 현재 선택으로 · AI 모드로, 전환 목록에도 더한다
  const apply = () => {
    if (!proposal || proposalBad(proposal.targets)) return;
    proposal.ids.forEach((id, i) => {
      const c = s.cubes.find((k) => k.slot === proposal.targets[i])!;
      void api.assignAi(c.slot, id);
      void api.setMode(c.slot, "ai");
      if (!c.aiChoices.includes(id)) void api.setAiChoices(c.slot, [...c.aiChoices, id]);
    });
    setProposal(null);
    setTool("assignment");
    show("배정을 적용했어요. 패드의 참여 구성과 채팅을 확인한 뒤 시작하세요.");
  };

  return (
    <Column>
      <Card n={2} className="aitools">
        <PillTabs label="고급 설정" options={TOOLS} value={tool} onChange={setTool} />
        <div className="cbody">
          {tool === "assignment" && sel && act && (
            <AssignTool
              s={s}
              sel={sel}
              act={act}
              running={running}
              onSelect={select}
              onCheck={() => setTool("conflicts")}
            />
          )}
          {tool === "brief" && <BriefTool brief={brief} onChange={onBrief} show={show} />}
          {tool === "conflicts" && <ConflictsTool s={s} onFix={() => setTool("assignment")} />}
          {tool === "effort" && <EffortTool effort={effort} onChange={onEffort} />}
          {tool === "recommend" && <RecommendTool onPreview={preview} />}
        </div>
      </Card>
      {sel && act && <ProfileLib s={s} sel={sel} onSelect={select} onAdd={act.add} />}
      <ProposalDialog
        s={s}
        p={proposal}
        effort={effort}
        running={running}
        onChange={(targets) => setProposal(proposal && { ...proposal, targets })}
        onClose={() => setProposal(null)}
        onApply={apply}
      />
    </Column>
  );
}
