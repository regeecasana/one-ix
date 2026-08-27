// Category tags shown on product cards -- real classification (how a
// telco catalog is actually browsed), not a decorative sequence number.
export const PRODUCT_CATEGORY: Record<string, string> = {
  "prod-sim": "SIM",
  "prod-earbuds": "AUDIO",
  "prod-hotspot": "HOTSPOT",
  "prod-router": "ROUTER",
  "prod-phone": "PHONE",
};

export function productCategory(productId: string): string {
  return PRODUCT_CATEGORY[productId] ?? "GEAR";
}
