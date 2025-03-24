import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';
import { File } from 'src/upload/entities/file.entity';
import { OrderTimer } from './entities/order-timer.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([offer,users,order,File,OrderTimer]),
  ],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
