import { Controller, Post, Body, Param, Put, Get } from '@nestjs/common';
import { CreatePricelistDto } from './dto/pricelist.dto';
import { PricelistService } from './price-list.service';

@Controller('pricelist')
export class PriceListController {
  constructor(private readonly pricelistService: PricelistService) {}

  @Post('create')
  create(@Body() data: CreatePricelistDto) {
    return this.pricelistService.create(data);
  }

  @Post('delete/:id')
  delete(@Param('id') id: string) {
    return this.pricelistService.deleteById(id);
  }

  @Put(':id')
  async updatePricelist(@Param('id') id: string, @Body() data: Partial<CreatePricelistDto>) {
    return this.pricelistService.update(id, data);
  }

  @Get()
  async getAllPricelists() {
    return this.pricelistService.findAll();
  }
}