import type { InputHTMLAttributes } from "react";
import "./TextField.css";

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className ? `tx ${className}` : "tx"} {...rest} />;
}
