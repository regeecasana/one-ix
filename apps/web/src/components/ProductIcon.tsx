// Line-art stand-ins for product photography -- consistent with the
// storefront's visual language rather than mismatched stock photos.

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

function Family() {
  return (
    <>
      <circle cx="85" cy="70" r="22" />
      <path d="M50 175 Q50 130 85 130 Q120 130 120 175" />
      <circle cx="155" cy="80" r="18" />
      <path d="M125 175 Q125 138 155 138 Q185 138 185 175" />
    </>
  );
}

function Globe() {
  return (
    <>
      <circle cx="120" cy="120" r="70" />
      <ellipse cx="120" cy="120" rx="30" ry="70" />
      <line x1="50" y1="120" x2="190" y2="120" />
      <path d="M65 80 Q120 100 175 80" />
      <path d="M65 160 Q120 140 175 160" />
    </>
  );
}

function Briefcase() {
  return (
    <>
      <rect x="45" y="90" width="150" height="100" rx="10" />
      <path d="M90 90 L90 65 Q90 55 100 55 L140 55 Q150 55 150 65 L150 90" />
      <line x1="45" y1="130" x2="195" y2="130" />
    </>
  );
}

function Router() {
  return (
    <>
      <rect x="55" y="120" width="130" height="50" rx="10" />
      <circle cx="90" cy="145" r="6" />
      <circle cx="120" cy="145" r="6" />
      <path d="M100 120 Q100 90 100 75" />
      <path d="M140 120 Q140 85 140 65" />
      <path d="M85 75 Q100 60 115 75" />
      <path d="M120 65 Q140 45 160 65" />
    </>
  );
}

function Shield() {
  return (
    <>
      <path d="M120 40 L175 60 L175 115 Q175 165 120 195 Q65 165 65 115 L65 60 Z" />
      <path d="M95 118 L112 135 L148 95" />
    </>
  );
}

const ICONS: Record<string, () => JSX.Element> = {
  "plan-gosurf799": Phone,
  "plan-gosurf-xtra": Laptop,
  "plan-creator": Camera,
  "plan-home-multi": House,
  "addon-satu-fiber-boost": Bolt,
  "plan-family-4": Family,
  "plan-family-6": Family,
  "addon-roam-asean": Globe,
  "addon-roam-global": Globe,
  "addon-intl-call": Globe,
  "plan-biz-starter": Briefcase,
  "plan-biz-pro": Briefcase,
  "plan-home-basic": Router,
  "plan-home-pro": Router,
  "plan-home-gamer": Router,
  "addon-mesh-wifi": Router,
  "addon-security-suite": Shield,
};

// Anything not explicitly mapped above falls back by category rather than
// defaulting straight to Phone, so a growing catalog stays visually varied.
const CATEGORY_ICONS: Record<string, () => JSX.Element> = {
  MOBILE: Phone,
  FAMILY: Family,
  HOME: House,
  ROAMING: Globe,
  BUSINESS: Briefcase,
  "ADD-ON": Bolt,
};

export function ProductIcon({
  productId,
  category,
  className = "",
}: {
  productId: string;
  category?: string;
  className?: string;
}) {
  const Icon = ICONS[productId] ?? (category && CATEGORY_ICONS[category]) ?? Phone;
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
