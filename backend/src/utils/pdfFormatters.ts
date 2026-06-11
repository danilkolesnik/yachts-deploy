export function formatMoney(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export function getLogoUrl(): string {
  return `${process.env.SERVER_URL || 'http://localhost:3001'}/uploads/logo/Logo.png`;
}

export function normalizeServices(services: unknown): any[] {
  if (Array.isArray(services)) return services;
  if (services && typeof services === 'object') return [services];
  return [];
}

export function getServiceName(service: any): string {
  return String(
    service?.serviceName ??
      service?.value?.serviceName ??
      service?.label ??
      '',
  );
}

export function getServicePrice(service: any): number {
  return Number(
    service?.priceInEuroWithoutVAT ??
      service?.value?.priceInEuroWithoutVAT ??
      0,
  );
}

export function getServiceQuantity(service: any): number {
  const quantity = Number(service?.quantity ?? service?.value?.quantity ?? 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export function getServiceLineTotal(service: any): number {
  return getServiceQuantity(service) * getServicePrice(service);
}

export function getPartLabel(part: any): string {
  return String(
    part?.label ?? part?.name ?? part?.partName ?? part?.value?.label ?? '',
  );
}

export function getPartArticleNumber(part: any): string {
  const article =
    part?.articleNumber ?? part?.value?.articleNumber ?? part?.value?.article;
  return article ? String(article) : '-';
}

export function getPartQuantity(part: any): number {
  return Number(part?.quantity ?? part?.value?.quantity ?? 1);
}

export function getPartPricePerUnit(part: any): number {
  return Number(part?.pricePerUnit ?? part?.value?.pricePerUnit ?? 0);
}

export function resolveYachtFields(data: any) {
  const firstYacht =
    Array.isArray(data?.yachts) && data.yachts.length > 0
      ? data.yachts[0]
      : null;

  return {
    yachtName: String(firstYacht?.name ?? data?.yachtName ?? ''),
    yachtModel: String(firstYacht?.model ?? data?.yachtModel ?? ''),
    countryCode: String(firstYacht?.countryCode ?? data?.countryCode ?? ''),
  };
}

export function formatDateHr(value: Date | string | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('hr-HR');
}

export const COMPANY_BANK_BLOCK_HTML = `
<strong>BANK DETAILS / BANKOVNI DETALJI:</strong><br>
Beneficiary / Korisnik: All Services MARINE d.o.o.<br>
Beneficiary Bank / Banka primatelj: ERSTE&STEIERMARKISCHE BANK d.d.<br>
IBAN: HR5124020061101131858<br>
Bank address / Adresa banke: JADRANSKA TRG 3a, 51000 RIJEKA, REPUBLIKA HRVATSKA<br>
SWIFT / BRZ: ESBCHR22<br>
<div style="text-align: center; margin-top: 20px;">V.Cherednichenko</div>
`;
