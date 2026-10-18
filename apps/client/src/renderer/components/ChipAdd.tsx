import { useEffect, useRef, useState, type ReactNode } from "react";
import "./ChipAdd.css";

type Props = { label: string; options: string[]; icon?: (option: string) => ReactNode; onAdd: (option: string) => void };

// 칩 줄 끝의 "+ 더하기": 누르면 아래에 고를 목록이 뜨고, 고르면 닫힌다. 바깥을 누르거나 Esc로도 닫힌다.
export function ChipAdd({ label, options, icon, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="chip-add" ref={ref}>
      <button type="button" className={open ? "chip-add-btn on" : "chip-add-btn"} aria-expanded={open} onClick={() => setOpen(!open)}>
        + {label}
      </button>
      {open && (
        <div className="chip-pop" role="listbox" aria-label={label}>
          {options.length === 0 && <p>더할 항목이 없어요</p>}
          {options.map((o) => (
            <button
              key={o}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onAdd(o);
                setOpen(false);
              }}
            >
              {icon?.(o)}
              <span>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
