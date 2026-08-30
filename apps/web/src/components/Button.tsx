"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-blaze text-white shadow-[0_8px_20px_rgba(0,61,91,0.28)] hover:bg-blaze-dark disabled:opacity-40 disabled:shadow-none",
  secondary: "border border-hairline bg-white text-ink hover:border-blaze hover:text-blaze disabled:opacity-40",
  ghost: "text-ink-soft hover:text-blaze disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    variant === "ghost"
      ? "font-display text-sm font-semibold transition-colors disabled:cursor-not-allowed"
      : "rounded-full px-6 py-3 font-display text-sm font-semibold transition disabled:cursor-not-allowed";
  return <button className={`${base} ${variantClasses[variant]} ${className}`} {...props} />;
}
