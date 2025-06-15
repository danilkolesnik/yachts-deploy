import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Yacht } from './entities/yacht.entity';
import { CreateYachtDto } from './dto/create-yacht.dto';

@Injectable()
export class YachtService {
  constructor(
    @InjectRepository(Yacht)
    private readonly yachtRepository: Repository<Yacht>,
  ) {}

  async create(createYachtDto: CreateYachtDto) {
    try {
      const yacht = this.yachtRepository.create(createYachtDto);
      const savedYacht = await this.yachtRepository.save(yacht);
      return {
        code: 201,
        data: savedYacht,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }

  async findAll() {
    try {
      const yachts = await this.yachtRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });
      return {
        code: 200,
        data: yachts,
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
      const yacht = await this.yachtRepository.findOne({
        where: { id },
      });
      if (!yacht) {
        return {
          code: 404,
          message: 'Yacht not found',
        };
      }
      return {
        code: 200,
        data: yacht,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }

  async update(id: string, updateYachtDto: CreateYachtDto) {
    try {
      const yacht = await this.yachtRepository.findOne({
        where: { id },
      });
      if (!yacht) {
        return {
          code: 404,
          message: 'Yacht not found',
        };
      }
      Object.assign(yacht, updateYachtDto);
      const updatedYacht = await this.yachtRepository.save(yacht);
      return {
        code: 200,
        data: updatedYacht,
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
      const yacht = await this.yachtRepository.findOne({
        where: { id },
      });
      if (!yacht) {
        return {
          code: 404,
          message: 'Yacht not found',
        };
      }
      await this.yachtRepository.remove(yacht);
      return {
        code: 200,
        message: 'Yacht successfully deleted',
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
      };
    }
  }
} 