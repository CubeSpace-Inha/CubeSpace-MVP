import { useLayoutEffect, useRef } from "react";
import type { Snapshot } from "@cubespace/protocol";
import { branches, onPad, PAD_H, PAD_W, type Branch } from "../../model/home";
import { GAP, zoomFrame, type Pick } from "../../model/zoom";

const curve = (xa: number, ya: number, xb: number, yb: number) => {
  const mx = (xa + xb) / 2;
  return `M${xa} ${ya} C${mx} ${ya} ${mx} ${yb} ${xb} ${yb}`;
};

// 선: 큐브 → 왼쪽 열 노드는 세 갈래와 같은 선 규칙(지금 모드 가지만 흐름), 펼친 노드 → 후보는 점선. 시안 drawWires.
function wirePaths(bs: Branch[], detail: HTMLElement, pick: Pick | null, x0: number, y0: number) {
  const [colA, colB] = [detail.firstElementChild as HTMLElement, detail.lastElementChild as HTMLElement];
  const dx = detail.offsetLeft;
  const mid = (el: HTMLElement) => detail.offsetTop + el.offsetTop + el.offsetHeight / 2;
  let svg = [...colA.children]
    .map((n, i) => {
      const b = bs[i]!;
      const y = mid(n as HTMLElement);
      const d = curve(x0, y0, dx - 8, y);
      return `<path class="k-${b.kind}${b.on ? " on" : ""}" style="--c:${b.color}" d="${d}"/>${b.on && b.kind === "ok" ? `<path class="flow" d="${d}"/>` : ""}<circle style="--c:${b.color}" cx="${dx - 8}" cy="${y}" r="4"/>`;
    })
    .join("");
  const opened = pick && colA.querySelector<HTMLElement>(`[data-pick="${pick}"]`);
  if (opened) {
    const xa = dx + opened.offsetLeft + opened.offsetWidth + 22; // +22 = +N 칩만큼 오른쪽
    const hue = bs[pick === "win" ? 1 : 2]!.hue;
    svg += [...colB.querySelectorAll<HTMLElement>(".cand")]
      .map(
        (n) => `<path class="dash" style="--c:${hue}" d="${curve(xa, mid(opened), dx + n.offsetLeft - 8, mid(n))}"/>`,
      )
      .join("");
  }
  return `${svg}<circle class="root" cx="${x0}" cy="${y0}" r="5.5"/>`;
}

// 확대 배치(시안 zoomTo): 패드를 옮겨 고른 큐브를 키우고(패드 밖 큐브는 유령 큐브), 노드 그래프 자리와 선을 잡는다.
// 크기를 재야 해서 DOM을 직접 만진다. 창 크기가 바뀌면 120 ms 뒤 다시 잡는다. 돌려준 ref를 홈 · 노드 그래프 · 선 · 유령 큐브에 붙인다.
export function useZoomLayout(s: Snapshot, slot: number | null, pick: Pick | null) {
  const homeRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const wiresRef = useRef<SVGSVGElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const run = () => {
      const root = homeRef.current;
      const box = root?.querySelector<HTMLElement>(".padbox");
      const pad = box?.querySelector<HTMLElement>(".pad");
      const wires = wiresRef.current;
      const detail = detailRef.current;
      if (!root || !box || !pad || !wires) return;
      const c = s.cubes.find((x) => x.slot === slot);
      if (!c || !detail) {
        pad.style.transform = "";
        wires.innerHTML = "";
        return;
      }
      const W = root.clientWidth;
      const H = root.clientHeight;
      const { stack, half, size, S, T } = zoomFrame(W, H, box.offsetWidth);
      if (onPad(c)) {
        const C = { x: (c.xy![0] / PAD_W) * box.offsetWidth, y: (c.xy![1] / PAD_H) * box.offsetHeight };
        pad.style.transformOrigin = `${C.x}px ${C.y}px`;
        pad.style.transform = `translate(${T.x - (box.offsetLeft + C.x)}px, ${T.y - (box.offsetTop + C.y)}px) scale(${S})`;
      } else {
        pad.style.transform = "";
        const g = ghostRef.current;
        if (g) Object.assign(g.style, { left: `${T.x}px`, top: `${T.y}px`, width: `${size}px` });
      }
      const [colA, colB] = [detail.firstElementChild as HTMLElement, detail.lastElementChild as HTMLElement];
      detail.toggleAttribute("data-stack", stack);
      colB.style.marginTop = "";
      colB.style.maxHeight = "";
      if (stack) {
        // 쌓기: 노드 아래에 후보, 넘치면 detail 안에서 스크롤. 선은 그리지 않는다.
        const top = T.y + half + 26;
        Object.assign(detail.style, {
          left: "16px",
          right: "16px",
          top: `${top}px`,
          maxHeight: `${Math.max(160, H - top - (W <= 720 ? 84 : 16))}px`,
        });
        wires.innerHTML = "";
        return;
      }
      Object.assign(detail.style, { left: `${T.x + half + GAP}px`, right: "", maxHeight: "" });
      detail.style.top = `${Math.max(84, T.y - colA.offsetHeight / 2)}px`;
      // 후보 열은 펼친 노드 높이에 가운데를 맞추되 화면 안에 두고, 그래도 길면 열 안에서 스크롤한다.
      colB.style.maxHeight = `${H - 100}px`;
      const opened = pick && colA.querySelector<HTMLElement>(`[data-pick="${pick}"]`);
      if (opened) {
        const want = opened.offsetTop + opened.offsetHeight / 2 - colB.offsetHeight / 2;
        const top = Math.min(Math.max(want, 84 - detail.offsetTop), H - 24 - detail.offsetTop - colB.offsetHeight);
        colB.style.marginTop = `${Math.max(top, 84 - detail.offsetTop)}px`;
      }
      wires.innerHTML = wirePaths(branches(s, c), detail, pick, T.x + half + 6, T.y);
    };
    run();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(run, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [s, slot, pick]);
  return { homeRef, detailRef, wiresRef, ghostRef };
}
