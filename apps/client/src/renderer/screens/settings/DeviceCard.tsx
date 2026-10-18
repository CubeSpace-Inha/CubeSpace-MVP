import { useState } from "react";
import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Slot, Snapshot } from "@cubespace/protocol";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { LedMatrix } from "../../cube/LedMatrix";
import { cubeLineText, regPixels } from "../../model/settings";

type Props = { s: Snapshot; api: CubeSpaceApi; toast: (text: string) => void };

// 등록된 큐브(시안 #devCard): 목록 · 등록 해제. MVP는 6개가 페어링됐다고 보고 등록 흐름은 뺐다.
// 등록 해제는 한 번 더 눌러야 한다(정말 해제).
export function DeviceCard({ s, api, toast }: Props) {
  const [arm, setArm] = useState<Slot | null>(null);

  const unregister = (c: Snapshot["cubes"][number]) => {
    if (arm !== c.slot) return setArm(c.slot);
    setArm(null);
    void api.unregisterCube(c.slot);
    toast(`큐브 ${c.name} 등록을 해제했어요 · 슬롯 ${c.slot} 비움`);
  };

  return (
    <Card
      title="등록된 큐브"
      meta={<span className="num">{s.cubes.length} / 6</span>}
      scroll
      className="devcard"
    >
      <ul className="lib">
        {s.cubes.map((c) => (
          <li key={c.slot}>
            <span className="lsym">
              <LedMatrix pixels={regPixels(c.icon)} />
            </span>
            <div className="lcopy">
              <small className="num">
                슬롯 {c.slot} · …{c.mac4}
              </small>
              <b>큐브 {c.name}</b>
              <span>{cubeLineText(c)}</span>
            </div>
            <Button
              size="sm"
              variant={arm === c.slot ? "danger" : "sub"}
              onClick={() => unregister(c)}
            >
              {arm === c.slot ? "정말 해제" : "등록 해제"}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
