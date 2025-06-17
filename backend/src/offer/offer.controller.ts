import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Request } from 'express';

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.offerService.findAll(req);
  }

  @Get('canceled')
  getCanceledOffers(@Req() req: Request) {
    return this.offerService.getCanceledOffers(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offerService.getOfferById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOfferDto: CreateOfferDto) {
    return this.offerService.update(id, updateOfferDto);
  }

  @Post('delete/:id')
  remove(@Param('id') id: string) {
    return this.offerService.delete(id);
  }
}