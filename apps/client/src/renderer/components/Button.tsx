import type { ComponentProps } from "react";
import "./Button.css";

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "sub" | "danger";
  size?: "md" | "sm";
  wide?: boolean;
  on?: boolean; // 켜진 상태(sub를 진하게)
};

export function Button({ variant = "sub", size = "md", wide, on, className, type = "button", ...rest }: Props) {
  const cls = ["btn", variant, size === "sm" && "sm", wide && "wide", on && "on", className].filter(Boolean).join(" ");
  return <button type={type} className={cls} {...rest} />;
}
