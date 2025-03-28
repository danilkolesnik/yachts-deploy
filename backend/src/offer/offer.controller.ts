import { Controller, Post, Put, Body, Param,Get, Req } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferhDto } from './dto/create-offer.dto';
import { Request } from 'express';
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
  async getAllOffers(@Req() request: Request) {
    return this.offerService.findAll(request);
  }

  @Get('confirm/:id')
  async confirmOffer(@Param('id') id: string) {
    return this.offerService.confirmOffer(id).then((res) => {
      return res.message;
    });
  }

  @Get('cancel/:id')
  async cancelOffer(@Param('id') id: string) {
    return this.offerService.cancelOffer(id).then((res) => {
      return res.message;
    });
  }
}