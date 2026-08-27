export function formatCents(cents: number): string {
  // Rupiah, whole units only -- priceCents actually stores whole Rupiah
  // (no fractional currency in this catalog), formatted "Rp 199.000".
  return `Rp ${cents.toLocaleString("id-ID")}`;
}
