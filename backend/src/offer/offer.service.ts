import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import getBearerToken from 'src/methods/getBearerToken';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    try {
      console.log(createOfferDto);
      const newOffer = this.offerRepository.create(createOfferDto);
      const savedOffer = await this.offerRepository.save(newOffer);
      return {
        code: 201,
        data: savedOffer,
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        message: error.message,
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
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id },
      });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      return {
        code: 200,
        data: offer,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }

  async update(id: string, updateOfferDto: CreateOfferDto) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id },
      });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      Object.assign(offer, updateOfferDto);
      const updatedOffer = await this.offerRepository.save(offer);

      return {
        code: 200,
        data: updatedOffer,
      };
    } catch (error) {   
      return {
        code: 500,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id },
      });

      if (!offer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      await this.offerRepository.remove(offer);

      return {
        code: 200,
        message: 'Offer successfully deleted',
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }
}