// Category tags shown on plan cards -- real classification (how the XL
// catalog is actually browsed), not a decorative sequence number.
export const PRODUCT_CATEGORY: Record<string, string> = {
  "plan-gosurf799": "MOBILE",
  "plan-gosurf-xtra": "MOBILE",
  "plan-creator": "MOBILE",
  "plan-gosurf199": "MOBILE",
  "plan-gosurf499": "MOBILE",
  "plan-gosurf1499": "MOBILE",
  "plan-unlimited-lite": "MOBILE",
  "plan-unlimited-pro": "MOBILE",
  "plan-student": "MOBILE",
  "plan-streamer-plus": "MOBILE",

  "plan-family-4": "FAMILY",
  "plan-family-6": "FAMILY",

  "plan-home-multi": "HOME",
  "plan-home-basic": "HOME",
  "plan-home-pro": "HOME",
  "plan-home-gamer": "HOME",

  "addon-roam-asean": "ROAMING",
  "addon-roam-global": "ROAMING",
  "addon-intl-call": "ROAMING",

  "plan-biz-starter": "BUSINESS",
  "plan-biz-pro": "BUSINESS",

  "addon-satu-fiber-boost": "ADD-ON",
  "addon-data-boost-5gb": "ADD-ON",
  "addon-data-boost-20gb": "ADD-ON",
  "addon-mesh-wifi": "ADD-ON",
  "addon-security-suite": "ADD-ON",
  "addon-cloud-storage": "ADD-ON",
};

export const PRODUCT_CATEGORIES = ["MOBILE", "FAMILY", "HOME", "ROAMING", "BUSINESS", "ADD-ON"] as const;

export function productCategory(productId: string): string {
  return PRODUCT_CATEGORY[productId] ?? "MOBILE";
}
