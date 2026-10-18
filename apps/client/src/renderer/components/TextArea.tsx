import type { TextareaHTMLAttributes } from "react";
import "./TextField.css";

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={className ? `tx ${className}` : "tx"} {...rest} />;
}
