import { useCallback, useEffect, useRef, useState } from "react";

// 화면 아래 알림 한 줄. show(글자)로 띄우면 ms 뒤에 사라진다.
export function useToast(ms = 2600) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (next: string) => {
      setText(next);
      setVisible(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), ms);
    },
    [ms],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { text, visible, show };
}
