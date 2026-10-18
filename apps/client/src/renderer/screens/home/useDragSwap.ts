import { useEffect, useRef, type RefObject } from "react";
import type { Pick } from "../../model/zoom";

type Drag = { cand: HTMLElement; kind: Pick; id: string; x: number; y: number; dx: number; dy: number; ghost: HTMLElement | null; over: Element | null };

// 끌어 놓기(시안): 후보(data-cand)를 잡아 같은 종류의 노드(data-drop) 위에서 놓으면 onDrop.
// 끈 직후 따라오는 click은 무시해야 해서 justDragged를 돌려준다(핸들러에서 읽는다).
export function useDragSwap(root: RefObject<HTMLElement | null>, onDrop: (kind: Pick, id: string) => void) {
  const justDragged = useRef(false);
  const drop = useRef(onDrop);
  useEffect(() => {
    drop.current = onDrop;
  });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let drag: Drag | null = null;
    const down = (e: PointerEvent) => {
      const cand = (e.target as Element).closest<HTMLElement>("[data-cand]");
      if (!cand || e.button !== 0) return;
      drag = { cand, kind: cand.dataset.cand as Pick, id: cand.dataset.id!, x: e.clientX, y: e.clientY, dx: 0, dy: 0, ghost: null, over: null };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (!drag.ghost) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
        const r = drag.cand.getBoundingClientRect();
        drag.dx = drag.x - r.left;
        drag.dy = drag.y - r.top;
        drag.ghost = drag.cand.cloneNode(true) as HTMLElement;
        drag.ghost.classList.add("drag-ghost");
        drag.ghost.removeAttribute("data-cand");
        document.body.append(drag.ghost);
        drag.cand.classList.add("dragging");
        drag.cand.closest(".detail")?.classList.add("dropping");
      }
      drag.ghost.style.left = `${e.clientX - drag.dx}px`;
      drag.ghost.style.top = `${e.clientY - drag.dy}px`;
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest(`[data-drop="${drag.kind}"]`) ?? null;
      if (over !== drag.over) {
        drag.over?.classList.remove("drop-on");
        over?.classList.add("drop-on");
        drag.over = over;
      }
    };
    const end = (e: PointerEvent) => {
      if (!drag) return;
      const { ghost, over, kind, id, cand } = drag;
      drag = null;
      if (!ghost) return; // 움직이지 않았으면 클릭으로 처리된다
      ghost.remove();
      cand.classList.remove("dragging");
      cand.closest(".detail")?.classList.remove("dropping");
      over?.classList.remove("drop-on");
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
      if (over && e.type === "pointerup") drop.current(kind, id);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [root]);
  return justDragged;
}
