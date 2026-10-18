import type { Snapshot } from "@cubespace/protocol";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { Select } from "../../components/Select";
import { EFFORTS, linked, type Effort } from "../../model/ai";
import { plc, profName, proposalBad } from "../../model/aiAdv";
import { KIND_TEXT } from "../../model/status";

export type Proposal = { ids: string[]; targets: number[] }; // 구성마다 담을 큐브 slot(-1 = 아직 안 고름)

type Props = {
  s: Snapshot;
  p: Proposal | null;
  effort: Effort;
  running: boolean;
  onChange: (targets: number[]) => void;
  onClose: () => void;
  onApply: () => void;
};

// 추천 배정 미리보기: 구성마다 담을 큐브를 고르고 바뀔 내용을 본다(시안 proposalDialog)
export function ProposalDialog({
  s,
  p,
  effort,
  running,
  onChange,
  onClose,
  onApply,
}: Props) {
  const bad = !p || proposalBad(p.targets);
  return (
    <Dialog
      open={!!p}
      onClose={onClose}
      title="추천 배정 · 배정 미리보기"
      actions={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" disabled={bad} onClick={onApply}>
            이 배정 적용
          </Button>
        </>
      }
    >
      {p && (
        <>
          <p>
            각 구성을 담을 큐브를 고르세요. 현재 선택은 아래처럼 바뀌고, 전환
            후보는 유지됩니다. 고른 큐브는 AI 모드로 바뀝니다.
          </p>
          {p.ids.map((id, i) => {
            const pr = s.profiles.find((x) => x.id === id);
            return (
              <div key={id} className="prow">
                <div>
                  <small>{pr ? KIND_TEXT[pr.kind] : "구성"}</small>
                  <b>{pr?.name ?? "삭제된 구성"}</b>
                </div>
                <Select
                  aria-label={`${pr?.name ?? "구성"} 담을 큐브`}
                  value={p.targets[i]}
                  onChange={(e) =>
                    onChange(
                      p.targets.map((t, k) =>
                        k === i ? Number(e.target.value) : t,
                      ),
                    )
                  }
                >
                  <option value={-1}>큐브 선택</option>
                  {s.cubes.map((c) => (
                    <option key={c.slot} value={c.slot} disabled={!linked(c)}>
                      큐브 {c.name} · {plc(c)}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
          <div className="chg">
            {s.cubes.map((c) => {
              const k = p.targets.indexOf(c.slot);
              return (
                <p key={c.slot}>
                  <b>큐브 {c.name}</b>
                  <span>
                    {profName(s, c.ai)} →{" "}
                    {profName(s, k < 0 ? null : p.ids[k]!)}
                  </span>
                </p>
              );
            })}
          </div>
          {bad && (
            <p className="vmsg">구성마다 서로 다른 큐브를 선택해 주세요.</p>
          )}
          <p>
            사용 강도: {EFFORTS.find(([v]) => v === effort)![1]}. 큐브의 물리적
            위치는 유지돼요. 패드 밖 큐브는 직접 올려야 참여합니다.
            {running && " 진행 중인 작업은 바뀌지 않습니다."}
          </p>
        </>
      )}
    </Dialog>
  );
}
