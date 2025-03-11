import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

interface PDFParseResult {
  text: string;
}

export async function parsePdf(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'documents', fileName);
  const dataBuffer = fs.readFileSync(filePath);
  const data: PDFParseResult = await pdfParse(dataBuffer);
  return data.text;
}