import "./Spinner.css";

export function Spinner({ label = "불러오는 중" }: { label?: string }) {
  return <span className="spin" role="status" aria-label={label} />;
}
