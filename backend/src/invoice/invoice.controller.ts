import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { createPdfBuffer } from '../utils/createPdf';
import { invoicePdfFilename } from '../utils/pdfFilenames';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('from-offer/:offerId')
  createFromOffer(@Param('offerId') offerId: string) {
    return this.invoiceService.createFromOffer(offerId);
  }

  @Get('by-offer/:offerId')
  getByOffer(@Param('offerId') offerId: string) {
    return this.invoiceService.getByOfferId(offerId);
  }

  @Get('by-offer/:offerId/export-pdf')
  async exportPdfByOffer(@Param('offerId') offerId: string, @Res() res: Response) {
    try {
      const invoiceResult = await this.invoiceService.getOrCreateFromOffer(offerId);
      if (invoiceResult.code !== 200 && invoiceResult.code !== 201) {
        return res.status(invoiceResult.code === 404 ? 404 : 500).json({
          message: invoiceResult.message,
        });
      }

      const invoice = invoiceResult.data;
      if (!invoice) {
        return res.status(500).json({ message: 'Invoice data missing' });
      }

      const pdfData = await this.invoiceService.enrichInvoiceForPdf(invoice);
      const pdfBuffer = await createPdfBuffer(pdfData, 'invoice');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoicePdfFilename(invoice.offerId || offerId)}"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error exporting invoice PDF:', error);
      res.status(500).json({ message: 'Error generating invoice PDF' });
    }
  }

  @Post('by-offer/:offerId/send-email')
  async sendEmailByOffer(
    @Param('offerId') offerId: string,
    @Body() body: { email?: string; useCustomerEmail?: boolean },
  ) {
    try {
      return await this.invoiceService.sendInvoiceEmailByOffer(offerId, body);
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { code: 500, message: 'Error sending invoice email' };
    }
  }

  @Get(':id/export-pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const invoiceResult = await this.invoiceService.getById(id);
      if (invoiceResult.code !== 200) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const invoice = invoiceResult.data;
      if (!invoice) {
        return res.status(500).json({ message: 'Invoice data missing' });
      }

      const pdfData = await this.invoiceService.enrichInvoiceForPdf(invoice);
      const pdfBuffer = await createPdfBuffer(pdfData, 'invoice');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoicePdfFilename(invoice.offerId || invoice.id)}"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error exporting invoice PDF:', error);
      res.status(500).json({ message: 'Error generating invoice PDF' });
    }
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string, @Body() body: { email: string }) {
    try {
      return await this.invoiceService.sendInvoiceEmail(id, body.email);
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { code: 500, message: 'Error sending invoice email' };
    }
  }
}
