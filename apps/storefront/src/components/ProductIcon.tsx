// Line-art stand-ins for product photography -- consistent with the
// storefront's signal/network visual language rather than mismatched stock
// photos. See docs on why: apps/api/prisma/seed.ts.

function SimCard() {
  return (
    <>
      <path d="M70 50 H150 L170 70 V188 A12 12 0 0 1 158 200 H82 A12 12 0 0 1 70 188 Z" />
      <rect x="90" y="82" width="60" height="42" rx="8" />
      <line x1="100" y1="96" x2="126" y2="96" />
      <line x1="100" y1="108" x2="126" y2="108" />
    </>
  );
}

function Earbuds() {
  return (
    <>
      <rect x="70" y="70" width="36" height="46" rx="18" />
      <rect x="82" y="110" width="12" height="50" rx="6" />
      <rect x="134" y="70" width="36" height="46" rx="18" />
      <rect x="146" y="110" width="12" height="50" rx="6" />
    </>
  );
}

function Hotspot() {
  return (
    <>
      <rect x="75" y="90" width="90" height="80" rx="14" />
      <circle cx="120" cy="130" r="13" />
      <path d="M100 90 Q120 62 140 90" />
      <path d="M85 90 Q120 42 155 90" />
      <path d="M70 90 Q120 22 170 90" />
    </>
  );
}

function Router() {
  return (
    <>
      <rect x="50" y="110" width="140" height="50" rx="10" />
      <line x1="90" y1="110" x2="80" y2="70" />
      <circle cx="80" cy="65" r="6" />
      <line x1="150" y1="110" x2="160" y2="70" />
      <circle cx="160" cy="65" r="6" />
      <circle cx="80" cy="135" r="3" />
      <circle cx="120" cy="135" r="3" />
      <circle cx="160" cy="135" r="3" />
    </>
  );
}

function Phone() {
  return (
    <>
      <rect x="80" y="30" width="80" height="180" rx="18" />
      <line x1="105" y1="45" x2="135" y2="45" />
      <rect x="95" y="55" width="4" height="8" />
      <rect x="102" y="50" width="4" height="13" />
      <rect x="109" y="45" width="4" height="18" />
      <line x1="105" y1="195" x2="135" y2="195" />
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
  "prod-sim": SimCard,
  "prod-earbuds": Earbuds,
  "prod-hotspot": Hotspot,
  "prod-router": Router,
  "prod-phone": Phone,
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
