import { useId, type ReactNode } from "react";
import { useModalDialog } from "../hooks/useModalDialog";
import { IconButton } from "./IconButton";
import "./Drawer.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
};

// 오른쪽에서 밀려 나오는 서랍. 본문은 <section><h3>…</h3>…</section>으로 나눈다.
export function Drawer({ open, onClose, title, children }: Props) {
  const ref = useModalDialog(open);
  const titleId = useId();
  return (
    // 여백(::backdrop)을 누르면 클릭 대상이 dialog 자신이 된다 → 닫는다
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer__head">
        <h2 id={titleId}>{title}</h2>
        <IconButton icon="x" label="닫기" onClick={onClose} />
      </div>
      <div className="drawer__body">{children}</div>
    </dialog>
  );
}
