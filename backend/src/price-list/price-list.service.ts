import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricelist } from './entities/pricelist.entity';
import { CreatePricelistDto } from './dto/pricelist.dto';

@Injectable()
export class PricelistService {
  constructor(
    @InjectRepository(Pricelist)
    private readonly pricelistRepository: Repository<Pricelist>,
  ) {}

  async create(data: CreatePricelistDto) {
    if (!data.serviceName || data.priceInEuroWithoutVAT === undefined) {
      return {
        code: 400,
        message: 'Not all arguments',
      };
    }

    try {
      const result = await this.pricelistRepository.save(
        this.pricelistRepository.create({
          serviceName: data.serviceName,
          priceInEuroWithoutVAT: data.priceInEuroWithoutVAT,
          unitsOfMeasurement: data.unitsOfMeasurement,
          description: data.description,
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

  async deleteById(id: string) {
    if (!id) {
      return {
        code: 400,
        message: 'ID is required',
      };
    }

    try {
      const pricelist = await this.pricelistRepository.findOne({ where: { id } });

      if (!pricelist) {
        return {
          code: 404,
          message: 'Pricelist not found',
        };
      }

      await this.pricelistRepository.delete(id);

      return {
        code: 200,
        message: 'Pricelist deleted successfully',
      };
    } catch (err) {
      return {
        code: 500,
        message: err || 'Internal server error',
      };
    }
  }

  async update(id: string, data: Partial<CreatePricelistDto>) {
    if (!id || !Object.keys(data).length) {
      return {
        code: 400,
        message: 'ID and at least one field to update are required',
      };
    }

    try {
      const pricelist = await this.pricelistRepository.findOne({ where: { id } });

      if (!pricelist) {
        return {
          code: 404,
          message: 'Pricelist not found',
        };
      }

      Object.assign(pricelist, data);

      const updatedPricelist = await this.pricelistRepository.save(pricelist);

      return {
        code: 200,
        message: 'Pricelist updated successfully',
        data: updatedPricelist,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async findAll() {
    try {
      const pricelists = await this.pricelistRepository.find();
      return {
        code: 200,
        data: pricelists,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async findById(id: string) {
    const pricelist = await this.pricelistRepository.findOne({ where: { id } });
    return {
      code: 200,
      data: pricelist,
    };
  }
}