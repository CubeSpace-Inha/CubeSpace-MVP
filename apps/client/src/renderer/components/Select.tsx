import type { SelectHTMLAttributes } from "react";
import "./Select.css";

// 고르기 상자(네이티브 select). 항목은 <option>으로 넣는다.
export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={className ? `sel ${className}` : "sel"} {...rest} />;
}
