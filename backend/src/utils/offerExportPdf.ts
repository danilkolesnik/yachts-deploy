import * as fs from 'fs';
import * as path from 'path';
import { getTranslations } from './translations';
import {
  formatMoney,
  getLogoUrl,
  getPartArticleNumber,
  getPartLabel,
  getPartPricePerUnit,
  getPartQuantity,
  getServiceName,
  getServicePrice,
  normalizeServices,
  resolveYachtFields,
} from './pdfFormatters';

function applyOfferTranslations(template: string, lang?: string): string {
  const t = getTranslations(lang);

  return template
    .replace('OFFER / PONUDA', `${t.OFFER} / ${t.OFFER_HR}`)
    .replace('Number/Broj:', `${t.NUMBER}:`)
    .replace('Date/Datum:', `${t.DATE}:`)
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
    .replace('Products / Proizvodi', `${t.PRODUCTS}`)
    .replace('<th>No.</th>', `<th>${t.NO}</th>`)
    .replace('<th>Products / Proizvodi</th>', `<th>${t.PRODUCTS}</th>`)
    .replace(
      '<th>Article Number / Artikal</th>',
      `<th>${t.ARTICLE_NUMBER}</th>`,
    )
    .replace('<th>Quantity / Količina</th>', `<th>${t.QUANTITY}</th>`)
    .replace(
      '<th>Price in EURO per pcs/ Cijena u Eurima ed/kom</th>',
      `<th>${t.PRICE_PER_PCS}</th>`,
    )
    .replace(
      '<th>Price in EURO/ Cijena u Eurima</th>',
      `<th>${t.PRICE}</th>`,
    )
    .replace('SUBTOTAL / UKUPNO:', `${t.SUBTOTAL}:`)
    .replace('Provided Services / Pružene usluge:', `${t.PROVIDED_SERVICES}:`)
    .replace('<th>Service / Servis</th>', `<th>${t.SERVICE}</th>`)
    .replace('TOTAL AMOUNT / SVEUKUPNI IZNOS:', `${t.TOTAL_AMOUNT}:`)
    .replace('BANK DETAILS / BANKOVNI DETALJI:', `${t.BANK_DETAILS}:`)
    .replace('Beneficiary / Korisnik:', `${t.BENEFICIARY}:`)
    .replace('Beneficiary Bank / Banka primatelj:', `${t.BENEFICIARY_BANK}:`)
    .replace('Bank address / Adresa banke:', `${t.BANK_ADDRESS}:`)
    .replace('SWIFT / BRZ:', `${t.SWIFT}:`);
}

export function buildOfferExportHtml(data: any): string {
  const templatePath = path.join(process.cwd(), 'documents', 'offer-export.html');
  let templateString = fs.readFileSync(templatePath, 'utf8');

  const exportData = {
    ...data,
    parts: Array.isArray(data?.parts) ? [...data.parts] : [],
    imageUrls: Array.isArray(data?.imageUrls) ? [...data.imageUrls] : [],
    videoUrls: Array.isArray(data?.videoUrls) ? [...data.videoUrls] : [],
  };

  const t = getTranslations(exportData.language);
  const yacht = resolveYachtFields(exportData);
  const services = normalizeServices(exportData.services);

  const partsTableRows = exportData.parts
    .map((part: any, index: number) => {
      const quantity = getPartQuantity(part);
      const pricePerUnit = getPartPricePerUnit(part);
      const total = quantity * pricePerUnit;
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${getPartLabel(part)}</td>
        <td>${getPartArticleNumber(part)}</td>
        <td>${quantity}</td>
        <td>${formatMoney(pricePerUnit)}</td>
        <td>${formatMoney(total)}</td>
      </tr>
    `;
    })
    .join('');

  const servicesTableRows = services
    .map((service: any, index: number) => {
      const price = getServicePrice(service);
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${getServiceName(service)}</td>
        <td>1</td>
        <td>${formatMoney(price)}</td>
        <td>${formatMoney(price)}</td>
      </tr>
    `;
    })
    .join('');

  const totalPrice = exportData.parts.reduce((acc: number, part: any) => {
    return acc + getPartQuantity(part) * getPartPricePerUnit(part);
  }, 0);

  const totalPriceAllServices = services.reduce(
    (acc: number, service: any) => acc + getServicePrice(service),
    0,
  );

  const totalPriceAll = totalPrice + totalPriceAllServices;

  const imagesHtml =
    exportData.imageUrls.length > 0
      ? `
      <div style="margin-top: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">${t.IMAGES}</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          ${exportData.imageUrls
            .map(
              (url: string, index: number) => `
            <div style="text-align: center;">
              <img src="${url}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 5px;">
              <p style="font-size: 12px; margin-top: 5px;">${t.IMAGE_LABEL} ${index + 1}</p>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  const videosHtml =
    exportData.videoUrls.length > 0
      ? `
      <div style="margin-top: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">${t.VIDEOS}</h2>
        <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 15px; margin-bottom: 20px;">
          ${exportData.videoUrls
            .map(
              (url: string, index: number) => `
            <div style="text-align: center;">
              <div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; background-color: #f5f5f5;">
                <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">${t.VIDEO_LABEL} ${index + 1}</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">${t.VIDEO_FILE_AVAILABLE}</p>
                <a href="${url}" style="font-size: 11px; color: #0066cc; text-decoration: underline; word-break: break-all;">${url}</a>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  const createdAt = exportData.createdAt
    ? new Date(exportData.createdAt)
    : new Date();
  const createdAtString = isNaN(createdAt.getTime())
    ? ''
    : createdAt.toLocaleString();

  templateString = templateString
    .replace(/\{\{logoUrl\}\}/g, getLogoUrl())
    .replace('{{offerId}}', String(exportData.id ?? ''))
    .replace('{{customerFullName}}', String(exportData.customerFullName ?? ''))
    .replace('{{yachtName}}', yacht.yachtName)
    .replace('{{yachtModel}}', yacht.yachtModel)
    .replace('{{countryCode}}', yacht.countryCode)
    .replace('{{location}}', String(exportData.location ?? ''))
    .replace('{{createdAt}}', createdAtString)
    .replace('{{partsTableRows}}', partsTableRows)
    .replace('{{servicesTableRows}}', servicesTableRows)
    .replace('{{totalPrice}}', formatMoney(totalPrice))
    .replace('{{totalPriceAllServices}}', formatMoney(totalPriceAllServices))
    .replace('{{totalPriceAll}}', formatMoney(totalPriceAll))
    .replace('{{imagesSection}}', imagesHtml)
    .replace('{{videosSection}}', videosHtml);

  return applyOfferTranslations(templateString, exportData.language);
}
