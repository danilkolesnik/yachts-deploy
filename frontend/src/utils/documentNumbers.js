/**
 * Business document number shared by offer and its work order (ZN).
 */
export function getOfferDocumentNumber(offer) {
  if (!offer) return '';
  return String(offer.id ?? '').trim();
}

export function getOrderDocumentNumber(order) {
  if (!order) return '';
  return String(order.offerId || order.offer?.id || '').trim() || String(order.id ?? '').trim();
}
