import type { CSSProperties, ReactNode } from "react";
import { Select } from "../components/Select";
import { appPixels } from "./appIcons";
import type { CubeInfo } from "./CubeList";
import { CubeState } from "./CubeState";
import { LedIcon } from "./LedIcon";
import "./CubeDetail.css";

export type CubeButton = "toggle" | "pick";

type Props = {
  cube: CubeInfo;
  monitor?: string;
  last?: string;
  fix?: string;
  programs: string[];
  onFix: (app: string | undefined) => void;
  button: CubeButton;
  onButton: (b: CubeButton) => void;
  children?: ReactNode; // 묶인 창 줄 오른쪽 버튼
  picker?: ReactNode; // 묶인 창 줄 아래 고르기 목록
};

const BUTTONS: [CubeButton, string][] = [
  ["toggle", "켜기·끄기"],
  ["pick", "다시 고르기"],
];

// 고른 큐브 하나의 설정: 머리 · 묶인 창 · 지난번 / 고정 프로그램 · 큐브 버튼 · 상태별 동작 표.
export function CubeDetail({
  cube: c,
  monitor,
  last,
  fix,
  programs,
  onFix,
  button,
  onButton,
  children,
  picker,
}: Props) {
  const on = c.state !== "out";
  const pick = button === "pick";
  // [상태, 이름, 한 번, 꾹]. 지금 상태 줄에 불이 들어온다.
  const table: [string, string, string, string][] = [
    ["out", "패드 밖", "동작 없음", "동작 없음"],
    [
      "empty",
      "? 큐브",
      fix ? `${fix} 바로 열기` : `고르는 창 (맨 위 ${last ?? "떠 있는 창"})`,
      fix ? "고정 무시하고 고르기" : last ? `${last} 바로 열기` : "고르는 창",
    ],
    ["pick", "고르는 창 뜸", "맨 위 항목 배치", "취소하고 ?로"],
    ["bound", "배치된 큐브", pick ? "풀고 다시 고르기" : "창 켜기·끄기", pick ? "창 켜기·끄기" : "풀고 다시 고르기"],
  ];
  const now = c.state === "off" ? "bound" : c.state;

  return (
    <div className="cdet" style={{ "--sel": c.color } as CSSProperties}>
      <div className="cch">
        <LedIcon pixels={c.pixels} size={40} />
        <span className="hmain">
          <b className="num">큐브 {c.name} 설정</b>
          <small>
            {on ? "패드 위" : "패드 밖"} · 배터리 {c.pct}%
          </small>
        </span>
        <CubeState kind={c.state} color={c.color} />
      </div>
      {on && (
        <div className="ccw">
          {c.win ? (
            <LedIcon pixels={appPixels(c.win)} size={24} />
          ) : (
            <span className="aic" style={{ "--z": "24px" } as CSSProperties} />
          )}
          <span className="cn">
            {c.win ?? "묶인 창 없음"}
            {c.win && monitor && <small> · {monitor}</small>}
          </span>
          <span className="wa">{children}</span>
        </div>
      )}
      {picker}
      <div className="ccs">
        <div className="opt">
          <span>
            지난번 프로그램<small>? 큐브를 누르면 먼저 추천해요</small>
          </span>
          <span className="lastv">
            {last ? (
              <>
                <LedIcon pixels={appPixels(last)} size={22} />
                {last}
              </>
            ) : (
              "아직 없음"
            )}
          </span>
        </div>
        <div className="opt">
          <span>
            고정 프로그램<small>빈 곳에 놓으면 고르지 않고 바로 열어요</small>
          </span>
          <Select aria-label="고정 프로그램" value={fix ?? ""} onChange={(e) => onFix(e.target.value || undefined)}>
            <option value="">없음</option>
            {programs.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
        <div className="opt">
          <span>
            큐브 버튼<small>배치된 큐브를 짧게 눌렀을 때</small>
          </span>
          <span className="mseg" role="group" aria-label="큐브 버튼">
            {BUTTONS.map(([v, n]) => (
              <button
                key={v}
                type="button"
                className={button === v ? "on" : ""}
                aria-pressed={button === v}
                onClick={() => onButton(v)}
              >
                {n}
              </button>
            ))}
          </span>
        </div>
        <div className="ptab">
          <div className="ph">
            <b />
            <span>한 번</span>
            <span>꾹 (0.6초)</span>
          </div>
          {table.map(([st, n, once, hold]) => (
            <div key={st} className={now === st ? "on" : ""}>
              <b>{n}</b>
              <span>{once}</span>
              <span>{hold}</span>
            </div>
          ))}
          <small>지금 상태에 불이 들어와요 · 큐브 버튼 설정을 바꾸면 한 번과 꾹이 서로 바뀌어요</small>
        </div>
      </div>
    </div>
  );
}
