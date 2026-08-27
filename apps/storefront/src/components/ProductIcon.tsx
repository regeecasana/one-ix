// Line-art stand-ins for product photography -- consistent with the
// storefront's signal/network visual language rather than mismatched stock
// photos.

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

function Laptop() {
  return (
    <>
      <rect x="60" y="50" width="120" height="80" rx="6" />
      <circle cx="120" cy="90" r="18" />
      <circle cx="120" cy="90" r="4" />
      <path d="M50 130 L190 130 L200 150 L40 150 Z" />
    </>
  );
}

function Camera() {
  return (
    <>
      <rect x="55" y="80" width="110" height="75" rx="10" />
      <circle cx="110" cy="118" r="24" />
      <rect x="140" y="62" width="35" height="22" rx="4" />
      <circle cx="188" cy="90" r="8" />
    </>
  );
}

function House() {
  return (
    <>
      <path d="M65 112 L120 68 L175 112" />
      <rect x="78" y="112" width="84" height="82" />
      <rect x="108" y="152" width="24" height="42" />
      <path d="M100 68 Q120 46 140 68" />
    </>
  );
}

function Bolt() {
  return <path d="M130 40 L88 132 L114 132 L98 200 L160 100 L130 100 Z" />;
}

const ICONS: Record<string, () => JSX.Element> = {
  "plan-starter": Phone,
  "plan-work": Laptop,
  "plan-creator-pro": Camera,
  "plan-home-multi": House,
  "addon-5g-boost": Bolt,
};

export function ProductIcon({ productId, className = "" }: { productId: string; className?: string }) {
  const Icon = ICONS[productId] ?? Phone;
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
