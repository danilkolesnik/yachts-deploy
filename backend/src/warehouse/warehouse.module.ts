import { Module } from '@nestjs/common';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { warehouse } from './entities/warehouse.entity';
import { Pricelist } from 'src/price-list/entities/pricelist.entity';
import { WarehouseHistory } from './entities/warehouseHistory.entity';
import { users } from 'src/auth/entities/users.entity';
@Module({
  imports:[
    TypeOrmModule.forFeature([
      warehouse,
      WarehouseHistory,
      Pricelist,
      users,
  ]),
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
})
export class WarehouseModule {}
