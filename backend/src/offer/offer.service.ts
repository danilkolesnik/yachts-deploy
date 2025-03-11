import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { offer } from './entities/offer.entity';
import { CreateOfferhDto } from './dto/create-offer.dto';
import { Request } from 'express';
import generateRandomId from 'src/methods/generateRandomId';
import { users } from 'src/auth/entities/users.entity';
import { OfferHistory } from './entities/offer-history.entity';
import { isEqual } from 'lodash';

import getBearerToken from 'src/methods/getBearerToken';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(OfferHistory)
    private readonly offerHistoryRepository: Repository<OfferHistory>,
  ) {}

  async create(data: CreateOfferhDto) {
    if (!data.customerFullName || !data.yachtName || !data.yachtModel || !data.countryCode || !data.services || !data.parts || !data.status) {
      return {
        code: 400,
        message: 'Not all arguments',
      };
    }

    try {
      const customer = await this.usersRepository.findOne({ where: { fullName: data.customerFullName } });
      if (!customer) {
        return {
          code: 404,
          message: 'Customer not found',
        };
      }

      const generateId = generateRandomId();

      const result = await this.offerRepository.save(
        this.offerRepository.create({
          id: generateId,
          customerFullName: customer.fullName,
          customerId: customer.id,
          yachtName: data.yachtName,
          yachtModel: data.yachtModel,
          comment: data.comment || '',
          countryCode: data.countryCode,
          services: data.services,
          parts: data.parts,
          status: data.status,
          versions: [],
          createdAt: new Date(),
        })
      );

      return {
        code: 201,
        data: result,
      };
    } catch (err) {
      return {
        code: 500,
        message: err,
      };
    }
  }

  async update(id: string, data: Partial<CreateOfferhDto>) {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      const offerCopy = { ...offer, versions: undefined };

      const changedFields = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const oldValue: any = offer[key];
          const newValue: any = data[key];

          if (typeof oldValue === 'object' && typeof newValue === 'object') {
            if (!isEqual(oldValue, newValue)) {
              changedFields[key] = { oldValue, newValue };
            }
          } else if (oldValue !== newValue) {
            changedFields[key] = { oldValue, newValue };
          }
        }
      }

      const updatedOffer = Object.assign(offer, data);
      updatedOffer.versions.push(offerCopy);

      if (Object.keys(changedFields).length > 0) {
        await this.offerHistoryRepository.save(
          this.offerHistoryRepository.create({
            offerId: id,
            userId: data.userId,
            changeDate: new Date(),
            changeDescription: JSON.stringify(changedFields),
          })
        );
      }

      const result = await this.offerRepository.save(updatedOffer);

      return {
        code: 200,
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

  async findAll(req: Request) {
    const token = getBearerToken(req);
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

      let offers;
      if (login.role === 'user') {
        offers = await this.offerRepository.find({
          where: { customerId: login.id },
          order: { createdAt: 'DESC' },
        });
      } else {
        offers = await this.offerRepository.find({
          order: { createdAt: 'DESC' },
        });
      }
  
      return {
        code: 200,
        data: offers,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOfferHistory() {
    try {
      const offerHistory = await this.offerHistoryRepository.find();

      const historyWithUserDetails = await Promise.all(
        offerHistory.map(async (history) => {
          const user = await this.usersRepository.findOne({
            where: { id: history.userId },
          });

          return {
            ...history,
            user: user ? { id: user.id, fullName: user.fullName } : null,
          };
        })
      );

      return {
        code: 200,
        data: historyWithUserDetails,
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
      const offer = await this.offerRepository.findOne({ where: { id } });
      return {
        code: 200,
        data: offer,  
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }
}