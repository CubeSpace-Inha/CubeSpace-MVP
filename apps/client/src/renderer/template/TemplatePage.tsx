import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, type Tone } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Dialog } from "../components/Dialog";
import { Drawer } from "../components/Drawer";
import { Icon } from "../components/Icon";
import { IconButton } from "../components/IconButton";
import { SectionTitle } from "../components/SectionTitle";
import { PillTabs } from "../components/PillTabs";
import { Spinner } from "../components/Spinner";
import { Tabs } from "../components/Tabs";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { AppShell } from "../layout/AppShell";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";
import { NAV } from "../layout/nav";
import { RailButton } from "../layout/RailButton";
import { ControlCards } from "./ControlCards";
import { CubeCards } from "./CubeCards";
import { LogoCards } from "./LogoCards";
import { WindowCards } from "./WindowCards";
import "./TemplatePage.css";

const COLORS = ["c1", "c2", "c3", "c4", "ok", "err"];
const SURFACES = ["bg", "card", "soft", "raise", "ink", "muted", "faint", "line", "edge", "padbg"];
const TONES: Tone[] = ["ok", "warn", "warnd", "danger", "neutral", "muted"];

// 개발자용 템플릿 카탈로그(/template). 공통 레이아웃 · 부품을 한 화면에 모은다.
export function TemplatePage() {
  const [view, setView] = useState(0);
  const [tab, setTab] = useState(0);
  const [seg, setSeg] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <AppShell
      items={NAV}
      current={view}
      onSelect={setView}
      railBottom={
        <>
          <RailButton label="홈으로" onClick={() => navigate("/home")}>
            <Icon name="arrowLeft" size={20} stroke={2} />
          </RailButton>
          <RailButton label="알림 3건" badge={3} onClick={() => setDrawerOpen(true)}>
            <Icon name="bell" size={20} stroke={2} />
          </RailButton>
        </>
      }
    >
      <div className="tpl">
        <h1 className="sr-only">템플릿</h1>
        <h2 className="tpl-h">로고 후보</h2>
        <LogoCards />
        <h2 className="tpl-h">기본</h2>
        <Board columns="repeat(3, minmax(0, 1fr))">
          <Column>
            <Card title="토큰" meta="styles/tokens.css" n={1}>
              <SectionTitle hint="--c1 … --err">색</SectionTitle>
              <Swatches names={COLORS} />
              <SectionTitle hint="테마에 따라 바뀜">바탕 · 글자</SectionTitle>
              <Swatches names={SURFACES} />
              <SectionTitle hint="tone-*">톤</SectionTitle>
              <div className="tpl-row">
                {TONES.map((t) => (
                  <Badge key={t} tone={t}>
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          </Column>
          <Column>
            <Card title="버튼" n={2}>
              <SectionTitle hint="variant">Button</SectionTitle>
              <div className="tpl-row">
                <Button variant="primary">적용</Button>
                <Button>취소</Button>
                <Button on>켜짐</Button>
                <Button variant="danger">삭제</Button>
              </div>
              <SectionTitle hint="size · wide">크기</SectionTitle>
              <div className="tpl-row">
                <Button>보통</Button>
                <Button size="sm">작게</Button>
              </div>
              <Button variant="primary" wide>
                가득
              </Button>
              <SectionTitle hint="disabled · 조건이 안 맞아 못 누를 때">비활성</SectionTitle>
              <div className="tpl-row">
                <Button variant="primary" disabled>
                  저장
                </Button>
                <Button disabled>취소</Button>
              </div>
              <SectionTitle hint="badge">IconButton</SectionTitle>
              <div className="tpl-row">
                <IconButton icon="bell" label="알림" badge={2} />
                <IconButton icon="x" label="닫기" />
              </div>
            </Card>
            <Card title="덧창" n={3}>
              <div className="tpl-row">
                <Button onClick={() => setDialogOpen(true)}>Dialog</Button>
                <Button onClick={() => setDrawerOpen(true)}>Drawer</Button>
                <Button onClick={() => toast.show("저장했어요")}>Toast</Button>
              </div>
            </Card>
          </Column>
          <Column>
            <Card title="탭 · 로딩" n={4}>
              <SectionTitle hint="2칸">Tabs</SectionTitle>
              <Tabs options={["창", "AI"]} value={tab} onChange={setTab} label="모드" />
              <SectionTitle hint="3칸">Tabs</SectionTitle>
              <Tabs options={["느슨", "보통", "꼼꼼"]} value={seg} onChange={setSeg} label="강도" />
              <SectionTitle hint="위 3칸과 같은 값">PillTabs</SectionTitle>
              <PillTabs
                options={[
                  ["0", "느슨"],
                  ["1", "보통"],
                  ["2", "꼼꼼"],
                ]}
                value={String(seg)}
                onChange={(v) => setSeg(Number(v))}
                label="강도"
              />
              <SectionTitle>Spinner</SectionTitle>
              <Spinner />
            </Card>
            <Card title="영역 · 영역 제목" meta="3개" n={5}>
              <p className="tpl-p">Card의 title · meta · actions가 제목 줄이다.</p>
            </Card>
            <Card
              title="제목 + 버튼"
              meta="2"
              actions={
                <Button size="sm" onClick={() => toast.show("추가")}>
                  추가
                </Button>
              }
              n={6}
            >
              <SectionTitle hint="hint">SectionTitle</SectionTitle>
              <p className="tpl-p">영역 안의 소제목.</p>
            </Card>
          </Column>
        </Board>
        <h2 className="tpl-h">입력 · 목록 · 아이콘</h2>
        <ControlCards />
        <h2 className="tpl-h">큐브 · 패드</h2>
        <CubeCards />
        <h2 className="tpl-h">창 · 큐브 설정</h2>
        <WindowCards />
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="프리셋 저장"
        actions={
          <>
            <Button onClick={() => setDialogOpen(false)}>취소</Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              저장
            </Button>
          </>
        }
      >
        <p>대화상자 본문. Esc로도 닫힌다.</p>
      </Dialog>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="상태">
        <section>
          <h3>
            패드 <span>USB · BLE</span>
          </h3>
          <p className="tpl-p">서랍 본문은 section + h3로 나눈다.</p>
        </section>
      </Drawer>
      <Toast text={toast.text} visible={toast.visible} />
    </AppShell>
  );
}

function Swatches({ names }: { names: string[] }) {
  return (
    <div className="tpl-swatches">
      {names.map((n) => (
        <div key={n} className="tpl-swatch">
          <i style={{ background: `var(--${n})` }} />
          <code>--{n}</code>
        </div>
      ))}
    </div>
  );
}
