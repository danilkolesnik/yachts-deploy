function sanitizeDocumentNumber(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'document';
  return raw.replace(/[^\w.-]+/g, '_');
}

export function offerPdfFilename(offerId: string): string {
  return `offer-${sanitizeDocumentNumber(offerId)}.pdf`;
}

export function invoicePdfFilename(offerId: string): string {
  return `invoice-${sanitizeDocumentNumber(offerId)}.pdf`;
}

export function workOrderPdfFilename(offerId: string): string {
  return `work-order-${sanitizeDocumentNumber(offerId)}.pdf`;
}

export function resolveEmailPdfFilename(
  type: string,
  data: { id?: string; offerId?: string; invoiceNumber?: string },
): string {
  if (type === 'offer' && data?.id) {
    return offerPdfFilename(data.id);
  }
  if (type === 'invoice') {
    const number = data?.offerId || data?.invoiceNumber || data?.id;
    if (number) return invoicePdfFilename(String(number));
  }
  if (type === 'work-order' && data?.offerId) {
    return workOrderPdfFilename(data.offerId);
  }
  return `${type}.pdf`;
}
