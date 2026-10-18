import type { Ref } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import type { CubeMode } from "@cubespace/protocol";
import "./ZoomBar.css";

type Props = {
  title: string;
  mode: CubeMode;
  onMode: (mode: CubeMode) => void;
  onBack: () => void;
  backRef?: Ref<HTMLButtonElement>;
};

// 확대했을 때 위 가운데 막대: 전체 보기 · 슬롯 · 큐브 이름 · 이 큐브의 모드(창 | AI) · Esc
export function ZoomBar({ title, mode, onMode, onBack, backRef }: Props) {
  return (
    <div className="zoom-bar">
      <Button ref={backRef} onClick={onBack}>
        <Icon name="arrowLeft" size={15} stroke={2.2} />
        전체 보기
      </Button>
      <h2>{title}</h2>
      <Tabs
        options={["창", "AI"]}
        value={mode === "ai" ? 1 : 0}
        onChange={(i) => onMode(i ? "ai" : "window")}
        label="이 큐브의 모드"
      />
      <span className="kbd">Esc</span>
    </div>
  );
}
