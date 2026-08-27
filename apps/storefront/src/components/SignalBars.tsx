// The signature: signal-strength bars, low-to-full. Used small and static
// as a brand mark next to the wordmark, and large and animated as the
// order-confirmation moment (replacing a more generic "success" graphic).
const HEIGHTS = [6, 10, 14, 18, 22];
const COLORS = ["#F2A93B", "#E7B443", "#B9C05B", "#6BC48A", "#0EA5A0"];

export function SignalBars({
  size = "sm",
  animated = false,
  className = "",
}: {
  size?: "sm" | "lg";
  animated?: boolean;
  className?: string;
}) {
  const scale = size === "lg" ? 2.4 : 1;
  return (
    <div className={`flex items-end gap-1 ${className}`} aria-hidden="true">
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 origin-bottom rounded-sm ${animated ? "signal-bar" : ""} ${
            size === "lg" ? "w-3" : ""
          }`}
          style={{
            height: h * scale,
            backgroundColor: COLORS[i],
            animationDelay: animated ? `${i * 90}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
