// Category tags shown on plan cards -- real classification (how the XL
// catalog is actually browsed), not a decorative sequence number.
export const PRODUCT_CATEGORY: Record<string, string> = {
  "plan-gosurf799": "PLAN",
  "plan-gosurf-xtra": "PLAN",
  "plan-creator": "PLAN",
  "plan-home-multi": "PLAN",
  "addon-satu-fiber-boost": "ADD-ON",
};

export function productCategory(productId: string): string {
  return PRODUCT_CATEGORY[productId] ?? "PLAN";
}
