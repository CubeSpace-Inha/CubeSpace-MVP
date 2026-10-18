import { useState } from "react";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { ChipAdd } from "../components/ChipAdd";
import { ICON_NAMES } from "../components/Icon";
import { IconButton } from "../components/IconButton";
import { LogList, type LogItem } from "../components/LogList";
import { Rows, type RowItem } from "../components/Rows";
import { SectionTitle } from "../components/SectionTitle";
import { Select } from "../components/Select";
import { Stepper } from "../components/Stepper";
import { Switch } from "../components/Switch";
import { TextArea } from "../components/TextArea";
import { TextInput } from "../components/TextInput";
import { LedIcon } from "../cube/LedIcon";
import { APP_ICONS, appPixels } from "../cube/appIcons";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";

const LOG: LogItem[] = [
  { id: "1", text: "큐브 B를 창 2에 맡김", time: "14:02", color: "var(--c2)" },
  { id: "2", text: "프리셋 '코딩' 적용", time: "13:58", color: "var(--c1)" },
  { id: "3", text: "패드 세션 끊김", time: "13:40", err: true },
];

const ROWS: RowItem[] = [
  { key: "pad", title: "패드", value: "USB 연결", dot: "var(--ok)" },
  { key: "cube", title: "큐브", value: "5/6", note: "큐브 F 배터리 8 %", dot: "#f59e0b" },
  { key: "ai", title: "AI", value: "대기", dot: "var(--faint)" },
];

// 카탈로그 2판: 아이콘 전체 · 입력(글 · 스테퍼 · 스위치 · 고르기) · 칩 · 기록 · 상태 목록
export function ControlCards() {
  const [back, setBack] = useState(1.5);
  const [tol, setTol] = useState(15);
  const [auto, setAuto] = useState(true);
  const [sound, setSound] = useState(false);
  const [skips, setSkips] = useState<string[]>(["VS Code", "메모장", "Edge"]);

  return (
    <Board columns="repeat(3, minmax(0, 1fr))">
      <Column>
        <Card title="입력" n={1}>
          <SectionTitle>TextInput</SectionTitle>
          <TextInput placeholder="이름" />
          <SectionTitle>TextArea</SectionTitle>
          <TextArea rows={3} placeholder="AI에게 할 말" />
          <SectionTitle hint="+ / −">Stepper</SectionTitle>
          <div className="tpl-row">
            <Stepper label="되돌리기" value={back} min={0.5} max={3} step={0.5} unit="초" onChange={setBack} />
            <Stepper label="허용 오차" value={tol} min={2} max={30} step={5} unit="mm" onChange={setTol} />
          </div>
          <SectionTitle>Switch</SectionTitle>
          <Switch label="자동 배치" hint="큐브를 올리면 바로" checked={auto} onChange={setAuto} />
          <Switch label="효과음" checked={sound} onChange={setSound} />
          <SectionTitle>Select</SectionTitle>
          <Select defaultValue="normal" aria-label="강도">
            <option value="loose">느슨</option>
            <option value="normal">보통</option>
            <option value="strict">꼼꼼</option>
          </Select>
        </Card>
      </Column>
      <Column>
        <Card title="프로그램 칩" meta="건너뛸 프로그램" n={3}>
          <div className="chips">
            {skips.map((p) => (
              <Chip
                key={p}
                icon={<LedIcon size={20} pixels={appPixels(p)} />}
                label={p}
                onRemove={() => setSkips(skips.filter((s) => s !== p))}
              />
            ))}
            <ChipAdd
              label="프로그램"
              options={Object.keys(APP_ICONS).filter((p) => !skips.includes(p))}
              icon={(p) => <LedIcon size={20} pixels={appPixels(p)} />}
              onAdd={(p) => setSkips([...skips, p])}
            />
          </div>
        </Card>
        <Card title="상태 목록" n={4}>
          <Rows items={ROWS} />
        </Card>
        <Card title="최근 기록" n={5}>
          <LogList items={LOG} />
        </Card>
      </Column>
      <Column>
        <Card title="아이콘" meta={`${ICON_NAMES.length}개`} n={6}>
          <div className="tpl-icons">
            {ICON_NAMES.map((name) => (
              <figure key={name}>
                <IconButton icon={name} label={name} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
        </Card>
      </Column>
    </Board>
  );
}
