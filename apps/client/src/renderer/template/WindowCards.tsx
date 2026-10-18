import { useState, type CSSProperties } from "react";
import { Card } from "../components/Card";
import { MiniButton } from "../components/MiniButton";
import { Icon } from "../components/Icon";
import { MonitorSwitch } from "../components/MonitorSwitch";
import { APP_ICONS, ST_ICONS, appPixels, glyphPixels } from "../cube/appIcons";
import { CubeDetail, type CubeButton } from "../cube/CubeDetail";
import { CubeList, type CubeInfo } from "../cube/CubeList";
import { WindowRow } from "../cube/WindowRow";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";

const MONS = ["주 모니터", "보조 모니터"];
const PROGRAMS = Object.keys(APP_ICONS).slice(0, 12);

const CUBES: CubeInfo[] = [
  { id: "A", name: "A", pixels: appPixels("VS Code"), color: "var(--c1)", state: "bound", pct: 72, win: "VS Code" },
  {
    id: "B",
    name: "B",
    pixels: glyphPixels(ST_ICONS["창 꺼짐"]),
    color: "var(--c2)",
    state: "off",
    pct: 18,
    win: "Edge",
  },
  { id: "C", name: "C", pixels: glyphPixels(ST_ICONS["창 없음"]), color: "var(--c3)", state: "pick", pct: 55 },
  { id: "E", name: "E", pixels: glyphPixels(ST_ICONS["창 없음"]), color: "var(--c4)", state: "out", pct: 40 },
  { id: "F", name: "F", pixels: glyphPixels(ST_ICONS["배터리 10% 미만"]), color: "var(--ok)", state: "out", pct: 8 },
];

// 열린 창: cube 가 있으면 큐브에 묶인 창(켜기·끄기만), 없으면 반쪽 · 최소화 · 항상 위
type Win = { id: string; app: string; title?: string; cube?: string; min?: boolean; top?: boolean };
const WINS: Win[] = [
  { id: "1", app: "VS Code", title: "main.ts", cube: "A" },
  { id: "2", app: "Edge", cube: "B" },
  { id: "3", app: "메모장", title: "회의록.txt" },
  { id: "4", app: "Spotify", top: true },
  { id: "5", app: "Slack", min: true },
];

// 카탈로그 3판: 열린 창 · 패드 위 큐브 · 큐브 설정 (시안 창 화면)
export function WindowCards() {
  const [mon, setMon] = useState(0);
  const [sel, setSel] = useState("A");
  const [fix, setFix] = useState<string | undefined>();
  const [btn, setBtn] = useState<CubeButton>("toggle");
  const cube = CUBES.find((c) => c.id === sel) ?? CUBES[0];
  const turn = (d: number) => setMon((mon + d + MONS.length) % MONS.length);

  return (
    <Board columns="repeat(3, minmax(0, 1fr))">
      <Column>
        <Card title="열린 창" meta="WindowRow · MonitorSwitch" n={1}>
          <div className="tpl-wtop">
            <span>대상 모니터</span>
            <MonitorSwitch label={MONS[mon]} onPrev={() => turn(-1)} onNext={() => turn(1)} />
          </div>
          {WINS.map((w) => {
            const c = CUBES.find((k) => k.id === w.cube);
            const sub = c ? (
              <span className="b" style={{ "--c": c.color } as CSSProperties}>
                큐브 {c.name}
                {c.state === "off" && " · 꺼짐"}
              </span>
            ) : w.top ? (
              "항상 위 · 큐브와 상관없음"
            ) : w.min ? (
              "최소화됨 · 지도에 자리 남음"
            ) : (
              "떠 있음"
            );
            return (
              <WindowRow
                key={w.id}
                pixels={appPixels(w.app)}
                name={w.title ? `${w.app} · ${w.title}` : w.app}
                sub={sub}
                min={w.min}
              >
                {c ? (
                  <MiniButton label="창 켜기·끄기" on={c.state !== "off"}>
                    <Icon name="power" size={12} stroke={2.2} />
                  </MiniButton>
                ) : (
                  <>
                    <MiniButton label="왼쪽 절반">◧</MiniButton>
                    <MiniButton label="오른쪽 절반">◨</MiniButton>
                    <MiniButton label="최소화·올리기" on={w.min}>
                      ▁
                    </MiniButton>
                    <MiniButton label="항상 위" on={w.top}>
                      <Icon name="pin" size={12} stroke={2.2} />
                    </MiniButton>
                  </>
                )}
                <MiniButton label="창 닫기">✕</MiniButton>
              </WindowRow>
            );
          })}
        </Card>
      </Column>
      <Column>
        <Card title="패드 위 큐브" meta="CubeList · CubeState" n={2}>
          <CubeList
            placed={CUBES.filter((c) => c.state !== "out")}
            tray={CUBES.filter((c) => c.state === "out")}
            selected={sel}
            onSelect={setSel}
          />
          <p className="tpl-p">누르면 오른쪽 설정이 그 큐브로 바뀐다. 상태: 배치됨 · 꺼짐 · 고르는 중 · ? · 패드 밖</p>
        </Card>
      </Column>
      <Column>
        <Card title="큐브 설정" meta="CubeDetail" n={3}>
          <CubeDetail
            cube={cube}
            monitor={MONS[mon]}
            last="메모장"
            fix={fix}
            programs={PROGRAMS}
            onFix={setFix}
            button={btn}
            onButton={setBtn}
          >
            {cube.win ? (
              <>
                <MiniButton label="창 켜기·끄기" on={cube.state !== "off"}>
                  <Icon name="power" size={12} stroke={2.2} />
                </MiniButton>
                <MiniButton label="다른 창으로 바꾸기">⇄</MiniButton>
                <MiniButton label="묶음 풀기">✕</MiniButton>
              </>
            ) : (
              <MiniButton label="무엇을 열지 고르기" on={cube.state === "pick"}>
                ＋
              </MiniButton>
            )}
          </CubeDetail>
        </Card>
      </Column>
    </Board>
  );
}
