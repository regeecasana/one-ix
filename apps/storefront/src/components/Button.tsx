import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-blaze text-canvas hover:bg-blaze-dark disabled:bg-hairline disabled:text-ink-soft",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-canvas disabled:opacity-40",
  ghost: "text-ink-soft hover:text-ink underline underline-offset-4 disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    variant === "ghost"
      ? "font-mono text-sm uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed"
      : "px-5 py-2.5 font-mono text-sm uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed";
  return <button className={`${base} ${variantClasses[variant]} ${className}`} {...props} />;
}
