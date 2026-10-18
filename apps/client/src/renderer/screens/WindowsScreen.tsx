import type { CSSProperties } from "react";
import { useOutletContext } from "react-router";
import type { WindowCommand } from "@cubespace/protocol";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { MiniButton } from "../components/MiniButton";
import { MonitorSwitch } from "../components/MonitorSwitch";
import { WindowRow } from "../cube/WindowRow";
import type { LayoutContext } from "../layout/AppLayout";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";
import { appIcon, cubeLine, NEUTRAL } from "../model/home";
import { monitorName, windowRows, winTitle } from "../model/windows";
import "./WindowsScreen.css";

// 창(시안 pad-home.html 창 페이지): 열린 창만 둔다(MVP). 큐브와 창 묶기는 홈에서 한다.
export function WindowsScreen() {
  const { snapshot: s, api } = useOutletContext<LayoutContext>();
  const rows = windowRows(s);
  const count = Math.max(1, s.monitor.count);
  const turn = (d: number) => void api.setMonitor(((s.monitor.no - 1 + d + count) % count) + 1);
  const cmd = (id: string, k: WindowCommand) => void api.windowCommand(id, k);
  const power = (id: string, on: boolean) => (
    <MiniButton label="창 켜기·끄기" on={on} onClick={() => cmd(id, "min")}>
      <Icon name="power" size={12} stroke={2.2} />
    </MiniButton>
  );

  return (
    <Board>
      <h1 className="sr-only">창</h1>
      <Column>
        <Card title="열린 창" meta={`${rows.length}개`} scroll n={1} className="wsec">
          <div className="wtop">
            <span>대상 모니터</span>
            <MonitorSwitch label={monitorName(s.monitor.no)} onPrev={() => turn(-1)} onNext={() => turn(1)} disabled={count < 2} />
          </div>
          {rows.length === 0 && <p className="wnote">{monitorName(s.monitor.no)}에 열린 창이 없어요.</p>}
          {rows.map(({ w: x, cube: k }) => {
            const min = x.status === "minimized";
            const sub = k ? (
              <span className="b" style={{ "--c": cubeLine(s, k) ?? NEUTRAL } as CSSProperties}>
                큐브 {k.name}
                {min && " · 꺼짐"}
              </span>
            ) : x.top ? "항상 위 · 큐브와 상관없음" : min ? "최소화됨 · 지도에 자리 남음" : "떠 있음";
            return (
              <WindowRow key={x.id} pixels={appIcon(x.app)} name={winTitle(x)} sub={sub} min={!k && min}>
                {k ? (
                  power(x.id, !min)
                ) : (
                  <>
                    <MiniButton label="왼쪽 절반" onClick={() => cmd(x.id, "left")}>◧</MiniButton>
                    <MiniButton label="오른쪽 절반" onClick={() => cmd(x.id, "right")}>◨</MiniButton>
                    <MiniButton label="최소화·올리기" on={min} onClick={() => cmd(x.id, "min")}>▁</MiniButton>
                    <MiniButton label="항상 위" on={x.top} onClick={() => cmd(x.id, "top")}>
                      <Icon name="pin" size={12} stroke={2.2} />
                    </MiniButton>
                  </>
                )}
                <MiniButton label="창 닫기" onClick={() => cmd(x.id, "close")}>✕</MiniButton>
              </WindowRow>
            );
          })}
        </Card>
      </Column>
    </Board>
  );
}
