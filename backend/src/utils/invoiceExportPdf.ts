import * as fs from 'fs';
import * as path from 'path';
import { getTranslations } from './translations';
import {
  formatDateHr,
  formatMoney,
  getLogoUrl,
  getPartArticleNumber,
  getPartLabel,
  getPartPricePerUnit,
  getPartQuantity,
  getServiceName,
  getServicePrice,
  getServiceQuantity,
  getServiceLineTotal,
  normalizeServices,
} from './pdfFormatters';
import { computeOfferTotals } from './offerTotals';

function applyInvoiceTranslations(template: string, lang?: string): string {
  const t = getTranslations(lang);

  return template
    .replace('PROFORMA INVOICE', `${t.PROFORMA_INVOICE}`)
    .replace('Place and date of issue:', `${t.PLACE_AND_DATE}:`)
    .replace('Method of payment:', `${t.METHOD_OF_PAYMENT}:`)
    .replace('Transakcijski', `${t.BANK_TRANSFER}`)
    .replace('Order:', `${t.ORDER}:`)
    .replace('Address:', `${t.ADDRESS}:`)
    .replace('Name:', `${t.NAME}:`)
    .replace('Model:', `${t.MODEL}:`)
    .replace('Location:', `${t.LOCATION_LABEL}:`)
    .replaceAll('<th>No.</th>', `<th>${t.NO}</th>`)
    .replaceAll('<th>Products / Proizvodi</th>', `<th>${t.PRODUCTS}</th>`)
    .replaceAll(
      '<th>Article Number / Artikal</th>',
      `<th>${t.ARTICLE_NUMBER}</th>`,
    )
    .replaceAll('<th>Quantity / Količina</th>', `<th>${t.QUANTITY}</th>`)
    .replaceAll(
      '<th>Price in EURO per pcs/ Cijena u Eurima ed/kom</th>',
      `<th>${t.PRICE_PER_PCS}</th>`,
    )
    .replaceAll(
      '<th>Price in EURO/ Cijena u Eurima</th>',
      `<th>${t.PRICE}</th>`,
    )
    .replaceAll('<th>Service / Servis</th>', `<th>${t.SERVICE}</th>`)
    .replace('Products / Proizvodi', `${t.PRODUCTS}`)
    .replace('Provided Services / Pružene usluge:', `${t.PROVIDED_SERVICES}:`)
    .replace('IZNOS / AMOUNT:', `${t.GROSS_AMOUNT}:`)
    .replace('Discount / Rabat:', `${t.DISCOUNT_LABEL}:`)
    .replace('UKUPNO / SUBTOTAL:', `${t.SUBTOTAL_AFTER_DISCOUNT}:`)
    .replace('PDV (25%) / VAT (25%):', `${t.VAT_25}:`)
    .replace('TOTAL AMOUNT / SVEUKUPNI IZNOS:', `${t.TOTAL_AMOUNT}:`)
    .replace('Remark / Napomena:', `${t.REMARK}:`)
    .replace('BANK DETAILS / BANKOVNI DETALJI:', `${t.BANK_DETAILS}:`)
    .replace('Beneficiary / Korisnik:', `${t.BENEFICIARY}:`)
    .replace('Beneficiary Bank / Banka primatelj:', `${t.BENEFICIARY_BANK}:`)
    .replace('Bank address / Adresa banke:', `${t.BANK_ADDRESS}:`)
    .replace('SWIFT / BRZ:', `${t.SWIFT}:`)
    .replace('<span>DVO:</span>', `<span>${t.ISSUE_DATE_ABBR}</span>`)
    .replace('<span>Payment due:</span>', `<span>${t.PAYMENT_DUE}</span>`)
    .replace('<span>Reference number:</span>', `<span>${t.REFERENCE_NUMBER}</span>`)
    .replace('Datum i vrijeme izdavanja:', `${t.ISSUE_DATETIME}:`)
    .replace('Document issued by:', `${t.DOCUMENT_ISSUED_BY}:`)
    .replace(
      'Društvo je upisano kod Trgovačkog suda u Pazinu MBS 130134955',
      `${t.COMPANY_REG_1}`,
    )
    .replace(
      'Temeljni kapital iznosi 2.654,46 EUR i uplaćen je u cijelosti.',
      `${t.COMPANY_REG_2}`,
    )
    .replace('Članovi uprave: Viktor Cherednichenko', `${t.COMPANY_REG_3}`);
}

