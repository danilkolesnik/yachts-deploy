import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { offer } from 'src/offer/entities/offer.entity';
import { order } from 'src/order/entities/order.entity';
import { users } from 'src/auth/entities/users.entity';
import generateRandomId from 'src/methods/generateRandomId';
import { computeInvoiceTotals } from 'src/utils/invoiceExportPdf';
import { sendEmail } from 'src/utils/sendEmail';
import { resolveOfferEmailRecipient } from 'src/utils/emailRecipient';
import { normalizeDocumentLanguage } from 'src/utils/translations';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(order)
    private readonly orderRepository: Repository<order>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
  ) {}

  private resolveYachtFields(offerData: offer) {
    const firstYacht =
      Array.isArray(offerData.yachts) && offerData.yachts.length > 0
        ? offerData.yachts[0]
        : null;

    return {
      yachtName: String(firstYacht?.name ?? offerData.yachtName ?? ''),
      yachtModel: String(firstYacht?.model ?? offerData.yachtModel ?? ''),
      countryCode: String(firstYacht?.countryCode ?? offerData.countryCode ?? ''),
    };
  }

  /** Invoice number follows the linked offer number (digits only, accounting). */
  private resolveInvoiceNumber(offerId: string): string {
    return String(offerId ?? '').trim();
  }

  async getByOfferId(offerId: string) {
    const invoice = await this.invoiceRepository.findOne({ where: { offerId } });
    if (!invoice) {
      return { code: 404, message: 'Invoice not found for this offer' };
    }
    return { code: 200, data: invoice };
  }

  async getById(id: string) {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      return { code: 404, message: 'Invoice not found' };
    }
    return { code: 200, data: invoice };
  }

  async createFromOffer(offerId: string, orderId?: string) {
    try {
      const existing = await this.invoiceRepository.findOne({ where: { offerId } });
      if (existing) {
        await this.syncLanguageWithOffer(offerId);
        const refreshed = await this.invoiceRepository.findOne({ where: { offerId } });
        return {
          code: 200,
          data: refreshed ?? existing,
          message: 'Invoice already exists',
        };
      }

      const offerData = await this.offerRepository.findOne({ where: { id: offerId } });
      if (!offerData) {
        return { code: 404, message: 'Offer not found' };
      }

      let linkedOrder: order | null = null;
      if (orderId) {
        linkedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
      } else {
        linkedOrder = await this.orderRepository.findOne({ where: { offerId } });
      }

      const parts =
        linkedOrder && Array.isArray(linkedOrder.parts) && linkedOrder.parts.length > 0
          ? linkedOrder.parts
          : Array.isArray(offerData.parts)
            ? offerData.parts
            : [];

      const services =
        linkedOrder &&
        Array.isArray(linkedOrder.services) &&
        linkedOrder.services.length > 0
          ? linkedOrder.services
          : Array.isArray(offerData.services)
            ? offerData.services
            : offerData.services
              ? [offerData.services]
              : [];

      const yacht = this.resolveYachtFields(offerData);
      const totals = computeInvoiceTotals(
        parts,
        services,
        offerData.discountAmount,
        offerData.discountPercent,
      );
      const createdAt = new Date();
      const paymentDueAt = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);

      const invoice = await this.invoiceRepository.save(
        this.invoiceRepository.create({
          id: generateRandomId(),
          offerId: offerData.id,
          orderId: linkedOrder?.id || '',
          invoiceNumber: this.resolveInvoiceNumber(offerData.id),
          customerId: offerData.customerId,
          customerFullName: offerData.customerFullName,
          yachtName: yacht.yachtName,
          yachtModel: yacht.yachtModel,
          countryCode: yacht.countryCode,
          location: offerData.location || '',
          parts,
          services,
          language: offerData.language || 'en',
          discountPercent: Number(offerData.discountPercent) || 0,
          discountAmount: totals.discountAmount,
          subtotalWithoutTax: totals.subtotalAfterDiscount,
          taxAmount: totals.vatAmount,
          totalWithTax: totals.grandTotal,
          createdAt,
          paymentDueAt,
        }),
      );

      return { code: 201, data: invoice, message: 'Invoice created successfully' };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOrCreateFromOffer(offerId: string, orderId?: string) {
    const existing = await this.getByOfferId(offerId);
    if (existing.code === 200) {
      return existing;
    }
    return this.createFromOffer(offerId, orderId);
  }

  async enrichInvoiceForPdf(invoice: Invoice) {
    if (!invoice?.offerId) {
      return {
        ...invoice,
        remark: String((invoice as Invoice & { remark?: string }).remark ?? '').trim() || '—',
        language: normalizeDocumentLanguage(invoice.language),
      };
    }
    const offer = await this.offerRepository.findOne({ where: { id: invoice.offerId } });
    const remark = String(offer?.comment ?? '').trim() || '—';
    const language = normalizeDocumentLanguage(offer?.language || invoice.language);

    if (invoice.language !== language) {
      await this.invoiceRepository.update(invoice.id, { language });
    }

    return {
      ...invoice,
      remark,
      language,
      discountPercent: Number(offer?.discountPercent ?? invoice.discountPercent) || 0,
      discountAmount: Number(offer?.discountAmount ?? invoice.discountAmount) || 0,
    };
  }

  async syncLanguageWithOffer(offerId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { offerId } });
    if (!invoice) {
      return;
    }

    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    const nextLanguage = normalizeDocumentLanguage(offer?.language || invoice.language);
    if (invoice.language === nextLanguage) {
      return;
    }

    await this.invoiceRepository.update(invoice.id, { language: nextLanguage });
  }

  async sendInvoiceEmail(invoiceId: string, email: string) {
    const result = await this.getById(invoiceId);
    if (result.code !== 200) {
      return result;
    }

    const invoice = result.data;
    if (!invoice) {
      return { code: 500, message: 'Invoice data missing' };
    }

    const pdfInvoice = await this.enrichInvoiceForPdf(invoice);

    const subject = 'Proforma Invoice';
    const message = '<p>Please find the attached proforma invoice PDF.</p>';
    return sendEmail(email, pdfInvoice, 'invoice', subject, message);
  }

  async sendInvoiceEmailByOffer(
    offerId: string,
    body: { email?: string; useCustomerEmail?: boolean },
  ) {
    const recipient = await resolveOfferEmailRecipient(
      this.offerRepository,
      this.usersRepository,
      offerId,
      body,
    );
    if (recipient.code !== 200 || !recipient.email) {
      return { code: recipient.code, message: recipient.message || 'Invalid recipient' };
    }

    const invoiceResult = await this.getOrCreateFromOffer(offerId);
    if (invoiceResult.code !== 200 && invoiceResult.code !== 201) {
      return invoiceResult;
    }
    const invoice = invoiceResult.data;
    if (!invoice) {
      return { code: 500, message: 'Invoice data missing' };
    }
    return this.sendInvoiceEmail(invoice.id, recipient.email);
  }
}
