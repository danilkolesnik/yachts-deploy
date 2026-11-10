export function parseEuroNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

export function getServiceCode(service: any): string {
  return String(
    service?.serviceCode ?? service?.value?.serviceCode ?? '',
  ).trim();
}

export function getServiceName(service: any, lang?: string): string {
  const en = String(
    service?.serviceName ??
      service?.value?.serviceName ??
      service?.label ??
      '',
  );
  const hr = String(
    service?.serviceNameHr ?? service?.value?.serviceNameHr ?? '',
  ).trim();
  const normalized = String(lang ?? '')
    .trim()
    .toLowerCase();
  const name = normalized === 'hr' && hr ? hr : en;
  const code = getServiceCode(service);
  return code ? `[${code}] ${name}` : name;
}

export function getServicePrice(service: any): number {
  return parseEuroNumber(
    service?.priceInEuroWithoutVAT ?? service?.value?.priceInEuroWithoutVAT,
  );
}

export function getServiceQuantity(service: any): number {
  const quantity = parseEuroNumber(service?.quantity ?? service?.value?.quantity ?? 1);
  return quantity > 0 ? quantity : 1;
}

export function getServiceLineTotal(service: any): number {
  return getServiceQuantity(service) * getServicePrice(service);
}

export function getPartLabel(part: any): string {
  return String(
    part?.label ?? part?.name ?? part?.partName ?? part?.value?.label ?? '',
  );
}

function escapePdfHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Per-line work/material note for the offer language (EN/HR; DE uses EN). */
export function getLineDescription(item: any, lang?: string): string {
  const normalized = String(lang ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'hr') {
    return String(
      item?.descriptionHr ?? item?.value?.descriptionHr ?? item?.description ?? '',
    ).trim();
  }
  return String(
    item?.descriptionEn ?? item?.value?.descriptionEn ?? item?.description ?? '',
  ).trim();
}

/** Catalog name + optional individual description for PDF table cells. */
export function formatNameWithDescription(
  name: string,
  item: any,
  lang?: string,
): string {
  const safeName = escapePdfHtml(name);
  const description = getLineDescription(item, lang);
  if (!description) {
    return safeName;
  }
  const safeDescription = escapePdfHtml(description).replace(/\n/g, '<br>');
  return `${safeName}<div style="margin-top:4px;font-size:0.9em;color:#444;">${safeDescription}</div>`;
}

export function getPartArticleNumber(part: any): string {
  const article =
    part?.articleNumber ?? part?.value?.articleNumber ?? part?.value?.article;
  return article ? String(article) : '-';
}

export function getPartQuantity(part: any): number {
  const quantity = parseEuroNumber(part?.quantity ?? part?.value?.quantity ?? 1);
  return quantity > 0 ? quantity : 1;
}

export function formatPartQuantity(part: any): string {
  const quantity = getPartQuantity(part);
  const unit = String(part?.unitsOfMeasurement ?? part?.unit ?? '').trim();
  return unit ? `${quantity} ${escapePdfHtml(unit)}` : String(quantity);
}

export function getPartPricePerUnit(part: any): number {
  return parseEuroNumber(part?.pricePerUnit ?? part?.value?.pricePerUnit);
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
