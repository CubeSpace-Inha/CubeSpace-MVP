import type { CSSProperties, ReactNode, Ref } from "react";
import type { Cube, Snapshot } from "@cubespace/protocol";
import { Badge } from "../../components/Badge";
import { CodeChip } from "../../components/CodeChip";
import { LedIcon } from "../../cube/LedIcon";
import type { Pixels } from "../../cube/led";
import { branches, coords, place, profOf, regionOf, winDot, winOf, type Branch } from "../../model/home";
import { KIND_TEXT, linkText, STATE_TEXT, STATE_TONE, WIN_TEXT, winName } from "../../model/status";
import { aiCands, candGroups, winCands, type Pick } from "../../model/zoom";
import "./ZoomDetail.css";

type Props = {
  snapshot: Snapshot;
  cube: Cube;
  pick: Pick | null; // 펼친 노드
  quiet: boolean; // 다시 그릴 때(바꾼 직후)는 등장 움직임 없이
  onPick: (kind: Pick) => void;
  onSwap: (kind: Pick, id: string) => void;
  ref?: Ref<HTMLDivElement>;
};

const nodeAttrs = (b: Branch, i: number) => ({
  className: `node k-${b.kind}${b.on ? " on" : ""}`,
  style: { "--i": i, "--c": b.color } as CSSProperties,
});

const Head = ({ title, tag }: { title: string; tag?: string }) => (
  <span className="node__head">
    <span className="sq" />
    {title}
    {tag && <span className="tag">{tag}</span>}
  </span>
);

const Dot = ({ color }: { color: string }) => <i className="tdot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />;

const Body = ({ lead, title, sub }: { lead: ReactNode; title: string; sub: string }) => (
  <span className="node__body">
    {lead}
    <span>
      <b>{title}</b>
      <small>{sub}</small>
    </span>
  </span>
);

const iconOrDot = (icon: Pixels | undefined, dot = "rgb(154 161 173)") => (icon ? <LedIcon pixels={icon} size={40} /> : <Dot color={dot} />);

// 확대 = 노드 그래프. 왼쪽 열: 패드(보기만) · 창 · AI. 창 · AI 노드를 누르면 오른쪽 열에 후보가 펼쳐진다. 시안 nodeColumn · candColumn.
// 위치 · 선은 useZoomLayout이 잡는다.
export function ZoomDetail({ snapshot: s, cube: c, pick, quiet, onPick, onSwap, ref }: Props) {
  const bs = branches(s, c);
  const l = linkText(c);
  const w = winOf(s, c);
  const p = profOf(s, c);
  const ri = regionOf(s, w);
  const notice = s.notices.find((n) => n.code === "iconFailed" && n.slot === c.slot);
  const can = c.link === "up";

  // 창 · AI 노드: 연결된 큐브만 눌러 후보를 펼친다(끌어 놓을 자리이기도 하다).
  const box = (kind: Pick, i: number, title: string, body: ReactNode, count: number) => {
    const used = kind === "win" ? c.mode === "window" : c.mode === "ai";
    const head = <Head title={title} tag={used ? "사용 중" : ""} />;
    return can ? (
      <button
        type="button"
        {...nodeAttrs(bs[i]!, i)}
        data-pick={kind}
        data-drop={kind}
        aria-expanded={pick === kind}
        aria-label={`${title}. 이을 수 있는 후보 ${count}개 보기`}
        onClick={() => onPick(kind)}
      >
        <span className="port l" />
        {head}
        {body}
        <span className="plus num" aria-hidden="true">
          +{count}
        </span>
      </button>
    ) : (
      <div {...nodeAttrs(bs[i]!, i)}>
        <span className="port l" />
        {head}
        {body}
        <span className="node__foot">켜서 연결되면 바꿀 수 있습니다</span>
      </div>
    );
  };

  return (
    <div ref={ref} className={quiet ? "detail static" : "detail"} role="region" aria-label={`큐브 ${c.name}의 연결`}>
      <div className="ncol">
        <div {...nodeAttrs(bs[0]!, 0)}>
          <span className="port l" />
          <Head title="패드 · 연결" tag={l.text} />
          <span className="node__body">
            <span>
              <b>{c.link === "up" ? place(c) : l.why}</b>
              <small className="num">
                {c.xy ? `${coords(c)} · ` : ""}슬롯 {c.slot} · …{c.mac4}
              </small>
            </span>
          </span>
          {(c.state !== "idle" || notice) && (
            <span className="node__foot">
              {c.state !== "idle" && <Badge tone={STATE_TONE[c.state]}>{STATE_TEXT[c.state]}</Badge>}
              {notice && <CodeChip code={notice.code} />}
            </span>
          )}
        </div>
        {box(
          "win",
          1,
          `창${ri >= 0 ? ` · 영역 ${ri + 1}` : ""}`,
          <Body lead={<Dot color={winDot(s, w)} />} title={w ? winName(w) : "없음"} sub={w ? WIN_TEXT[w.status].text : "미배정"} />,
          winCands(s, c).length,
        )}
        {box(
          "ai",
          2,
          `AI · ${p ? KIND_TEXT[p.kind] : "없음"}`,
          <Body lead={iconOrDot(bs[2]!.icon)} title={p ? p.name : "없음"} sub={p ? "다음 실행부터 적용" : "연결된 AI 없음"} />,
          aiCands(s, c).length,
        )}
      </div>
      <div className="ncol cands" role="group" aria-label="이을 수 있는 후보">
        {pick && (
          <>
            <p className="cands-hint">
              누르면 바로 바뀝니다. <b>{pick === "win" ? "창" : "AI"}</b> 노드로 끌어 놓아도 됩니다.
            </p>
            {candGroups(s, c, pick).map((g, gi, groups) => {
              const start = groups.slice(0, gi).reduce((n, x) => n + x.items.length, 0);
              return [
                <div key={g.name} className="cands-group">
                  {g.name}
                </div>,
                ...g.items.map((x, j) => (
                  <button
                    key={x.id}
                    type="button"
                    className="node cand"
                    style={{ "--i": start + j, "--c": x.color } as CSSProperties}
                    data-cand={x.kind}
                    data-id={x.id}
                    aria-label={`${x.head}. 눌러서 교체`}
                    onClick={() => onSwap(x.kind, x.id)}
                  >
                    <span className="port l" />
                    <Head title={x.head} tag={x.tag} />
                    <Body lead={iconOrDot(x.icon, x.dot)} title={x.title} sub={x.sub} />
                  </button>
                )),
              ];
            })}
          </>
        )}
      </div>
    </div>
  );
}
