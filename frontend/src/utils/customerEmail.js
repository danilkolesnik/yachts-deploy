/**
 * Resolve customer email from offer row and optional users list.
 * @param {{ customerId?: string; customerFullName?: string; customerEmail?: string } | null | undefined} offer
 * @param {Array<{ id?: string; fullName?: string; email?: string }>} [users]
 */
export function getCustomerEmailForOffer(offer, users = []) {
  if (!offer) return '';
  if (offer.customerEmail?.trim()) {
    return offer.customerEmail.trim();
  }
  if (offer.customerId && users.length > 0) {
    const byId = users.find((u) => String(u.id) === String(offer.customerId));
    if (byId?.email?.trim()) return byId.email.trim();
  }
  if (offer.customerFullName && users.length > 0) {
    const byName = users.find((u) => u.fullName === offer.customerFullName);
    if (byName?.email?.trim()) return byName.email.trim();
  }
  return '';
}
