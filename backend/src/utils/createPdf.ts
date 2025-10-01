import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { getTranslations } from './translations';

export async function createPdfBuffer(data: any, type: string): Promise<Buffer> {
  try {
    const normalizedType = String(type || '').toLowerCase();
    const templateName =
      normalizedType === 'offer-export'
        ? 'offer-export'
        : normalizedType === 'invoice'
          ? 'Invoice'
          : normalizedType;
    const templatePath = path.join(process.cwd(), 'documents', `${templateName}.html`);
    let templateString = fs.readFileSync(templatePath, 'utf8');
    const exportData = {
      ...data,
      parts: data.parts ? [...data.parts] : [],
      services: data.services ? { ...data.services } : {},
      imageUrls: data.imageUrls ? [...data.imageUrls] : [],
      videoUrls: data.videoUrls ? [...data.videoUrls] : [],
      offer: data.offer ? { ...data.offer } : null
    };

    const t = getTranslations(exportData.language);

    const partsTableRows = exportData.parts?.map((part: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${part.label}</td>
        <td>${part.quantity}</td>
        <td>${part.pricePerUnit}</td>
        <td>${part.quantity * part.pricePerUnit}</td>
      </tr>
    `).join('');

    const invoiceTableRows = exportData.offer?.parts?.map((part: any, index: number) => `
      <div>
        <span>${index + 1}</span>
        <span>${part.label}</span>
        <span>${part.quantity}</span>
        <span>${part.pricePerUnit}</span>
        <span>${part.quantity * part.pricePerUnit}</span>
      </div>
    `).join('');

    // Generate services table rows for both array and single service
    const servicesTableRows = (() => {
      if (Array.isArray(exportData.services) && exportData.services.length > 0) {
        return exportData.services.map((service: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${service.serviceName}</td>
            <td>1</td>
            <td>${service.priceInEuroWithoutVAT}</td>
            <td>${service.priceInEuroWithoutVAT}</td>
          </tr>
        `).join('');
      } else if (exportData.services && typeof exportData.services === 'object') {
        return `
          <tr>
            <td>1</td>
            <td>${exportData.services.serviceName}</td>
            <td>1</td>
            <td>${exportData.services.priceInEuroWithoutVAT}</td>
            <td>${exportData.services.priceInEuroWithoutVAT}</td>
          </tr>
        `;
      }
      return '';
    })();

    // Generate images HTML if images exist
    const imagesHtml = exportData.imageUrls && exportData.imageUrls.length > 0 ? `
      <div style="margin-top: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">${t.IMAGES}</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          ${exportData.imageUrls.map((url: string, index: number) => `
            <div style="text-align: center;">
              <img src="${url}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 5px;">
              <p style="font-size: 12px; margin-top: 5px;">${t.IMAGE_LABEL} ${index + 1}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Generate videos HTML if videos exist
    const videosHtml = exportData.videoUrls && exportData.videoUrls.length > 0 ? `
      <div style="margin-top: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">${t.VIDEOS}</h2>
        <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 15px; margin-bottom: 20px;">
          ${exportData.videoUrls.map((url: string, index: number) => `
            <div style="text-align: center;">
              <div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; background-color: #f5f5f5;">
                <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">${t.VIDEO_LABEL} ${index + 1}</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">${t.VIDEO_FILE_AVAILABLE}</p>
                <a href="${url}" style="font-size: 11px; color: #0066cc; text-decoration: underline; word-break: break-all;">${url}</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const totalPrice = exportData.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0);
    
    // Handle both array and single service object for backward compatibility
    let totalPriceServices = 0;
    let totalPriceAllServices = 0;
    if (Array.isArray(exportData.services)) {
      totalPriceServices = exportData.services.reduce((acc: number, service: any) => acc + Number(service?.priceInEuroWithoutVAT || 0), 0);
      totalPriceAllServices = totalPriceServices;
    } else if (exportData.services && typeof exportData.services === 'object') {
      totalPriceServices = Number(exportData.services?.priceInEuroWithoutVAT || 0);
      totalPriceAllServices = totalPriceServices;
    }

    const createdAt = new Date();
    const createdAtString = isNaN(createdAt.getTime()) ? 'Invalid Date' : createdAt.toLocaleString();

    const totalPriceAll = totalPrice + totalPriceServices;
    const totalPriceInvoiceServices = Number(exportData.offer?.services?.priceInEuroWithoutVAT) + Number(exportData.offer?.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0));
    const totalPriceInvoiceServicesTwo = Number(exportData.offer?.services?.priceInEuroWithoutVAT) + Number(exportData.offer?.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0));
    const idService = Math.floor(Math.random() * 1000000);

    const totalPriceTax = totalPriceInvoiceServices * 0.25;
    const totalPriceTaxTwo = totalPriceInvoiceServices * 0.25;
    const totalPriceInvoice = totalPriceInvoiceServices + totalPriceTax;
    const totalPriceInvoiceTwo = totalPriceInvoiceServices + totalPriceTax;

    templateString = templateString.replace('{{offerId}}', String(exportData.id))
      .replace('{{customerFullName}}', String(exportData.customerFullName))
      .replace('{{yachtName}}', String(exportData.yachtName))
      .replace('{{yachtModel}}', String(exportData.yachtModel))
      .replace('{{yachtModelOffer}}', String(exportData.offer?.yachtModel))
      .replace('{{yachtNameOffer}}', String(exportData.offer?.yachtName))
      .replace('{{countryCode}}', String(exportData.countryCode))
      .replace('{{serviceName}}', Array.isArray(exportData.services) && exportData.services.length > 0 
        ? exportData.services.map(s => s.serviceName).join(', ')
        : String(exportData.services?.serviceName || ''))
      .replace('{{serviceDescription}}', Array.isArray(exportData.services) && exportData.services.length > 0 
        ? exportData.services.map(s => s.description || s.serviceName).join(', ')
        : String(exportData.services?.description || ''))
      .replace('{{status}}', String(exportData.status))
      .replace('{{createdAt}}', createdAtString)
      .replace('{{partsTableRows}}', String(partsTableRows))
      .replace('{{invoiceTableRows}}', String(invoiceTableRows))
      .replace('{{servicesTableRows}}', String(servicesTableRows))
      .replace('{{totalPrice}}', String(totalPrice))
      .replace('{{seriveName}}', String(exportData.services?.serviceName))
      .replace('{{servicePrice}}', String(exportData.services?.priceInEuroWithoutVAT))
      .replace('{{serviceQuantity}}', String(1))
      .replace('{{totalPriceServices}}', String(totalPriceServices))
      .replace('{{totalPriceAll}}', String(totalPriceAll))
      .replace('{{totalPriceAllServices}}', String(totalPriceAllServices))
      .replace('{{orderId}}', String(exportData.id))
      .replace('{{offerIdInvoice}}', String(exportData.offer?.id))
      .replace('{{seriveNameInvoice}}', String(exportData.offer?.services?.serviceName))
      .replace('{{servicePriceInvoice}}', String(exportData.offer?.services?.priceInEuroWithoutVAT))
      .replace('{{totalPriceInvoiceServices}}', String(exportData.offer?.services?.priceInEuroWithoutVAT))
      .replace('{{serviceQuantityInvoice}}', String(1))
      .replace('{{idService}}', String(idService))
      .replace('{{totalPriceInvoice}}', String(totalPriceInvoiceServices))
      .replace('{{totalPriceTax}}', String(totalPriceTax))
      .replace('{{totalPriceInvoiceAll}}', String(totalPriceInvoice))
      .replace('{{totalPriceInvoiceTwo}}', String(totalPriceInvoiceTwo))
      .replace('{{totalPriceInvoiceServicesTwo}}', String(totalPriceInvoiceServicesTwo))
      .replace('{{totalPriceTaxTwo}}', String(totalPriceTaxTwo))
      .replace('{{imagesSection}}', imagesHtml)
      .replace('{{videosSection}}', videosHtml)
      // Translations to single-language labels
      .replace('OFFER / PONUDA', `${t.OFFER}`)
      .replace('Number/Broj:', `${t.NUMBER}:`)
      .replace('Date/Datum:', `${t.DATE}:`)
      .replace('Customer/Kupac:', `${t.CUSTOMER}:`)
      .replace('Address/Adresa:', `${t.ADDRESS}:`)
      .replace('Description/Opis:', `${t.DESCRIPTION}:`)
      .replace('Non Schedule Service / Usluga izvan rasporeda', `${t.DESCRIPTION_VALUE}`)
      .replace('Yacht Name/Ime jahte:', `${t.YACHT_NAME}:`)
      .replace('Yacht Model / Model jahte/ SN/SB:', `${t.YACHT_MODEL}:`)
      .replace('Reg. Number/Reg. Broj:', `${t.REG_NUMBER}:`)
      .replace('Location/Mjesto:', `${t.LOCATION}:`)
      .replace('Products / Proizvodi', `${t.PRODUCTS}`)
      .replace('<th>No.</th>', `<th>${t.NO}</th>`)
      .replace('<th>Products / Proizvodi</th>', `<th>${t.PRODUCTS}</th>`)
      .replace('<th>Quantity / Količina</th>', `<th>${t.QUANTITY}</th>`)
      .replace('<th>Price in EURO per pcs/ Cijena u Eurima ed/kom</th>', `<th>${t.PRICE_PER_PCS}</th>`)
      .replace('<th>Price in EURO/ Cijena u Eurima</th>', `<th>${t.PRICE}</th>`)
      .replace('SUBTOTAL / UKUPNO:', `${t.SUBTOTAL}:`)
      .replace('Provided Services / Pružene usluge:', `${t.PROVIDED_SERVICES}:`)
      .replace('<th>Service / Servis</th>', `<th>${t.SERVICE}</th>`)
      .replace('TOTAL AMOUNT / SVEUKUPNI IZNOS:', `${t.TOTAL_AMOUNT}:`)
      .replace('BANK DETAILS / BANKOVNI DETALJI:', `${t.BANK_DETAILS}:`)
      // Bank labels in offer/invoice
      .replace('Beneficiary / Korisnik:', `${t.BENEFICIARY}:`)
      .replace('Beneficiary Bank / Banka primatelj:', `${t.BENEFICIARY_BANK}:`)
      .replace('Bank address / Adresa banke:', `${t.BANK_ADDRESS}:`)
      .replace('SWIFT / BRZ:', `${t.SWIFT}:`)
      .replace('Beneficiary Bank:', `${t.BENEFICIARY_BANK}:`)
      .replace('Bank address:', `${t.BANK_ADDRESS}:`)
      // Invoice translations
      .replace('INVOICE', `${t.INVOICE}`)
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
      .replace('<div>Inventory costs</div>', `<div>${t.INVENTORY_COSTS}</div>`) 
      .replace('<div>Without tax</div>', `<div>${t.WITHOUT_TAX}</div>`) 
      .replace('<div>VAT</div>', `<div>${t.VAT}</div>`) 
      .replace('<div>Total amount</div>', `<div>${t.TOTAL_AMOUNT_TITLE}</div>`) 
      .replace('Osnovica 25 %', `${t.TAX_BASE_25}`)
      .replace('Osnovica PDV', `${t.TAX_BASE_VAT}`)
      .replace('PDV', `${t.VAT}`)
      .replace('<h1>SLOVIMA:(ŠESTOSEDAMDESETSEDAM EURA I PEDESET CENTI)</h1>', `<h1>${t.IN_WORDS}</h1>`) 
      .replace('<span>DVO:</span>', `<span>${t.ISSUE_DATE_ABBR}</span>`) 
      .replace('<span>Payment due:</span>', `<span>${t.PAYMENT_DUE}</span>`) 
      .replace('<span>Reference number:</span>', `<span>${t.REFERENCE_NUMBER}</span>`) 
      .replace('Payment must be made to a bank account', `${t.PAYMENT_TO_BANK_ACCOUNT}`)
      .replace('Oznaka plaćanja: Transakcijski račun', `${t.PAYMENT_MARK}`)
      .replace('Datum i vrijeme izdavanja:', `${t.ISSUE_DATETIME}:`)
      .replace('Dokument Izdao:', `${t.DOCUMENT_ISSUED_BY}:`)
      .replace('Društvo je upisano kod Trgovačkog suda u Pazinu MBS 130134955', `${t.COMPANY_REG_1}`)
      .replace('Temeljni kapital iznosi 2.654,46 EUR i uplaćen je u cijelosti.', `${t.COMPANY_REG_2}`)
      .replace('Članovi uprave: Viktor Cherednichenko', `${t.COMPANY_REG_3}`);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(templateString, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw new Error(`Failed to create PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}