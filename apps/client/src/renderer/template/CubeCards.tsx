import { useState } from "react";
import { Card } from "../components/Card";
import { SectionTitle } from "../components/SectionTitle";
import { APP_ICONS, ST_ICONS, glyphPixels } from "../cube/appIcons";
import { Battery } from "../cube/Battery";
import { ChainPill } from "../cube/ChainPill";
import { Cube } from "../cube/Cube";
import { LedIcon } from "../cube/LedIcon";
import { LedMatrix } from "../cube/LedMatrix";
import { Pad } from "../cube/Pad";
import { SpareTray, type SpareCube } from "../cube/SpareTray";
import { ICON_ROWS, OFF, outlineLeds, toPixels } from "../cube/led";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";

const P = Object.fromEntries(Object.entries(ICON_ROWS).map(([k, rows]) => [k, toPixels(rows)])) as Record<
  keyof typeof ICON_ROWS,
  ReturnType<typeof toPixels>
>;
const C1 = "rgb(18 181 214)";
const C2 = "rgb(240 69 122)";

// 창 2개: 왼쪽 반 · 오른쪽 반. 큐브 2개가 각 창을 맡는다.
const LEDS = [...outlineLeds([0, 0, 0.5, 1], C1, 0.55), ...outlineLeds([0.5, 0, 1, 1], C2, 0.55)];

const SPARE: (SpareCube | null)[] = [
  { name: "C", pixels: P.doc, pct: 80, label: "큐브 C · 80 %" },
  { name: "D", pixels: P.search, pct: 25, label: "큐브 D · 25 %" },
  { name: "E", pixels: OFF, pct: 40, charging: true, label: "큐브 E · 충전 중" },
  { name: "F", pixels: P.prompt, pct: 8, label: "큐브 F · 8 %" },
  null,
  null,
];

// 카탈로그 2판: LED · 큐브 · 패드 · 칸 · 연결
export function CubeCards() {
  const [sel, setSel] = useState<number | null>(0);
  const [frozen, setFrozen] = useState(false);

  return (
    <Board columns="minmax(0, 2fr) minmax(0, 1fr)">
      <Column>
        <Card
          title="패드 · 큐브"
          meta="Pad · Cube"
          actions={
            <button type="button" className="tpl-link" onClick={() => setFrozen(!frozen)}>
              {frozen ? "동결 풀기" : "동결 보기"}
            </button>
          }
          n={1}
        >
          <Pad leds={LEDS} frozen={frozen}>
            <Cube
              label="큐브 A · 창 1"
              pixels={P.vscode}
              line={C1}
              x={0.25}
              y={0.45}
              selected={sel === 0}
              onClick={() => setSel(0)}
              caption={
                <>
                  <b>A</b>
                  <Battery pct={72} />
                </>
              }
            />
            <Cube
              label="큐브 B · 창 2"
              pixels={P.edge}
              line={C2}
              x={0.75}
              y={0.45}
              selected={sel === 1}
              onClick={() => setSel(1)}
              caption={
                <>
                  <b>B</b>
                  <Battery pct={18} />
                </>
              }
            />
          </Pad>
          <p className="tpl-p">큐브를 누르면 고름(테두리) · 올리면 나머지가 흐려짐. 패드 LED는 창 영역 테두리.</p>
        </Card>
        <Card
          title="LED"
          meta={`8 × 8 · 아이콘 ${Object.keys(APP_ICONS).length} + ${Object.keys(ST_ICONS).length}개`}
          n={2}
        >
          <SectionTitle hint="LedMatrix">도안</SectionTitle>
          <div className="tpl-leds">
            {Object.entries(P).map(([k, px]) => (
              <figure key={k}>
                <LedMatrix pixels={px} className="tpl-ledm" />
                <figcaption>{k}</figcaption>
              </figure>
            ))}
          </div>
          <SectionTitle hint="LedIcon · 18 / 28 px">작은 아이콘</SectionTitle>
          <div className="tpl-row">
            <LedIcon pixels={P.vscode} />
            <LedIcon pixels={P.edge} />
            <LedIcon pixels={P.vscode} size={28} />
            <LedIcon pixels={P.edge} size={28} />
          </div>
          <SectionTitle hint="APP_ICONS">프로그램</SectionTitle>
          <div className="tpl-apps">
            {Object.entries(APP_ICONS).map(([name, g]) => (
              <figure key={name}>
                <LedIcon pixels={glyphPixels(g)} size={32} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
          <SectionTitle hint="ST_ICONS · 큐브 LED가 상태를 보여줄 때">상태</SectionTitle>
          <div className="tpl-apps">
            {Object.entries(ST_ICONS).map(([name, g]) => (
              <figure key={name}>
                <LedIcon pixels={glyphPixels(g)} size={32} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
          <SectionTitle hint="Battery">배터리</SectionTitle>
          <div className="tpl-row">
            <Battery pct={80} />
            <Battery pct={25} />
            <Battery pct={8} />
          </div>
        </Card>
      </Column>
      <Column>
        <Card title="안 쓰는 큐브" meta="SpareTray" n={3}>
          <SpareTray cells={SPARE} />
          <p className="tpl-p">이름 · 세로 배터리. E는 충전 중(번개).</p>
        </Card>
        <Card title="연결" meta="ChainPill · vertical" n={4}>
          <div className="tpl-row">
            <ChainPill
              vertical
              padUp
              slots={[
                { name: "A", kind: "ok" },
                { name: "B", kind: "ok" },
                { name: "C", kind: "hold" },
                { name: "D", kind: "err" },
                null,
                null,
              ]}
            />
            <ChainPill
              vertical
              padUp={false}
              slots={[{ name: "A", kind: "ok" }, { name: "B", kind: "ok" }, null, null, null, null]}
            />
          </div>
          <p className="tpl-p">ok 초록 실선 · hold 주황 끊긴 선 · off 회색 점선 · err 빨강 · 빈 슬롯</p>
        </Card>
      </Column>
    </Board>
  );
}
