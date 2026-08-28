// priceCents actually stores whole Rupiah -- see apps/web/src/lib/money.ts.
export function formatCents(cents) {
  return `Rp ${cents.toLocaleString('id-ID')}`
}

export function minutesUntil(isoDate) {
  return Math.round((new Date(isoDate).getTime() - Date.now()) / 60_000)
}

export function timeAgo(isoDate) {
  const minutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
