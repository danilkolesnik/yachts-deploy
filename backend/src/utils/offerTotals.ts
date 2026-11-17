import {
  getPartPricePerUnit,
  getPartQuantity,
  getServiceLineTotal,
  normalizeServices,
  parseEuroNumber,
} from './pdfFormatters';

export const DEFAULT_OFFER_VAT_RATE = 0.25;

export function normalizeVatRate(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_OFFER_VAT_RATE;
  }
  const rate = Number(value);
  if (!Number.isFinite(rate)) return DEFAULT_OFFER_VAT_RATE;
  if (rate === 0) return 0;
  if (rate === 25 || Math.abs(rate - 0.25) < 0.001) return 0.25;
  return DEFAULT_OFFER_VAT_RATE;
}

export function formatVatRateLabel(language: string | undefined, rate: unknown): string {
  const percent = Math.round(normalizeVatRate(rate) * 100);
  const lang = String(language || 'en').toLowerCase();
  if (lang.startsWith('hr')) return `PDV (${percent}%)`;
  if (lang.startsWith('de')) return `MwSt. (${percent}%)`;
  return `VAT (${percent}%)`;
}

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
  const rate = normalizeVatRate(vatRate);
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
