import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Put, Res } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Request, Response } from 'express';
import { createPdfBuffer } from '../utils/createPdf';
import { sendEmail } from '../utils/sendEmail';

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.offerService.findAll(req);
  }

  @Get('canceled')
  getCanceledOffers() {
    return this.offerService.getCanceledOffers();
  }

  @Get(':id/export-pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const offer = await this.offerService.getOfferById(id);
      if (offer.code !== 200) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      const pdfBuffer = await createPdfBuffer(offer.data, 'offer-export');
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="offer-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      res.status(500).json({ message: 'Error generating PDF' });
    }
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string, @Body() body: { email: string }) {
    try {
      const offer = await this.offerService.getOfferById(id);
      if (offer.code !== 200) {
        return { code: 404, message: 'Offer not found' };
      }

      const subject = 'Offer PDF';
      const message = '<p>Please find the attached offer PDF.</p>';

      const result = await sendEmail(body.email, offer.data, 'offer-export', subject, message);
      
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      return { code: 500, message: 'Error sending email' };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offerService.getOfferById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOfferDto: CreateOfferDto) {
    return this.offerService.update(id, updateOfferDto);
  }

  @Post('delete/:id')
  remove(@Param('id') id: string) {
    return this.offerService.delete(id);
  }
}