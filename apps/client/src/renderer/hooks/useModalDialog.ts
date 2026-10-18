import { useEffect, useRef } from "react";

// open 값에 맞춰 네이티브 <dialog>를 모달로 열고 닫는다. Esc · 초점 가두기는 브라우저가 한다.
export function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return ref;
}
