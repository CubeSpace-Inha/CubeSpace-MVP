import { useState, type CSSProperties } from "react";
import { useOutletContext } from "react-router";
import type { WindowCommand } from "@cubespace/protocol";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { MiniButton } from "../components/MiniButton";
import { MonitorSwitch } from "../components/MonitorSwitch";
import { CubeDetail } from "../cube/CubeDetail";
import { CubeList } from "../cube/CubeList";
import { WindowRow } from "../cube/WindowRow";
import type { LayoutContext } from "../layout/AppLayout";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";
import { appIcon, cubeLine, NEUTRAL, onPad, winOf } from "../model/home";
import {
  cubeInfo,
  MAX_ON,
  monitorName,
  pickItems,
  PROGRAMS,
  windowRows,
  winTitle,
  type PickItem,
} from "../model/windows";
import { PickList } from "./windows/PickList";
import "./WindowsScreen.css";

// 창(시안 pad-home.html 창 페이지): 왼쪽 큐브(패드 위 · 패드 밖 · 고른 큐브에 묶을 창 · 프로그램), 오른쪽 열린 창.
export function WindowsScreen() {
  const { snapshot: s, api } = useOutletContext<LayoutContext>();
  const [sel, setSel] = useState<number | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  const c = s.cubes.find((x) => x.slot === sel) ?? s.cubes.find(onPad) ?? s.cubes[0];
  const rows = windowRows(s);
  const count = Math.max(1, s.monitor.count);
  const turn = (d: number) => void api.setMonitor(((s.monitor.no - 1 + d + count) % count) + 1);
  const cmd = (id: string, k: WindowCommand) => void api.windowCommand(id, k);
  const power = (id: string, on: boolean) => (
    <MiniButton label="창 켜기·끄기" on={on} onClick={() => cmd(id, "min")}>
      <Icon name="power" size={12} stroke={2.2} />
    </MiniButton>
  );
  if (!c) return null;
  const pk = picking === c.slot;
  const info = (x: typeof c) => cubeInfo(s, x, picking === x.slot);
  const w = winOf(s, c);
  const set = s.settings.cubes.find((x) => x.slot === c.slot);
  const placed = s.cubes.filter(onPad);
  const choose = (id: string) => {
    setSel(Number(id));
    setPicking(null);
  };
  const pick = (x: PickItem) => {
    void (x.window ? api.assignWindow(c.slot, x.window.id) : api.openApp(c.slot, x.app));
    setPicking(null);
  };
  const togglePick = () => setPicking(pk ? null : c.slot);

  return (
    <Board columns="minmax(320px, 360px) minmax(0, 1fr)">
      <h1 className="sr-only">창</h1>
      <Column>
        <Card title="큐브" meta={`패드 ${placed.length}/${MAX_ON} · 창과 묶기`} scroll n={1}>
          <div className="wcubes">
            <CubeList
              placed={placed.map(info)}
              tray={s.cubes.filter((x) => !onPad(x)).map(info)}
              slots={MAX_ON}
              selected={String(c.slot)}
              onSelect={choose}
            />
            <CubeDetail
              cube={info(c)}
              monitor={monitorName(s.monitor.no)}
              fix={set?.fix ?? undefined}
              programs={PROGRAMS}
              onFix={(fix) => void api.setCubeSettings(c.slot, { fix: fix ?? null })}
              button={set?.button ?? "toggle"}
              onButton={(button) => void api.setCubeSettings(c.slot, { button })}
              picker={pk && <PickList items={pickItems(s)} onPick={pick} />}
            >
              {w ? (
                <>
                  {power(w.id, w.status !== "minimized")}
                  <MiniButton label="다른 창으로 바꾸기" on={pk} onClick={togglePick}>
                    ⇄
                  </MiniButton>
                  <MiniButton label="묶음 풀기" onClick={() => void api.releaseCube(c.slot)}>
                    ✕
                  </MiniButton>
                </>
              ) : (
                <MiniButton label="무엇을 열지 고르기" on={pk} onClick={togglePick}>
                  ＋
                </MiniButton>
              )}
            </CubeDetail>
          </div>
        </Card>
      </Column>
      <Column>
        <Card title="열린 창" meta={`${rows.length}개`} scroll n={2} className="wsec">
          <div className="wtop">
            <span>대상 모니터</span>
            <MonitorSwitch
              label={monitorName(s.monitor.no)}
              onPrev={() => turn(-1)}
              onNext={() => turn(1)}
              disabled={count < 2}
            />
          </div>
          {rows.length === 0 && <p className="wnote">{monitorName(s.monitor.no)}에 열린 창이 없어요.</p>}
          {rows.map(({ w: x, cube: k }) => {
            const min = x.status === "minimized";
            const sub = k ? (
              <span className="b" style={{ "--c": cubeLine(s, k) ?? NEUTRAL } as CSSProperties}>
                큐브 {k.name}
                {min && " · 꺼짐"}
              </span>
            ) : x.top ? (
              "항상 위 · 큐브와 상관없음"
            ) : min ? (
              "최소화됨 · 지도에 자리 남음"
            ) : (
              "떠 있음"
            );
            return (
              <WindowRow key={x.id} pixels={appIcon(x.app)} name={winTitle(x)} sub={sub} min={!k && min}>
                {k ? (
                  power(x.id, !min)
                ) : (
                  <>
                    <MiniButton label="왼쪽 절반" onClick={() => cmd(x.id, "left")}>
                      ◧
                    </MiniButton>
                    <MiniButton label="오른쪽 절반" onClick={() => cmd(x.id, "right")}>
                      ◨
                    </MiniButton>
                    <MiniButton label="최소화·올리기" on={min} onClick={() => cmd(x.id, "min")}>
                      ▁
                    </MiniButton>
                    <MiniButton label="항상 위" on={x.top} onClick={() => cmd(x.id, "top")}>
                      <Icon name="pin" size={12} stroke={2.2} />
                    </MiniButton>
                  </>
                )}
                <MiniButton label="창 닫기" onClick={() => cmd(x.id, "close")}>
                  ✕
                </MiniButton>
              </WindowRow>
            );
          })}
        </Card>
      </Column>
    </Board>
  );
}
