import {
  getPartPricePerUnit,
  getPartQuantity,
  getServiceLineTotal,
  normalizeServices,
  parseEuroNumber,
} from './pdfFormatters';

export const DEFAULT_OFFER_VAT_RATE = 0.25;

export type OfferTotals = {
  partsTotal: number;
  servicesTotal: number;
  grossAmount: number;
  discountPercent: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  grandTotal: number;
  vatRate: number;
};

function resolveDiscount(
  grossAmount: number,
  discountAmount = 0,
  discountPercent = 0,
) {
  const gross = parseEuroNumber(grossAmount);
  const percent = Math.max(0, Math.min(100, parseEuroNumber(discountPercent)));
  const amountInput = Math.max(0, parseEuroNumber(discountAmount));

  let discount = 0;
  let effectivePercent = 0;

  if (percent > 0) {
    discount = Math.min(gross, (gross * percent) / 100);
    effectivePercent = percent;
  } else if (amountInput > 0) {
    discount = Math.min(gross, amountInput);
    effectivePercent = gross > 0 ? (discount / gross) * 100 : 0;
  }

  return { discount, effectivePercent };
}

export function computeOfferTotals(
  parts: unknown,
  services: unknown,
  discountAmount = 0,
  discountPercent = 0,
  vatRate = DEFAULT_OFFER_VAT_RATE,
): OfferTotals {
  const partsList = Array.isArray(parts) ? parts : [];
  const servicesList = normalizeServices(services);

  const partsTotal = partsList.reduce(
    (acc, part) =>
      acc + parseEuroNumber(getPartQuantity(part) * getPartPricePerUnit(part)),
    0,
  );

  const servicesTotal = servicesList.reduce(
    (acc, service) => acc + parseEuroNumber(getServiceLineTotal(service)),
    0,
  );

  const grossAmount = partsTotal + servicesTotal;
  const { discount, effectivePercent } = resolveDiscount(
    grossAmount,
    discountAmount,
    discountPercent,
  );
  const subtotalAfterDiscount = grossAmount - discount;
  const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : DEFAULT_OFFER_VAT_RATE;
  const vatAmount = subtotalAfterDiscount * rate;
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return {
    partsTotal,
    servicesTotal,
    grossAmount,
    discountPercent: effectivePercent,
    discountAmount: discount,
    subtotalAfterDiscount,
    vatAmount,
    grandTotal,
    vatRate: rate,
  };
}
