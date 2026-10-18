import type { CSSProperties } from "react";
import "./CubeState.css";

// bound 창 배치됨 · off 배치됐지만 꺼짐 · pick 고르는 창 뜸 · empty 패드 위 빈 큐브(?) · out 패드 밖
export type CubeStateKind = "bound" | "off" | "pick" | "empty" | "out";

const TEXT: Record<CubeStateKind, string> = {
  bound: "배치됨",
  off: "꺼짐",
  pick: "고르는 중",
  empty: "?",
  out: "패드 밖",
};

// 큐브 상태 알약(시안 .bst). 배치는 큐브 색으로 채우고, 고르는 중은 테두리만.
export function CubeState({ kind, color }: { kind: CubeStateKind; color: string }) {
  const cls = kind === "bound" || kind === "off" ? "bst b" : kind === "pick" ? "bst p" : "bst";
  return (
    <em className={cls} style={{ "--c": color } as CSSProperties}>
      {TEXT[kind]}
    </em>
  );
}
