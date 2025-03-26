import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

export async function createPdfBuffer(data: any, type: string): Promise<Buffer> {
  console.log(data);
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

  const totalPrice = data.parts?.reduce((acc: number, part: any) => acc + part?.quantity * part?.pricePerUnit, 0);
  const totalPriceServices = Number(data.services?.priceInEuroWithoutVAT) * Number(data.services?.unitsOfMeasurement);
  const totalPriceAllServices = Number(data.services?.priceInEuroWithoutVAT) * Number(data.services?.unitsOfMeasurement);

  const createdAt = new Date();
  const createdAtString = isNaN(createdAt.getTime()) ? 'Invalid Date' : createdAt.toLocaleString();

  const totalPriceAll = totalPrice + totalPriceServices;

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
    .replace('{{totalPrice}}', String(totalPrice))
    .replace('{{seriveName}}', String(data.services?.serviceName))
    .replace('{{servicePrice}}', String(data.services?.priceInEuroWithoutVAT))
    .replace('{{serviceQuantity}}', String(data.services?.unitsOfMeasurement))
    .replace('{{totalPriceServices}}', String(totalPriceServices))
    .replace('{{totalPriceAll}}', String(totalPriceAll))
    .replace('{{totalPriceAllServices}}', String(totalPriceAllServices))
    .replace('{{orderId}}', String(data.order?.id));


  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(templateString, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });

  await browser.close();

  return Buffer.from(pdfBuffer);
}