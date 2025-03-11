import { Module } from '@nestjs/common';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { offer } from './entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { OfferHistory } from './entities/offer-history.entity';

@Module({
  imports:[
      TypeOrmModule.forFeature([offer,users,OfferHistory]),
  ],
  controllers: [OfferController],
  providers: [OfferService]
})
export class OfferModule {}
