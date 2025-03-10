import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([offer,users,order]),
  ],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
