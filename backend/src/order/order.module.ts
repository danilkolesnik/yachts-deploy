import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';
import { File } from 'src/upload/entities/file.entity';
import { OrderTimer } from './entities/order-timer.entity';
import { warehouse } from 'src/warehouse/entities/warehouse.entity';
import { WarehouseHistory } from 'src/warehouse/entities/warehouseHistory.entity';
import { OfferHistory } from 'src/offer/entities/offer-history.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([offer,users,order,File,OrderTimer,warehouse,WarehouseHistory,OfferHistory]),
  ],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
