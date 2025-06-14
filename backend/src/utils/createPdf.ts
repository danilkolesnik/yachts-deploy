import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

export async function createPdfBuffer(data: any, type: string): Promise<Buffer> {
  try {
    const templatePath = path.join(process.cwd(), 'documents', `${type}.html`);
    let templateString = fs.readFileSync(templatePath, 'utf8');

    const partsTableRows = data.parts?.map((part: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${part.label}</td>
        <td>${part.quantity}</td>
        <td>${part.pricePerUnit}</td>
        <td>${part.quantity * part.pricePerUnit}</td>
      </tr>
    `).join('');

    const invoiceTableRows = data.offer?.parts?.map((part: any, index: number) => `
      <div>
        <span>${index + 1}</span>
        <span>${part.label}</span>
        <span>${part.quantity}</span>
        <span>${part.pricePerUnit}</span>
        <span>${part.quantity * part.pricePerUnit}</span>
      </div>
    `).join('');


    const totalPrice = data.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0);
    const totalPriceServices = Number(data.services?.priceInEuroWithoutVAT);
    const totalPriceAllServices = Number(data.services?.priceInEuroWithoutVAT);

    const createdAt = new Date();
    const createdAtString = isNaN(createdAt.getTime()) ? 'Invalid Date' : createdAt.toLocaleString();

    const totalPriceAll = totalPrice + totalPriceServices;
    const totalPriceInvoiceServices = Number(data.offer?.services?.priceInEuroWithoutVAT) + Number(data.offer?.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0));
    const totalPriceInvoiceServicesTwo = Number(data.offer?.services?.priceInEuroWithoutVAT) + Number(data.offer?.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0));
    const idService = Math.floor(Math.random() * 1000000);

    const totalPriceTax = totalPriceInvoiceServices * 0.25;
    const totalPriceTaxTwo = totalPriceInvoiceServices * 0.25;
    const totalPriceInvoice = totalPriceInvoiceServices + totalPriceTax;
    const totalPriceInvoiceTwo = totalPriceInvoiceServices + totalPriceTax;

    templateString = templateString.replace('{{offerId}}', String(data.id))
      .replace('{{customerFullName}}', String(data.customerFullName))
      .replace('{{yachtName}}', String(data.yachtName))
      .replace('{{yachtModel}}', String(data.yachtModel))
      .replace('{{yachtModelOffer}}', String(data.offer?.yachtModel))
      .replace('{{yachtNameOffer}}', String(data.offer?.yachtName))
      .replace('{{countryCode}}', String(data.countryCode))
      .replace('{{serviceName}}', String(data.services?.serviceName))
      .replace('{{serviceDescription}}', String(data.services?.description))
      .replace('{{status}}', String(data.status))
      .replace('{{createdAt}}', createdAtString)
      .replace('{{partsTableRows}}', String(partsTableRows))
      .replace('{{invoiceTableRows}}', String(invoiceTableRows))
      .replace('{{totalPrice}}', String(totalPrice))
      .replace('{{seriveName}}', String(data.services?.serviceName))
      .replace('{{servicePrice}}', String(data.services?.priceInEuroWithoutVAT))
      .replace('{{serviceQuantity}}', String(1))
      .replace('{{totalPriceServices}}', String(totalPriceServices))
      .replace('{{totalPriceAll}}', String(totalPriceAll))
      .replace('{{totalPriceAllServices}}', String(totalPriceAllServices))
      .replace('{{orderId}}', String(data.id))
      .replace('{{offerIdInvoice}}', String(data.offer?.id))
      .replace('{{seriveNameInvoice}}', String(data.offer?.services?.serviceName))
      .replace('{{servicePriceInvoice}}', String(data.offer?.services?.priceInEuroWithoutVAT))
      .replace('{{totalPriceInvoiceServices}}', String(data.offer?.services?.priceInEuroWithoutVAT))
      .replace('{{serviceQuantityInvoice}}', String(1))
      .replace('{{idService}}', String(idService))
      .replace('{{totalPriceInvoice}}', String(totalPriceInvoiceServices))
      .replace('{{totalPriceTax}}', String(totalPriceTax))
      .replace('{{totalPriceInvoiceAll}}', String(totalPriceInvoice))
      .replace('{{totalPriceInvoiceTwo}}', String(totalPriceInvoiceTwo))
      .replace('{{totalPriceInvoiceServicesTwo}}', String(totalPriceInvoiceServicesTwo))
      .replace('{{totalPriceTaxTwo}}', String(totalPriceTaxTwo));


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