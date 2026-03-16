import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { warehouse } from './entities/warehouse.entity';
import { WarehouseHistory } from './entities/warehouseHistory.entity';
import { CreateWareHourehDto } from './dto/create-wareHoure.dto';
import generateRandomId from 'src/methods/generateRandomId';
import { users } from 'src/auth/entities/users.entity';

@Injectable()
export class WarehouseService {
    constructor(
        @InjectRepository(warehouse)
        private readonly warehouseModule: Repository<warehouse>,
        @InjectRepository(WarehouseHistory)
        private readonly warehouseHistoryRepository: Repository<WarehouseHistory>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    ){}

    async create(data: CreateWareHourehDto, userId?: string) {
        if (!data.name || !data.quantity) {
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
              pricePerUnit: data.pricePerUnit,
              comment: data.comment,
              countryCode: data.countryCode,
              unofficially: data.unofficially,
            })
          );
    
          const quantityNumber = parseInt(String(result.quantity), 10) || 0;

          await this.warehouseHistoryRepository.save(
            this.warehouseHistoryRepository.create({
              warehouseId: generateId,
              action: 'create',
              data: result,
              userId,
              warehouseType: result.unofficially ? 'unofficial' : 'official',
              oldQuantity: 0,
              newQuantity: quantityNumber,
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

    async deleteById(id: string, userId?: string) {
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

            const oldQuantityNumber = parseInt(String(warehouse.quantity), 10) || 0;

            await this.warehouseModule.delete(id);

            await this.warehouseHistoryRepository.save(
                this.warehouseHistoryRepository.create({
                    warehouseId: id,
                    action: 'delete',
                    data: warehouse,
                    userId,
                    warehouseType: warehouse.unofficially ? 'unofficial' : 'official',
                    oldQuantity: oldQuantityNumber,
                    newQuantity: 0,
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

    async update(id: string, data: Partial<CreateWareHourehDto>, userId?: string) {
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

            const oldQuantityNumber = parseInt(String(warehouse.quantity), 10) || 0;

            Object.assign(warehouse, data);

            const updatedWarehouse = await this.warehouseModule.save(warehouse);
            const newQuantityNumber = parseInt(String(updatedWarehouse.quantity), 10) || 0;

            await this.warehouseHistoryRepository.save(
                this.warehouseHistoryRepository.create({
                    warehouseId: id,
                    action: 'update',
                    data: updatedWarehouse,
                    userId,
                    warehouseType: updatedWarehouse.unofficially ? 'unofficial' : 'official',
                    oldQuantity: oldQuantityNumber,
                    newQuantity: newQuantityNumber,
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
            const warehouses = await this.warehouseModule.find({ where: { unofficially: true } });
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

    async findAllUnofficially() {
        try {
            const warehouses = await this.warehouseModule.find({ where: { unofficially: false } });
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

    async getWarehouseById(id: string) {
        const warehouse = await this.warehouseModule.findOne({ where: { id } });
        return {
            code: 200,
            data: warehouse,
        };
    }

    async getInStock() {
        const warehouses = await this.warehouseModule.find({ where: { quantity: Not('0'), unofficially: true } });
        return {
            code: 200,
            data: warehouses,
        };
    }

    async getInStockUnofficially() {
        const warehouses = await this.warehouseModule.find({ where: { quantity: Not('0'), unofficially: false } });
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
            console.log(history);
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

            const historyWithUser = await Promise.all(
                history.map(async (item) => {
                    if (!item.userId) {
                        return item;
                    }
                    const user = await this.usersRepository.findOne({
                        where: { id: item.userId },
                    });

                    return {
                        ...item,
                        user: user ? { id: user.id, fullName: user.fullName } : null,
                    };
                }),
            );

            return {
                code: 200,
                data: historyWithUser,
            };
        } catch (err) {
            return {
                code: 500,
                message: err instanceof Error ? err.message : 'Internal server error',
            };
        }
    }
}
