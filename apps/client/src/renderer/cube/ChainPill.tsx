import type { MouseEvent } from "react";
import "./ChainPill.css";

// 연결 선 규칙: ok 초록 실선 · hold 주황 끊긴 선 · off 회색 점선 · err 빨강
export type LinkKind = "ok" | "hold" | "off" | "err";

type Props = {
  padUp: boolean; // PC–패드 USB 세션
  slots: ({ name: string; kind: LinkKind; why?: string } | null)[]; // 슬롯 6칸의 큐브(없으면 null). why = 점 설명
  vertical?: boolean; // 왼쪽 메뉴 안에서 세로로
  onSlot?: (slot: number) => void; // 점 누르기
  onHot?: (slot: number | null) => void; // 점에 올리거나 초점을 둘 때(벗어나면 null)
  onOpen?: () => void; // 점 말고 체인을 누를 때
};

// 연결 상태: PC ━ 패드 ━ 큐브 + 슬롯 점 6개 + 연결 수. vertical이면 세로(왼쪽 메뉴용).
export function ChainPill({ padUp, slots, vertical, onSlot, onHot, onOpen }: Props) {
  const n = slots.filter((s) => s?.kind === "ok").length;
  const label = padUp ? `연결: PC와 패드 연결됨, 큐브 ${n}/${slots.length} 연결` : "연결: 패드 세션 끊김, 판정 동결";
  const tip = padUp ? `패드 연결됨 · 큐브 ${n}/${slots.length} 연결` : "패드 세션 끊김 · 판정 동결";
  const open = (e: MouseEvent) => {
    if (!(e.target as Element).closest("[data-slot]")) onOpen?.();
  };
  return (
    <span
      className={vertical ? "pill num vert" : "pill num"}
      role="group"
      aria-label={label}
      data-tip={tip}
      onClick={onOpen && open}
      onMouseLeave={onHot && (() => onHot(null))}
      onBlur={onHot && (() => onHot(null))}
    >
      <b>PC</b>
      <span className={`cseg k-${padUp ? "ok" : "hold"}`} />
      <b>패드</b>
      <span className={`cseg k-${padUp ? "ok" : "off"}`} />
      <b>큐브</b>
      <span className="cdots">
        {slots.map((s, i) =>
          s ? (
            <button
              key={i}
              type="button"
              className={`cdot k-${padUp ? s.kind : "off"}`}
              data-slot={i}
              title={s.why ? `큐브 ${s.name} · ${s.why}` : `큐브 ${s.name}`}
              aria-label={`슬롯 ${i} 큐브 ${s.name}${s.why ? ` ${s.why}` : ""}`}
              onClick={() => onSlot?.(i)}
              onMouseEnter={onHot && (() => onHot(i))}
              onFocus={onHot && (() => onHot(i))}
            />
          ) : (
            <i key={i} className="cdot k-empty" title={`슬롯 ${i} · 비어 있음`} />
          ),
        )}
      </span>
      <span className="num">{padUp ? `${n}/${slots.length}` : "판정 동결"}</span>
    </span>
  );
}
