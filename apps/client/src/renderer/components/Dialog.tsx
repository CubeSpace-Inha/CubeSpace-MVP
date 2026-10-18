import { useId, type ReactNode } from "react";
import { useModalDialog } from "../hooks/useModalDialog";
import { Icon } from "./Icon";
import "./Dialog.css";

type Props = { open: boolean; onClose: () => void; title: string; actions?: ReactNode; children?: ReactNode };

// 가운데 뜨는 대화상자. actions는 아래 오른쪽 버튼들.
export function Dialog({ open, onClose, title, actions, children }: Props) {
  const ref = useModalDialog(open);
  const titleId = useId();
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose}>
      <div className="dh">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label="닫기" onClick={onClose}>
          <Icon name="x" size={16} stroke={2} />
        </button>
      </div>
      <div className="db">
        {children}
        {actions && <div className="da">{actions}</div>}
      </div>
    </dialog>
  );
}
