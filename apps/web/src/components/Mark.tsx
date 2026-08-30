// Brand mark: a solid spark in Concentrix navy. Used small next to the
// wordmark, and large on the activation confirmation moment.
export function Mark({ size = "sm", className = "" }: { size?: "sm" | "lg"; className?: string }) {
  const px = size === "lg" ? 56 : 28;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-blaze ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={px * 0.55} height={px * 0.55} fill="white">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    </span>
  );
}
