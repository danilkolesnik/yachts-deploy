import * as fs from 'fs';
import * as path from 'path';
import ejs from 'ejs';
import PDFDocument from 'pdfkit';

export async function createPdfFromTemplate(data: any): Promise<void> {
  const outputPath = path.join(process.cwd(), 'documents', 'order.pdf');

  const templateString = `
    <h1><%= title %></h1>
    <p><%= content %></p>
  `;

  const htmlContent = ejs.render(templateString, data);

  // Create a PDF document
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Add the rendered content to the PDF
  doc.text(htmlContent, {
    align: 'left'
  });

  // Finalize the PDF and end the stream
  doc.end();

  // Return a promise that resolves when the file is fully written
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

export async function createTestPdf(): Promise<void> {
  const outputPath = path.join(process.cwd(), 'documents', 'order.pdf');

  const templateString = `
    <h1>Test PDF</h1>
    <p>This is a test PDF document.</p>
  `;

  const htmlContent = ejs.render(templateString);

  // Create a PDF document
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Add the rendered content to the PDF
  doc.text(htmlContent, {
    align: 'left'
  });

  // Finalize the PDF and end the stream
  doc.end();

  // Return a promise that resolves when the file is fully written
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}