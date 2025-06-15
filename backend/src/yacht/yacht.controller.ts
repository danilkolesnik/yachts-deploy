import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { YachtService } from './yacht.service';
import { CreateYachtDto } from './dto/create-yacht.dto';

@Controller('yachts')
export class YachtController {
  constructor(private readonly yachtService: YachtService) {}

  @Post()
  create(@Body() createYachtDto: CreateYachtDto) {
    return this.yachtService.create(createYachtDto);
  }

  @Get()
  findAll() {
    return this.yachtService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.yachtService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateYachtDto: CreateYachtDto) {
    return this.yachtService.update(id, updateYachtDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.yachtService.remove(id);
  }
} 