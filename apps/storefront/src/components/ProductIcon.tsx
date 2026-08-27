// Line-art stand-ins for product photography -- the seed catalog's
// imageUrl values are random Lorem Picsum photos with no relation to the
// actual product, which read as a bug rather than a placeholder. A small,
// consistent set of technical-drawing-style icons fits the "issued to
// spec" catalog concept better than mismatched stock photography would.

function Headphones() {
  return (
    <>
      <path d="M60 140 A60 60 0 0 1 180 140" />
      <rect x="40" y="130" width="40" height="62" rx="14" />
      <rect x="160" y="130" width="40" height="62" rx="14" />
    </>
  );
}

function Keyboard() {
  const keys = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      keys.push(<rect key={`${row}-${col}`} x={44 + col * 17} y={92 + row * 20} width="12" height="12" rx="2" />);
    }
  }
  return (
    <>
      <rect x="30" y="80" width="180" height="80" rx="10" />
      {keys}
    </>
  );
}

function Backpack() {
  return (
    <>
      <path d="M85 66 Q85 40 120 40 Q155 40 155 66" />
      <rect x="60" y="66" width="120" height="134" rx="26" />
      <rect x="82" y="140" width="76" height="46" rx="12" />
      <line x1="120" y1="86" x2="120" y2="130" />
    </>
  );
}

function Watch() {
  return (
    <>
      <rect x="100" y="18" width="40" height="42" rx="6" />
      <rect x="100" y="180" width="40" height="42" rx="6" />
      <circle cx="120" cy="120" r="46" />
      <line x1="120" y1="120" x2="120" y2="96" />
      <line x1="120" y1="120" x2="138" y2="130" />
      <rect x="163" y="110" width="8" height="20" rx="2" />
    </>
  );
}

function Mug() {
  return (
    <>
      <rect x="66" y="58" width="94" height="118" rx="10" />
      <path d="M160 86 Q200 86 200 118 Q200 150 160 150" />
      <line x1="78" y1="86" x2="148" y2="86" strokeDasharray="6 6" />
    </>
  );
}

function Box() {
  return (
    <>
      <path d="M50 90 L120 55 L190 90 L120 125 Z" />
      <path d="M50 90 V160 L120 195 V125" />
      <path d="M190 90 V160 L120 195" />
    </>
  );
}

const ICONS: Record<string, () => JSX.Element> = {
  "prod-headphones": Headphones,
  "prod-keyboard": Keyboard,
  "prod-backpack": Backpack,
  "prod-watch": Watch,
  "prod-mug": Mug,
};

export function ProductIcon({ productId, className = "" }: { productId: string; className?: string }) {
  const Icon = ICONS[productId] ?? Box;
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <Icon />
    </svg>
  );
}
