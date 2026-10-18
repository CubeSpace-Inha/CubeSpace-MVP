import "./Toast.css";

type Props = { text: string; visible: boolean };

// 화면 아래 알림. useToast()의 text · visible을 넘긴다.
export function Toast({ text, visible }: Props) {
  return (
    <div className={visible ? "toast show" : "toast"} role="status" aria-live="polite">
      {text}
    </div>
  );
}
