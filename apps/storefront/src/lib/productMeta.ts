// Category tags shown on product cards -- real classification (how a
// telco catalog is actually browsed), not a decorative sequence number.
export const PRODUCT_CATEGORY: Record<string, string> = {
  "plan-starter": "PLAN",
  "plan-work": "PLAN",
  "plan-creator-pro": "PLAN",
  "plan-home-multi": "PLAN",
  "addon-5g-boost": "ADD-ON",
};

export function productCategory(productId: string): string {
  return PRODUCT_CATEGORY[productId] ?? "PLAN";
}
