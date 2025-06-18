import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

export async function createPdfBuffer(data: any, type: string): Promise<Buffer> {
  try {
    // Use export template for PDF export, regular template for email
    const templateName = type === 'offer-export' ? 'offer-export' : type;
    const templatePath = path.join(process.cwd(), 'documents', `${templateName}.html`);
    let templateString = fs.readFileSync(templatePath, 'utf8');

    // Duplicate data to avoid issues with template processing
    const exportData = {
      ...data,
      // Duplicate parts data
      parts: data.parts ? [...data.parts] : [],
      // Duplicate services data
      services: data.services ? { ...data.services } : {},
      // Duplicate image URLs
      imageUrls: data.imageUrls ? [...data.imageUrls] : [],
      // Duplicate offer data if exists
      offer: data.offer ? { ...data.offer } : null
    };

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

    // Generate images HTML if images exist
    const imagesHtml = exportData.imageUrls && exportData.imageUrls.length > 0 ? `
      <div style="margin-top: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">Images / Slike</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          ${exportData.imageUrls.map((url: string, index: number) => `
            <div style="text-align: center;">
              <img src="${url}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 5px;">
              <p style="font-size: 12px; margin-top: 5px;">Image ${index + 1}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const totalPrice = exportData.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0);
    const totalPriceServices = Number(exportData.services?.priceInEuroWithoutVAT);
    const totalPriceAllServices = Number(exportData.services?.priceInEuroWithoutVAT);

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
      .replace('{{serviceName}}', String(exportData.services?.serviceName))
      .replace('{{serviceDescription}}', String(exportData.services?.description))
      .replace('{{status}}', String(exportData.status))
      .replace('{{createdAt}}', createdAtString)
      .replace('{{partsTableRows}}', String(partsTableRows))
      .replace('{{invoiceTableRows}}', String(invoiceTableRows))
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
      .replace('{{imagesSection}}', imagesHtml);

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