import * as fs from 'fs';
import * as path from 'path';
import { getTranslations } from './translations';
import {
  formatDateHr,
  formatMoney,
  getLogoUrl,
  getPartLabel,
  getPartPricePerUnit,
  getPartQuantity,
  getServiceName,
  getServicePrice,
  normalizeServices,
} from './pdfFormatters';

function applyInvoiceTranslations(template: string, lang?: string): string {
  const t = getTranslations(lang);

  return template
    .replace('INVOICE / RAČUN', `${t.INVOICE} / ${t.INVOICE_HR}`)
    .replace('Place and date of issue:', `${t.PLACE_AND_DATE}:`)
    .replace('GLAVNO SKLADIŠTE', `${t.WAREHOUSE}`)
    .replace('Remark:', `${t.REMARK}:`)
    .replace('Method of payment:', `${t.METHOD_OF_PAYMENT}:`)
    .replace('Order:', `${t.ORDER}:`)
    .replace('Address:', `${t.ADDRESS}:`)
    .replace('Name:', `${t.NAME}:`)
    .replace('Model:', `${t.MODEL}:`)
    .replace('Location:', `${t.LOCATION_LABEL}:`)
    .replace('<h2>Products</h2>', `<h2>${t.PRODUCTS}</h2>`)
    .replace('<span>ID</span>', `<span>${t.ID}</span>`)
    .replace('<span>Products</span>', `<span>${t.PRODUCTS}</span>`)
    .replace('<span>Quantity</span>', `<span>${t.QUANTITY}</span>`)
    .replace('<span>Price per unit EUR</span>', `<span>${t.PRICE_PER_UNIT_EUR}</span>`)
    .replace('<span>Price EUR</span>', `<span>${t.PRICE_EUR}</span>`)
    .replace('<h2 class="work-title">Work</h2>', `<h2 class="work-title">${t.WORK}</h2>`)
    .replace('<span>Service</span>', `<span>${t.SERVICE}</span>`)
    .replace('<div>Inventory costs</div>', `<div>${t.INVENTORY_COSTS}</div>`)
    .replace('<div>Without tax</div>', `<div>${t.WITHOUT_TAX}</div>`)
    .replace('<div>VAT</div>', `<div>${t.VAT}</div>`)
    .replace('<div>Total amount</div>', `<div>${t.TOTAL_AMOUNT_TITLE}</div>`)
    .replace('Osnovica 25 %', `${t.TAX_BASE_25}`)
    .replace('Osnovica PDV', `${t.TAX_BASE_VAT}`)
    .replace('PDV', `${t.VAT}`)
    .replace('<span>DVO:</span>', `<span>${t.ISSUE_DATE_ABBR}</span>`)
    .replace('<span>Payment due:</span>', `<span>${t.PAYMENT_DUE}</span>`)
    .replace('<span>Reference number:</span>', `<span>${t.REFERENCE_NUMBER}</span>`)
    .replace('Payment must be made to a bank account', `${t.PAYMENT_TO_BANK_ACCOUNT}`)
    .replace('Oznaka plaćanja: Transakcijski račun', `${t.PAYMENT_MARK}`)
    .replace('Datum i vrijeme izdavanja:', `${t.ISSUE_DATETIME}:`)
    .replace('Dokument Izdao:', `${t.DOCUMENT_ISSUED_BY}:`)
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

export function computeInvoiceTotals(parts: any[], services: any[]) {
  const partsTotal = (Array.isArray(parts) ? parts : []).reduce((acc, part) => {
    return acc + getPartQuantity(part) * getPartPricePerUnit(part);
  }, 0);

  const servicesTotal = normalizeServices(services).reduce(
    (acc, service) => acc + getServicePrice(service),
    0,
  );

  const subtotalWithoutTax = partsTotal + servicesTotal;
  const taxAmount = subtotalWithoutTax * 0.25;
  const totalWithTax = subtotalWithoutTax + taxAmount;

  return { partsTotal, servicesTotal, subtotalWithoutTax, taxAmount, totalWithTax };
}

export function buildInvoiceExportHtml(data: any): string {
  const templatePath = path.join(process.cwd(), 'documents', 'Invoice.html');
  let templateString = fs.readFileSync(templatePath, 'utf8');

  const parts = Array.isArray(data?.parts) ? data.parts : [];
  const services = normalizeServices(data?.services);
  const totals = computeInvoiceTotals(parts, services);

  const invoiceTableRows = parts
    .map((part: any, index: number) => {
      const quantity = getPartQuantity(part);
      const pricePerUnit = getPartPricePerUnit(part);
      const lineTotal = quantity * pricePerUnit;
      return `
      <div>
        <span>${index + 1}</span>
        <span>${getPartLabel(part)}</span>
        <span>${quantity}</span>
        <span>${formatMoney(pricePerUnit)}</span>
        <span>${formatMoney(lineTotal)}</span>
      </div>
    `;
    })
    .join('');

  const invoiceServicesRows = services
    .map((service: any, index: number) => {
      const price = getServicePrice(service);
      return `
      <div>
        <span>${index + 1}</span>
        <span>${getServiceName(service)}</span>
        <span>1</span>
        <span>${formatMoney(price)}</span>
        <span>${formatMoney(price)}</span>
      </div>
    `;
    })
    .join('');

  const createdAt = data?.createdAt ? new Date(data.createdAt) : new Date();
  const paymentDueAt = data?.paymentDueAt
    ? new Date(data.paymentDueAt)
    : new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);

  const issueDateTime = createdAt.toLocaleString('hr-HR');

  templateString = templateString
    .replace(/\{\{logoUrl\}\}/g, getLogoUrl())
    .replace('{{invoiceNumber}}', String(data?.invoiceNumber ?? ''))
    .replace('{{createdAt}}', formatDateHr(createdAt))
    .replace('{{issueDate}}', formatDateHr(createdAt))
    .replace('{{paymentDueDate}}', formatDateHr(paymentDueAt))
    .replace('{{issueDateTime}}', issueDateTime)
    .replace('{{offerIdInvoice}}', String(data?.offerId ?? ''))
    .replace('{{orderId}}', String(data?.orderId || data?.offerId || ''))
    .replace('{{customerFullName}}', String(data?.customerFullName ?? ''))
    .replace('{{yachtNameOffer}}', String(data?.yachtName ?? ''))
    .replace('{{yachtModelOffer}}', String(data?.yachtModel ?? ''))
    .replace('{{location}}', String(data?.location ?? ''))
    .replace('{{invoiceTableRows}}', invoiceTableRows)
    .replace('{{invoiceServicesRows}}', invoiceServicesRows)
    .replace('{{totalPriceInvoice}}', formatMoney(totals.subtotalWithoutTax))
    .replace('{{totalPriceTax}}', formatMoney(totals.taxAmount))
    .replace('{{totalPriceInvoiceServicesTwo}}', formatMoney(totals.subtotalWithoutTax))
    .replace('{{totalPriceTaxTwo}}', formatMoney(totals.taxAmount))
    .replace('{{totalPriceInvoiceTwo}}', formatMoney(totals.totalWithTax))
    .replace('{{referenceNumber}}', String(data?.offerId ?? data?.id ?? ''));

  return applyInvoiceTranslations(templateString, data?.language);
}
