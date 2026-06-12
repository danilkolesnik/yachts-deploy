import { Module } from '@nestjs/common';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { offer } from './entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { OfferHistory } from './entities/offer-history.entity';
import { warehouse } from 'src/warehouse/entities/warehouse.entity';
import { order } from 'src/order/entities/order.entity';

@Module({
  imports:[
      TypeOrmModule.forFeature([
        offer,
        users,
        OfferHistory,
        warehouse,
        order,
      ]),
  ],
  controllers: [OfferController],
  providers: [OfferService]
})
export class OfferModule {}
