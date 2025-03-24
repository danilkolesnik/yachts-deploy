import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { warehouse } from './entities/warehouse.entity';
import { WarehouseHistory } from './entities/warehouseHistory.entity';
import { CreateWareHourehDto } from './dto/create-wareHoure.dto';
import generateRandomId from 'src/methods/generateRandomId';

@Injectable()
export class WarehouseService {
    constructor(
        @InjectRepository(warehouse)
        private readonly warehouseModule: Repository<warehouse>,
        @InjectRepository(WarehouseHistory)
        private readonly warehouseHistoryRepository: Repository<WarehouseHistory>,
    ){}

    async create(data: CreateWareHourehDto) {
        if (!data.name || !data.quantity || !data.serviceCategory) {
          return {
            code: 400,
            message: 'Not all arguments',
          };
        }
    
        try {

          const checkPart = await this.warehouseModule.findOne({ where: { name: data.name } });

          if (checkPart) {
            return {
              code: 400,
              message: 'Part already exists',
            };
          }
          const generateId = generateRandomId();
    
          const result = await this.warehouseModule.save(
            this.warehouseModule.create({
              id: generateId,
              name: data.name,
              quantity: data.quantity,
              inventory: data.inventory,
              comment: data.comment,
              countryCode: data.countryCode,
              serviceCategory: data.serviceCategory,
              pricePerUnit: data.pricePerUnit,
            })
          );
    
          await this.warehouseHistoryRepository.save(
            this.warehouseHistoryRepository.create({
              warehouseId: generateId,
              action: 'create',
              data: result,
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
            const warehouse = await this.warehouseModule.findOne({ where: { id } });

            if (!warehouse) {
                return {
                    code: 404,
                    message: 'Warehouse not found',
                };
            }

            await this.warehouseModule.delete(id);

            await this.warehouseHistoryRepository.save(
                this.warehouseHistoryRepository.create({
                    warehouseId: id,
                    action: 'delete',
                    data: warehouse,
                })
            );

            return {
                code: 200,
                message: 'Warehouse deleted successfully',
            };
        } catch (err) {
            return {
                code: 500,
                message: err || 'Internal server error',
            };
        }
    }

    async update(id: string, data: Partial<CreateWareHourehDto>) {
        if (!id || !Object.keys(data).length) {
            return {
                code: 400,
                message: 'ID and at least one field to update are required',
            };
        }

        try {
            const warehouse = await this.warehouseModule.findOne({ where: { id } });

            if (!warehouse) {
                return {
                    code: 404,
                    message: 'Warehouse not found',
                };
            }

            Object.assign(warehouse, data);

            const updatedWarehouse = await this.warehouseModule.save(warehouse);

            await this.warehouseHistoryRepository.save(
                this.warehouseHistoryRepository.create({
                    warehouseId: id,
                    action: 'update',
                    data: updatedWarehouse,
                })
            );

            return {
                code: 200,
                message: 'Warehouse updated successfully',
                data: updatedWarehouse,
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
            const warehouses = await this.warehouseModule.find();
            return {
                code: 200,
                data: warehouses,
            };
        } catch (err) {
            return {
                code: 500,
                message: err instanceof Error ? err.message : 'Internal server error',
            };
        }
    }

    async getInStock() {
        const warehouses = await this.warehouseModule.find({ where: { quantity: Not('0') } });
        return {
            code: 200,
            data: warehouses,
        };
    }

    async getHistory(warehouseId: string) {
        if (!warehouseId) {
            return {
                code: 400,
                message: 'Warehouse ID is required',
            };
        }

        try {
            const history = await this.warehouseHistoryRepository.find({ where: { warehouseId } });
            return {
                code: 200,
                data: history,
            };
        } catch (err) {
            return {
                code: 500,
                message: err instanceof Error ? err.message : 'Internal server error',
            };
        }
    }

    async getAllHistory() {
        try {
            const history = await this.warehouseHistoryRepository.find();
            return {
                code: 200,
                data: history,
            };
        } catch (err) {
            return {
                code: 500,
                message: err instanceof Error ? err.message : 'Internal server error',
            };
        }
    }
}
