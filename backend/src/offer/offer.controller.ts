import { Controller, Post, Put, Body, Param,Get } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferhDto } from './dto/create-offer.dto';

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post('create')
  async createOffer(@Body() data: CreateOfferhDto) {
    return this.offerService.create(data);
  }

  @Put('update/:id')
  async updateOffer(@Param('id') id: string, @Body() data: Partial<CreateOfferhDto>) {
    return this.offerService.update(id, data);
  }

  @Post('delete/:id')
  async deleteOffer(@Param('id') id: string) {
    return this.offerService.delete(id);
  }

  @Get('history')
  async getOfferHistory() {
    return this.offerService.getOfferHistory();
  }

  @Get(':id')
  async getOfferById(@Param('id') id: string) {
    return this.offerService.getOfferById(id);
  }

  @Get()
  async getAllOffers() {
    return this.offerService.findAll();
  }
}