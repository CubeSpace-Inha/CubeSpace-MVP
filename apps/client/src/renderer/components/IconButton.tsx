import { Icon, type IconName } from "./Icon";
import "./IconButton.css";

type Props = { icon: IconName; label: string; badge?: number; onClick?: () => void };

export function IconButton({ icon, label, badge, onClick }: Props) {
  return (
    <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
      <Icon name={icon} size={18} stroke={2} />
      {badge ? <b className="num">{badge}</b> : null}
    </button>
  );
}
