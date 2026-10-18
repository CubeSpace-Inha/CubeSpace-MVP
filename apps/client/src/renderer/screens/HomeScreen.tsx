import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useOutletContext, useSearchParams } from "react-router";
import type { CubeMode } from "@cubespace/protocol";
import { Logo } from "../components/Logo";
import { Toast } from "../components/Toast";
import { Battery } from "../cube/Battery";
import { Cube } from "../cube/Cube";
import { CubeTop } from "../cube/CubeTop";
import { Pad } from "../cube/Pad";
import { SpareTray } from "../cube/SpareTray";
import { useToast } from "../hooks/useToast";
import type { LayoutContext } from "../layout/AppLayout";
import { cubeLine, cubePixels, homeView, onPad } from "../model/home";
import { STATE_TEXT } from "../model/status";
import { swapToast, type Pick } from "../model/zoom";
import { CubeFan } from "./home/CubeFan";
import { useDragSwap } from "./home/useDragSwap";
import { useZoomLayout } from "./home/useZoomLayout";
import { ZoomBar } from "./home/ZoomBar";
import { ZoomDetail } from "./home/ZoomDetail";
import "./HomeScreen.css";

// 홈(시안 pad-home.html 캔버스): 기울인 패드 · 큐브(올리면 세 갈래) · 오른쪽 안 쓰는 큐브 칸.
// 큐브를 누르면 확대(노드 그래프, 주소 ?cube=슬롯)해서 창 · AI를 바꾼다.
export function HomeScreen() {
  const { snapshot: s, api, hot } = useOutletContext<LayoutContext>();
  const v = homeView(s);
  const [params, setParams] = useSearchParams();
  const zc = s.cubes.find((c) => String(c.slot) === params.get("cube")) ?? null;
  const zoom = zc?.slot ?? null;
  // 펼친 노드 · 움직임 없이 다시 그리기. 확대한 큐브가 바뀌면 처음으로 돌아간다.
  const [ui, setUi] = useState<{ slot: number | null; pick: Pick | null; quiet: boolean }>({ slot: null, pick: null, quiet: false });
  const pick = ui.slot === zoom ? ui.pick : null;
  const quiet = ui.slot === zoom && ui.quiet;
  const toast = useToast();
  const { homeRef, detailRef, wiresRef, ghostRef } = useZoomLayout(s, zoom, pick);
  const backRef = useRef<HTMLButtonElement>(null);

  const zoomTo = (slot: number) => setParams({ cube: String(slot) });
  const zoomOut = () => {
    setParams({});
    homeRef.current?.querySelector<HTMLElement>(`[data-slot="${zoom}"]`)?.focus({ preventScroll: true });
  };
  const setPick = (next: Pick | null) => setUi({ slot: zoom, pick: next, quiet: true });
  const focusNode = (kind: Pick) => detailRef.current?.querySelector<HTMLElement>(`[data-pick="${kind}"]`)?.focus({ preventScroll: true });

  const swap = (kind: Pick, id: string) => {
    if (!zc || (kind === "win" ? zc.window === id : zc.ai === id)) return; // 지금 것과 같으면 할 일 없음
    toast.show(swapToast(s, zc, kind, id));
    void (kind === "win" ? api.assignWindow(zc.slot, id) : api.assignAi(zc.slot, id));
    setUi({ slot: zoom, pick, quiet: true });
    focusNode(kind);
  };
  const justDragged = useDragSwap(homeRef, swap);

  const setMode = (mode: CubeMode) => {
    if (!zc || mode === zc.mode) return;
    void api.setMode(zc.slot, mode);
    setUi({ slot: zoom, pick, quiet: true });
    toast.show(`큐브 ${zc.name} · ${mode === "ai" ? "AI" : "창"} 모드`);
  };

  // 열면 전체 보기 버튼으로 초점
  useEffect(() => {
    if (zoom !== null) backRef.current?.focus({ preventScroll: true });
  }, [zoom]);

  // Esc: 펼친 노드를 접고, 없으면 전체 보기. 서랍 · 대화 상자가 열려 있으면 그쪽이 먼저다.
  const onEsc = useRef<() => void>(null);
  useEffect(() => {
    onEsc.current = () => {
      if (zoom === null) return;
      if (pick) {
        setPick(null);
        focusNode(pick);
      } else zoomOut();
    };
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onEsc.current?.();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);

  // 확대 중 밖(노드 그래프 · 위 막대 · 큐브 말고)을 누르면 전체 보기
  const onClick = (e: MouseEvent) => {
    if (justDragged.current || zoom === null) return;
    if (!(e.target as Element).closest(".detail, .zoom-bar, [data-slot]")) zoomOut();
  };

  const ghost = zc && !onPad(zc);
  return (
    <div ref={homeRef} className={["home", zoom !== null && "zoomed", ghost && "pad-dim"].filter(Boolean).join(" ")} onClick={onClick}>
      <h1 className="sr-only">장치 상태</h1>
      <div className="homeblock" aria-hidden="true" />
      <div className="stage3d">
        <div className={`padlink k-${v.frozen ? "hold" : "ok"}`} role="img" aria-label={v.frozen ? "패드 연결 끊김" : "패드 연결됨"} />
        <Pad leds={v.leds} frozen={v.frozen} dim={hot !== null}>
          <Logo size={48} className="padlogo" />
          {v.placed.map(({ cube: c, x, y, pixels, line, label, fanLeft, branches }) => (
            <Cube
              key={c.slot}
              slot={c.slot}
              label={label}
              pixels={pixels}
              x={x}
              y={y}
              line={line}
              selected={zoom === c.slot}
              className={[fanLeft ? "fan-left" : "fan-right", hot === c.slot && "hot"].filter(Boolean).join(" ")}
              onClick={() => zoomTo(c.slot)}
              caption={
                <>
                  <b>{c.name}</b>
                  {c.battPct !== null && <Battery pct={c.battPct} />}
                  {c.state !== "run" && c.state !== "idle" && <em>{STATE_TEXT[c.state]}</em>}
                </>
              }
            >
              <CubeFan branches={branches} left={fanLeft} />
            </Cube>
          ))}
        </Pad>
        <aside className="spare-panel fadeable" aria-label="안 쓰는 큐브">
          <SpareTray cells={v.spare} onSelect={(i) => zoomTo(v.spare[i]!.slot)} />
        </aside>
      </div>
      <svg ref={wiresRef} className={quiet ? "zoom-wires static" : "zoom-wires"} aria-hidden="true" />
      {ghost && (
        <div ref={ghostRef} className="cube ghost selected" style={{ "--cube-line": cubeLine(s, zc) } as CSSProperties}>
          <CubeTop pixels={cubePixels(s, zc)} />
        </div>
      )}
      {zc && (
        <ZoomDetail
          ref={detailRef}
          snapshot={s}
          cube={zc}
          pick={pick}
          quiet={quiet}
          onPick={(kind) => {
            if (!justDragged.current) setPick(pick === kind ? null : kind);
          }}
          onSwap={(kind, id) => {
            if (!justDragged.current) swap(kind, id);
          }}
        />
      )}
      <ZoomBar
        backRef={backRef}
        title={zc ? `슬롯 ${zc.slot} · 큐브 ${zc.name}` : ""}
        mode={zc?.mode ?? "window"}
        onMode={setMode}
        onBack={zoomOut}
      />
      <Toast text={toast.text} visible={toast.visible} />
    </div>
  );
}
