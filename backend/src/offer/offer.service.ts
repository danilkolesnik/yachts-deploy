import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Request } from 'express';
import generateRandomId from 'src/methods/generateRandomId';
import { sendEmail } from 'src/utils/sendEmail';
import { users } from 'src/auth/entities/users.entity';
import { warehouse } from 'src/warehouse/entities/warehouse.entity';
import { OfferHistory } from './entities/offer-history.entity';
import { isEqual } from 'lodash';
import { resolveOfferEmailRecipient } from 'src/utils/emailRecipient';

import getBearerToken from 'src/methods/getBearerToken';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

export type OfferVersionEntry = {
  versionNumber: number;
  savedAt: string;
  savedBy: string | null;
  snapshot: Record<string, unknown>;
};

const OFFER_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  services: 'Services',
  parts: 'Parts',
  yachts: 'Yachts',
  location: 'Location',
  comment: 'Comment',
  customerFullName: 'Customer',
  language: 'Language',
  yachtName: 'Yacht name',
  yachtModel: 'Yacht model',
  countryCode: 'Country code',
  imageUrls: 'Images',
  videoUrls: 'Videos',
};

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(warehouse)
    private readonly warehouseRepository: Repository<warehouse>,
    @InjectRepository(OfferHistory)
    private readonly offerHistoryRepository: Repository<OfferHistory>,
  ) {}

  private async enrichOfferWithCustomerEmail<T extends offer | null>(offerData: T) {
    if (!offerData) return offerData;
    if (!offerData.customerId) {
      return { ...offerData, customerEmail: '' };
    }
    const customer = await this.usersRepository.findOne({
      where: { id: offerData.customerId },
    });
    return {
      ...offerData,
      customerEmail: customer?.email?.trim() || '',
    };
  }

  private tryGetUserIdFromRequest(req?: Request): string | undefined {
    if (!req) return undefined;
    const token = getBearerToken(req);
    if (!token) return undefined;
    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      return payload?.id != null ? String(payload.id) : undefined;
    } catch {
      return undefined;
    }
  }

  private deepCloneOfferRow(row: offer): Record<string, unknown> {
    const plain = JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
    delete plain.versions;
    return plain;
  }

  /** Normalize legacy rows (full offer object) and new `{ versionNumber, savedAt, savedBy, snapshot }`. */
  private normalizeVersionEntries(raw: unknown[]): OfferVersionEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((entry, index) => {
      if (
        entry &&
        typeof entry === 'object' &&
        'snapshot' in entry &&
        (entry as OfferVersionEntry).snapshot
      ) {
        const v = entry as OfferVersionEntry;
        return {
          versionNumber: Number(v.versionNumber) || index + 1,
          savedAt: v.savedAt || '',
          savedBy: v.savedBy ?? null,
          snapshot: v.snapshot,
        };
      }
      const legacy = JSON.parse(JSON.stringify(entry)) as Record<string, unknown>;
      delete legacy.versions;
      return {
        versionNumber: index + 1,
        savedAt:
          legacy.createdAt != null
            ? new Date(String(legacy.createdAt)).toISOString()
            : '',
        savedBy: null,
        snapshot: legacy,
      };
    });
  }

  private offerFieldLabel(field: string): string {
    return OFFER_FIELD_LABELS[field] || field;
  }

  private formatChangeValue(value: unknown, field: string): string {
    if (value == null) return '—';
    if (field === 'services' || field === 'parts' || field === 'yachts') {
      if (!Array.isArray(value)) return String(value);
      if (value.length === 0) return '0 items';
      const names = value.slice(0, 3).map((item) => {
        const row = item as Record<string, unknown>;
        return String(
          row.serviceName ||
            row.label ||
            row.partName ||
            row.name ||
            'item',
        );
      });
      const more = value.length > 3 ? ` +${value.length - 3} more` : '';
      return `${value.length} item(s): ${names.join(', ')}${more}`;
    }
    if (typeof value === 'string') {
      return value.length > 100 ? `${value.slice(0, 100)}…` : value;
    }
    if (typeof value === 'object') {
      const s = JSON.stringify(value);
      return s.length > 120 ? `${s.slice(0, 120)}…` : s;
    }
    return String(value);
  }

  private summarizeOfferChange(
    field: string,
    oldValue: unknown,
    newValue: unknown,
  ): string {
    const label = this.offerFieldLabel(field);
    return `${label}: ${this.formatChangeValue(oldValue, field)} → ${this.formatChangeValue(newValue, field)}`;
  }

  private parseHistoryChanges(parsed: Record<string, unknown>): Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }> {
    if (Array.isArray(parsed.changes)) {
      return (parsed.changes as Array<Record<string, unknown>>).map((c) => ({
        field: String(c.field || 'unknown'),
        oldValue: c.oldValue,
        newValue: c.newValue,
      }));
    }

    const rows: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
    for (const [key, val] of Object.entries(parsed)) {
      if (key.startsWith('_') || key === 'trigger' || key === 'orderId' || key === 'closedBy' || key === 'closedAt') {
        continue;
      }
      if (val && typeof val === 'object' && 'oldValue' in val && 'newValue' in val) {
        const change = val as { oldValue: unknown; newValue: unknown };
        rows.push({ field: key, oldValue: change.oldValue, newValue: change.newValue });
        continue;
      }
      rows.push({ field: key, oldValue: null, newValue: val });
    }
    return rows;
  }

  private mapHistoryRowToChronology(
    h: OfferHistory,
    usersById: Map<string, users>,
  ) {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(h.changeDescription || '{}');
    } catch {
      parsed = { raw: h.changeDescription };
    }

    const versionNumber =
      typeof parsed._versionNumber === 'number' ? parsed._versionNumber : null;
    const rawChanges = this.parseHistoryChanges(parsed);
    const changes = rawChanges.map((c) => ({
      field: c.field,
      fieldLabel: this.offerFieldLabel(c.field),
      oldValue: c.oldValue,
      newValue: c.newValue,
      summary: this.summarizeOfferChange(c.field, c.oldValue, c.newValue),
    }));

    const dt = h.changeDate ? new Date(h.changeDate) : null;
    const authorUser = h.userId ? usersById.get(h.userId) : undefined;

    return {
      id: h.id,
      offerId: h.offerId,
      versionNumber,
      changedAt: dt ? dt.toISOString() : null,
      changedDate: dt ? dt.toISOString().slice(0, 10) : null,
      changedTime: dt ? dt.toISOString().slice(11, 19) : null,
      author: authorUser
        ? { id: authorUser.id, fullName: authorUser.fullName }
        : h.userId && h.userId !== 'unknown'
          ? { id: h.userId, fullName: h.userId }
          : { id: null, fullName: 'Unknown' },
      changes,
      // backward compatibility for older clients
      changeDate: h.changeDate,
      userId: h.userId,
      user: authorUser ? { id: authorUser.id, fullName: authorUser.fullName } : null,
      fieldChanges: Object.fromEntries(
        rawChanges.map((c) => [c.field, { oldValue: c.oldValue, newValue: c.newValue }]),
      ),
    };
  }

  private buildVersionsSummary(
    raw: unknown[],
    usersById?: Map<string, { id: string; fullName: string }>,
  ) {
    return this.normalizeVersionEntries(raw).map((v) => ({
      versionNumber: v.versionNumber,
      savedAt: v.savedAt,
      savedBy: v.savedBy,
      savedByName:
        v.savedBy && usersById?.get(v.savedBy)?.fullName
          ? usersById.get(v.savedBy)!.fullName
          : null,
      status: (v.snapshot?.status as string) || null,
      servicesCount: Array.isArray(v.snapshot?.services)
        ? v.snapshot.services.length
        : 0,
      partsCount: Array.isArray(v.snapshot?.parts) ? v.snapshot.parts.length : 0,
    }));
  }

  private async enrichOffersWithCustomerEmail(offersList: offer[]) {
    const customerIds = [
      ...new Set(offersList.map((o) => o.customerId).filter(Boolean)),
    ];
    const customers =
      customerIds.length > 0
        ? await this.usersRepository.find({ where: { id: In(customerIds) } })
        : [];
    const emailByCustomerId = new Map(
      customers.map((c) => [c.id, c.email?.trim() || '']),
    );
    return offersList.map((o) => ({
      ...o,
      customerEmail: emailByCustomerId.get(o.customerId) || '',
    }));
  }

  async resolveSendEmailRecipient(
    offerId: string,
    body: { email?: string; useCustomerEmail?: boolean },
  ) {
    return resolveOfferEmailRecipient(
      this.offerRepository,
      this.usersRepository,
      offerId,
      body,
    );
  }

  async create(data: CreateOfferDto) {
    // if (!data.customerFullName || (!data.yachts || data.yachts.length === 0) || !data.services || !data.parts || !data.status || !data.location) {
    //   return {
    //     code: 400,
    //     message: 'Not all arguments',
    //   };
    // }

    // Validate services - should be array or object
    if (!Array.isArray(data.services) && (!data.services || typeof data.services !== 'object')) {
      return {
        code: 400,
        message: 'Services must be an array or object',
      };
    }

    console.log(data);

    try {
      const customer = await this.usersRepository.findOne({ where: { fullName: data.customerFullName } });
      if (!customer) {
        return {
          code: 404,
          message: 'Customer not found',
        };
      }

      const generateId = generateRandomId();

      // //@ts-expect-error: value property exists in runtime data
      // const partIds = data.parts.map(part => part.value);

      // const parts = await this.warehouseRepository.find({ where: { id: In(partIds as string[]) } });

      // for (const part of parts) {
      //   //@ts-expect-error: value property exists in runtime data
      //   const partData = data.parts.find(p => p.value === part.id);
      //   if (part && partData) {
      //    //@ts-expect-error: Assuming 'quantity' exists on 'part' for mapping IDs
      //     part.quantity = (parseInt(part.quantity, 10) || 0) - 1; 
      //     await this.warehouseRepository.save(part);
      //   }
      // }

  
      const normalizedServices = Array.isArray(data.services) ? data.services : [data.services];

      // Set yachtName, yachtModel, countryCode from first yacht for backward compatibility
      const firstYacht = data.yachts[0];
      const yachtName = firstYacht?.name || '';
      const yachtModel = firstYacht?.model || '';
      const countryCode = firstYacht?.countryCode || '';

      const result = await this.offerRepository.save(
        this.offerRepository.create({
          id: generateId,
          customerFullName: customer.fullName,
          customerId: customer.id,
          yachtName: yachtName,
          yachtModel: yachtModel,
          location: data.location || '',
          comment: data.comment || '',
          countryCode: countryCode,
          yachts: data.yachts,
          services: normalizedServices,
          parts: data.parts,
          status: data.status,
          language: data.language || 'en',
          versions: [],
          createdAt: new Date(),
        })
      );

      // const subject = 'Offer created';
      // const message = `
      //   <p>Offer created. Please find the attached PDF.</p>
      //   <p>You can confirm your offer by clicking the following link:</p>
      //   <a href="${process.env.SERVER_URL}/offer/confirm/${result.id}">Confirm Offer</a>
      //   <p>You can cancel your offer by clicking the following link:</p>
      //   <a href="${process.env.SERVER_URL}/offer/cancel/${result.id}">Cancel Offer</a>
      // `

      // await sendEmail(customer.email, result, 'offer', subject, message);
     
      return {
        code: 201,
        data: result,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: err,
      };
    }
  }

  async update(id: string, data: Partial<CreateOfferDto>, req?: Request) {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      const changedFields: Record<string, { oldValue: unknown; newValue: unknown }> = {};
      const skipKeys = new Set(['userId', 'customerId', 'yachtId', 'description', 'price']);
      for (const key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key) || skipKeys.has(key)) continue;
        const oldValue: unknown = (offer as Record<string, unknown>)[key];
        const newValue: unknown = (data as Record<string, unknown>)[key];
        if (newValue === undefined) continue;

        if (typeof oldValue === 'object' && typeof newValue === 'object') {
          if (!isEqual(oldValue, newValue)) {
            changedFields[key] = { oldValue, newValue };
          }
        } else if (oldValue !== newValue) {
          changedFields[key] = { oldValue, newValue };
        }
      }

      if (Object.keys(changedFields).length === 0) {
        const enriched = await this.enrichOfferWithCustomerEmail(offer);
        return {
          code: 200,
          message: 'No changes detected',
          data: this.stripVersionsFromOfferResponse(enriched),
        };
      }

      const yachtData = data.yachts
        ? {
            yachtName: data.yachts[0]?.name || '',
            yachtModel: data.yachts[0]?.model || '',
            countryCode: data.yachts[0]?.countryCode || '',
            yachts: data.yachts,
          }
        : {};

      const existingVersions = this.normalizeVersionEntries(offer.versions || []);
      const savedBy =
        (data.userId && String(data.userId)) ||
        this.tryGetUserIdFromRequest(req) ||
        null;
      const versionNumber = existingVersions.length + 1;
      const versionEntry: OfferVersionEntry = {
        versionNumber,
        savedAt: new Date().toISOString(),
        savedBy,
        snapshot: this.deepCloneOfferRow(offer),
      };

      const updatedOffer = Object.assign(offer, {
        ...data,
        ...yachtData,
        services: Array.isArray(data.services)
          ? data.services
          : data.services
            ? [data.services]
            : offer.services,
      });
      updatedOffer.versions = [...existingVersions, versionEntry] as unknown as any[];

      const historyUserId = savedBy || data.userId || 'unknown';
      await this.offerHistoryRepository.save(
        this.offerHistoryRepository.create({
          offerId: id,
          userId: String(historyUserId),
          changeDate: new Date(),
          changeDescription: JSON.stringify({
            _versionNumber: versionNumber,
            changes: Object.entries(changedFields).map(([field, v]) => ({
              field,
              oldValue: v.oldValue,
              newValue: v.newValue,
            })),
          }),
        }),
      );

      const result = await this.offerRepository.save(updatedOffer);

      return {
        code: 200,
        data: this.stripVersionsFromOfferResponse(
          await this.enrichOfferWithCustomerEmail(result),
        ),
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: err,
      };
    }
  }

  private stripVersionsFromOfferResponse<T extends offer | null>(offerData: T) {
    if (!offerData) return offerData;
    const normalized = this.normalizeVersionEntries(offerData.versions || []);
    const { versions: _versions, ...rest } = offerData as offer & { versions?: unknown[] };
    return {
      ...rest,
      versionCount: normalized.length,
      currentVersionNumber: normalized.length + 1,
    };
  }

  async getOfferVersions(offerId: string) {
    try {
      const row = await this.offerRepository.findOne({ where: { id: offerId } });
      if (!row) {
        return { code: 404, message: 'Offer not found' };
      }
      const normalized = this.normalizeVersionEntries(row.versions || []);
      const userIds = normalized.map((v) => v.savedBy).filter(Boolean) as string[];
      const users =
        userIds.length > 0
          ? await this.usersRepository.find({ where: { id: In(userIds) } })
          : [];
      const usersById = new Map(users.map((u) => [u.id, u]));
      return {
        code: 200,
        data: {
          offerId,
          currentVersionNumber: normalized.length + 1,
          versions: this.buildVersionsSummary(row.versions || [], usersById),
        },
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOfferVersionSnapshot(offerId: string, versionNumber: number) {
    try {
      const row = await this.offerRepository.findOne({ where: { id: offerId } });
      if (!row) {
        return { code: 404, message: 'Offer not found' };
      }
      const normalized = this.normalizeVersionEntries(row.versions || []);
      const entry = normalized.find((v) => v.versionNumber === versionNumber);
      if (!entry) {
        return { code: 404, message: 'Version not found' };
      }
      let savedByUser: { id: string; fullName: string } | null = null;
      if (entry.savedBy) {
        const u = await this.usersRepository.findOne({ where: { id: entry.savedBy } });
        if (u) savedByUser = { id: u.id, fullName: u.fullName };
      }
      return {
        code: 200,
        data: {
          offerId,
          versionNumber: entry.versionNumber,
          savedAt: entry.savedAt,
          savedBy: entry.savedBy,
          savedByUser,
          snapshot: entry.snapshot,
        },
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOfferHistoryByOfferId(offerId: string) {
    try {
      const row = await this.offerRepository.findOne({ where: { id: offerId } });
      if (!row) {
        return { code: 404, message: 'Offer not found' };
      }
      const history = await this.offerHistoryRepository.find({
        where: { offerId },
        order: { changeDate: 'ASC' },
      });
      const userIds = [...new Set(history.map((h) => h.userId).filter(Boolean))];
      const users =
        userIds.length > 0
          ? await this.usersRepository.find({ where: { id: In(userIds) } })
          : [];
      const usersById = new Map(users.map((u) => [u.id, u]));
      const chronology = history.map((h) =>
        this.mapHistoryRowToChronology(h, usersById),
      );
      return { code: 200, data: chronology };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async findAll(req: Request) {
    const token = getBearerToken(req);
    try {
      if (!token) {
        return {
          code: 401,
          message: 'Authorization token missing',
        };
      }
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

      let offers;
      
      if (login.role === 'user' || login.role === 'client') {
        offers = await this.offerRepository.find({
          where: { 
            customerId: login.id,
            status: 'created'
          },
          order: { 
            createdAt: 'DESC'
          },
        });
      } else {
        offers = await this.offerRepository.find({
          order: { 
            createdAt: 'DESC'
          },
        });
      }
  
      const enriched = await this.enrichOffersWithCustomerEmail(offers);
      return {
        code: 200,
        data: enriched,
      };
    } catch (err) {
      return {
        code: 401,
        message: err instanceof Error ? err.message : 'Unauthorized',
      };
    }
  }

  async getCanceledOffers() {
    try {
      const offers = await this.offerRepository.find({ 
        where: { 
            status: In(['canceled', 'confirmed', 'finished'])
        },
        order: { createdAt: 'DESC' },
      });
      const enriched = await this.enrichOffersWithCustomerEmail(offers);
      return {
        code: 200,
        data: enriched,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message:'Internal server error',
      };
    }
  }

  async getOfferHistory() {
    try {
      const offerHistory = await this.offerHistoryRepository.find({
        order: { changeDate: 'DESC' },
      });
      const userIds = [...new Set(offerHistory.map((h) => h.userId).filter(Boolean))];
      const offerIds = [...new Set(offerHistory.map((h) => h.offerId).filter(Boolean))];
      const usersList =
        userIds.length > 0
          ? await this.usersRepository.find({ where: { id: In(userIds) } })
          : [];
      const offersList =
        offerIds.length > 0
          ? await this.offerRepository.find({ where: { id: In(offerIds) } })
          : [];
      const usersById = new Map(usersList.map((u) => [u.id, u]));
      const offersById = new Map(offersList.map((o) => [o.id, o]));
      return {
        code: 200,
        data: offerHistory.map((h) => {
          const offer = offersById.get(h.offerId);
          return {
            ...this.mapHistoryRowToChronology(h, usersById),
            offerCustomer: offer?.customerFullName || '',
            offerYachtName: offer?.yachtName || '',
          };
        }),
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }
  
  async delete(id: string) {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      await this.offerRepository.delete(id);

      return {
        code: 200,
        message: 'Offer deleted successfully',
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOfferById(id: string) {
    try {
      const offerRow = await this.offerRepository.findOne({ where: { id } });
      if (!offerRow) {
        return { code: 404, message: 'Offer not found' };
      }
      const normalized = this.normalizeVersionEntries(offerRow.versions || []);
      const userIds = normalized.map((v) => v.savedBy).filter(Boolean) as string[];
      const users =
        userIds.length > 0
          ? await this.usersRepository.find({ where: { id: In(userIds) } })
          : [];
      const usersById = new Map(users.map((u) => [u.id, u]));
      const enriched = await this.enrichOfferWithCustomerEmail(offerRow);
      return {
        code: 200,
        data: {
          ...this.stripVersionsFromOfferResponse(enriched),
          versionsSummary: this.buildVersionsSummary(offerRow.versions || [], usersById),
        },
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async confirmOffer(id: string) {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      await this.offerRepository.update(id, { status: 'confirmed' });

      return {
        code: 200,
        message: 'Offer confirmed successfully',
      };
      
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async cancelOffer(id: string) {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      } 

      await this.offerRepository.update(id, { status: 'canceled' });

      return {
        code: 200,
        message: 'Offer cancelled successfully',
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }
}