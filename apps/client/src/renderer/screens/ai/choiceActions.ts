import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Cube, Snapshot } from "@cubespace/protocol";
import { moveChoice, nextChoice, padOn, profName, removeChoice } from "../../model/aiAdv";

// 고른 큐브의 AI 전환 목록 조작(시안 addChoice · touchCube · pick · removeChoice · moveChoice). 결과는 토스트로 알린다.
export function choiceActions(s: Snapshot, api: CubeSpaceApi, c: Cube | undefined, running: boolean, show: (t: string) => void) {
  if (!c) return null;
  const name = (id: string | null) => profName(s, id);
  return {
    add(id: string) {
      if (c.aiChoices.includes(id)) return show("이미 이 큐브의 전환 목록에 있어요.");
      void api.setAiChoices(c.slot, [...c.aiChoices, id]);
      if (!c.ai) void api.assignAi(c.slot, id);
      show(`큐브 ${c.name} 전환 목록에 ‘${name(id)}’ 추가 · ${c.aiChoices.length + 1}개`);
    },
    touch() {
      if (!padOn(s)) return show("패드를 연결하면 터치로 전환할 수 있어요");
      const n = nextChoice(s, c);
      if (!n) return show("전환할 수 있는 다음 항목이 없어요. 목록에 항목을 추가해 주세요.");
      void api.assignAi(c.slot, n);
      show(`큐브 ${c.name} 터치 → ${name(n)}${running ? " · 다음 작업 구성에 반영됩니다." : ""}`);
    },
    pick(id: string) {
      void api.assignAi(c.slot, id);
      show(`큐브 ${c.name} 현재 선택 → ${name(id)}`);
    },
    remove(id: string) {
      const was = c.ai === id;
      const r = removeChoice(s, c, id);
      void api.setAiChoices(c.slot, r.list);
      if (was) void api.assignAi(c.slot, r.cur);
      show(`전환 목록에서 뺐어요.${was ? ` 현재 선택: ${name(r.cur)}` : " 원래 항목은 전체 목록에 남아 있어요."}`);
    },
    move(id: string, d: number) {
      void api.setAiChoices(c.slot, moveChoice(c.aiChoices, id, d));
    },
  };
}
