import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceListController } from './price-list.controller';
import { PricelistService } from './price-list.service';
import { Pricelist } from './entities/pricelist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pricelist])],
  controllers: [PriceListController],
  providers: [PricelistService],
})
export class PriceListModule {}