export function computeInvoiceTotals(
  parts: any[],
  services: any[],
  discountAmount = 0,
  discountPercent = 0,
) {
  return computeOfferTotals(parts, services, discountAmount, discountPercent);
}

export function buildInvoiceExportHtml(data: any): string {
  const templatePath = path.join(process.cwd(), 'documents', 'Invoice.html');
  let templateString = fs.readFileSync(templatePath, 'utf8');

  const parts = Array.isArray(data?.parts) ? data.parts : [];
  const services = normalizeServices(data?.services);
  const totals = computeInvoiceTotals(
    parts,
    services,
    data?.discountAmount,
    data?.discountPercent,
  );

  const invoiceTableRows = parts
    .map((part: any, index: number) => {
      const quantity = getPartQuantity(part);
      const pricePerUnit = getPartPricePerUnit(part);
      const lineTotal = quantity * pricePerUnit;
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${getPartLabel(part)}</td>
        <td>${getPartArticleNumber(part)}</td>
        <td>${quantity}</td>
        <td>${formatMoney(pricePerUnit)}</td>
        <td>${formatMoney(lineTotal)}</td>
      </tr>
    `;
    })
    .join('');

  const invoiceServicesRows = services
    .map((service: any, index: number) => {
      const quantity = getServiceQuantity(service);
      const unitPrice = getServicePrice(service);
      const lineTotal = getServiceLineTotal(service);
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${getServiceName(service)}</td>
        <td>${quantity}</td>
        <td>${formatMoney(unitPrice)}</td>
        <td>${formatMoney(lineTotal)}</td>
      </tr>
    `;
    })
    .join('');

  const createdAt = data?.createdAt ? new Date(data.createdAt) : new Date();
  const paymentDueAt = data?.paymentDueAt
    ? new Date(data.paymentDueAt)
    : new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);

  const issueDateTime = createdAt.toLocaleString('hr-HR');

  const remark = String(data?.remark ?? '').trim() || '—';

  templateString = templateString
    .replace(/\{\{logoUrl\}\}/g, getLogoUrl())
    .replace('{{invoiceNumber}}', String(data?.invoiceNumber ?? ''))
    .replace('{{createdAt}}', formatDateHr(createdAt))
    .replace('{{issueDate}}', formatDateHr(createdAt))
    .replace('{{paymentDueDate}}', formatDateHr(paymentDueAt))
    .replace('{{issueDateTime}}', issueDateTime)
    .replace('{{remark}}', remark)
    .replace('{{orderId}}', String(data?.orderId || data?.offerId || ''))
    .replace('{{customerFullName}}', String(data?.customerFullName ?? ''))
    .replace('{{yachtNameOffer}}', String(data?.yachtName ?? ''))
    .replace('{{yachtModelOffer}}', String(data?.yachtModel ?? ''))
    .replace('{{location}}', String(data?.location ?? ''))
    .replace('{{invoiceTableRows}}', invoiceTableRows)
    .replace('{{invoiceServicesRows}}', invoiceServicesRows)
    .replace('{{grossAmount}}', formatMoney(totals.grossAmount))
    .replace('{{discountPercent}}', formatMoney(totals.discountPercent))
    .replace('{{discountAmount}}', formatMoney(totals.discountAmount))
    .replace('{{subtotalAfterDiscount}}', formatMoney(totals.subtotalAfterDiscount))
    .replace('{{vatAmount}}', formatMoney(totals.vatAmount))
    .replace('{{grandTotal}}', formatMoney(totals.grandTotal))
    .replace('{{referenceNumber}}', String(data?.offerId ?? data?.id ?? ''));

  return applyInvoiceTranslations(templateString, data?.language);
}
