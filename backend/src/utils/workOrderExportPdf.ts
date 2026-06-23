import * as fs from 'fs';
import * as path from 'path';
import { getTranslations } from './translations';
import {
  getLogoUrl,
  getPartArticleNumber,
  getPartLabel,
  getPartQuantity,
  getServiceName,
  getServiceQuantity,
  normalizeServices,
  resolveYachtFields,
} from './pdfFormatters';

function applyWorkOrderTranslations(template: string, lang?: string): string {
  const t = getTranslations(lang);

  return template
    .replace('WORK ORDER / RADNI NALOG', `${t.WORK_ORDER} / ${t.WORK_ORDER_HR}`)
    .replace('Number/Broj:', `${t.NUMBER}:`)
    .replace('Date/Datum:', `${t.DATE}:`)
    .replace('Offer/Ponuda:', `${t.OFFER_REF}:`)
    .replace('Customer/Kupac:', `${t.CUSTOMER}:`)
    .replace('Address/Adresa:', `${t.ADDRESS}:`)
    .replace('Description/Opis:', `${t.DESCRIPTION}:`)
    .replace(
      'Non Schedule Service / Usluga izvan rasporeda',
      `${t.DESCRIPTION_VALUE}`,
    )
    .replace('Yacht Name/Ime jahte:', `${t.YACHT_NAME}:`)
    .replace('Yacht Model / Model jahte/ SN/SB:', `${t.YACHT_MODEL}:`)
    .replace('Reg. Number/Reg. Broj:', `${t.REG_NUMBER}:`)
    .replace('Location/Mjesto:', `${t.LOCATION}:`)
    .replace(
      'Assigned workers / Odgovorni radnici:',
      `${t.ASSIGNED_WORKERS}:`,
    )
    .replace('Products / Proizvodi', `${t.PRODUCTS}`)
    .replace('Work / Radovi', `${t.WORK}`)
    .replace('<th>No.</th>', `<th>${t.NO}</th>`)
    .replace('<th>Products / Proizvodi</th>', `<th>${t.PRODUCTS}</th>`)
    .replace(
      '<th>Article Number / Artikal</th>',
      `<th>${t.ARTICLE_NUMBER}</th>`,
    )
    .replace('<th>Quantity / Količina</th>', `<th>${t.QUANTITY}</th>`)
    .replace('<th>Service / Servis</th>', `<th>${t.SERVICE}</th>`);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function workerNoteCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    not_fit: 'Does not fit',
    replace: 'Needs replacement',
    missing: 'Missing',
    other: 'Other',
  };
  return labels[category] || category || 'Other';
}

function buildWorkOrderComment(workerNotes: any[] = []): string {
  const lines: string[] = [];

  for (const note of workerNotes) {
    const message = String(note?.message ?? '').trim();
    if (!message) continue;
    const category = workerNoteCategoryLabel(String(note?.category ?? 'other'));
    const author = String(note?.author?.fullName ?? '').trim();
    const createdAt = note?.createdAt ? new Date(note.createdAt) : null;
    const dateStr =
      createdAt && !isNaN(createdAt.getTime())
        ? createdAt.toLocaleString()
        : '';
    const meta = [author, dateStr].filter(Boolean).join(', ');
    lines.push(`[${category}] ${message}${meta ? ` (${meta})` : ''}`);
  }

  return lines.join('\n');
}

function renderWorkOrderCommentBlock(
  workerNotes: any[] = [],
  lang?: string,
): string {
  const text = buildWorkOrderComment(workerNotes);
  if (!text) {
    return '';
  }

  const t = getTranslations(lang);
  const html = escapeHtml(text).replace(/\n/g, '<br>');
  return `
            <div class="comment-block">
                <strong>${t.COMMENT}:</strong><br>
                ${html}
            </div>`;
}

export function buildWorkOrderExportHtml(data: {
  order: any;
  offer: any;
  workerNotes?: any[];
}): string {
  const templatePath = path.join(process.cwd(), 'documents', 'work-order.html');
  let templateString = fs.readFileSync(templatePath, 'utf8');

  const order = data.order || {};
  const offer = data.offer || {};
  const workerNotes = Array.isArray(data.workerNotes) ? data.workerNotes : [];
  const language = offer.language || 'en';
  const yacht = resolveYachtFields(offer);
  const parts = Array.isArray(order.parts) ? order.parts : [];
  const services = normalizeServices(order.services);

  const assignedWorkers = Array.isArray(order.assignedWorkers)
    ? order.assignedWorkers.map((w: any) => w.fullName || w.label || '').filter(Boolean).join(', ')
    : '';

  const partsTableRows = parts
    .map((part: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${getPartLabel(part)}</td>
        <td>${getPartArticleNumber(part)}</td>
        <td>${getPartQuantity(part)}</td>
      </tr>
    `)
    .join('');

  const servicesTableRows = services
    .map((service: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${getServiceName(service)}</td>
        <td>${getServiceQuantity(service)}</td>
      </tr>
    `)
    .join('');

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const createdAtString = isNaN(createdAt.getTime())
    ? ''
    : createdAt.toLocaleString();

  const documentNumber = String(offer.id ?? order.offerId ?? '');

  templateString = templateString
    .replace(/\{\{logoUrl\}\}/g, getLogoUrl())
    .replace('{{orderId}}', documentNumber)
    .replace('{{offerId}}', documentNumber)
    .replace('{{customerFullName}}', String(offer.customerFullName ?? ''))
    .replace('{{yachtName}}', yacht.yachtName)
    .replace('{{yachtModel}}', yacht.yachtModel)
    .replace('{{countryCode}}', yacht.countryCode)
    .replace('{{location}}', String(offer.location ?? ''))
    .replace('{{createdAt}}', createdAtString)
    .replace('{{assignedWorkers}}', assignedWorkers || '—')
    .replace('{{partsTableRows}}', partsTableRows)
    .replace('{{servicesTableRows}}', servicesTableRows)
    .replace('{{commentBlock}}', renderWorkOrderCommentBlock(workerNotes, language));

  return applyWorkOrderTranslations(templateString, language);
}
