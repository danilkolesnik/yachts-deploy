import {
  getPartPricePerUnit,
  getPartQuantity,
  getServiceLineTotal,
  normalizeServices,
} from './pdfFormatters';

export const DEFAULT_OFFER_VAT_RATE = 0.25;

export type OfferTotals = {
  partsTotal: number;
  servicesTotal: number;
  grossAmount: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  grandTotal: number;
  vatRate: number;
};

export function computeOfferTotals(
  parts: unknown,
  services: unknown,
  discountAmount = 0,
  vatRate = DEFAULT_OFFER_VAT_RATE,
): OfferTotals {
  const partsList = Array.isArray(parts) ? parts : [];
  const servicesList = normalizeServices(services);

  const partsTotal = partsList.reduce(
    (acc, part) => acc + getPartQuantity(part) * getPartPricePerUnit(part),
    0,
  );

  const servicesTotal = servicesList.reduce(
    (acc, service) => acc + getServiceLineTotal(service),
    0,
  );

  const grossAmount = partsTotal + servicesTotal;
  const rawDiscount = Number(discountAmount) || 0;
  const discount = Math.max(0, Math.min(rawDiscount, grossAmount));
  const subtotalAfterDiscount = grossAmount - discount;
  const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : DEFAULT_OFFER_VAT_RATE;
  const vatAmount = subtotalAfterDiscount * rate;
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return {
    partsTotal,
    servicesTotal,
    grossAmount,
    discountAmount: discount,
    subtotalAfterDiscount,
    vatAmount,
    grandTotal,
    vatRate: rate,
  };
}
