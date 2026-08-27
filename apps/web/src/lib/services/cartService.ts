export function computeSubtotalCents(items: { quantity: number; unitPriceCents: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}
