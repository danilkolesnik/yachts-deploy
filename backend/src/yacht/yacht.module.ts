import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YachtService } from './yacht.service';
import { YachtController } from './yacht.controller';
import { Yacht } from './entities/yacht.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Yacht])],
  controllers: [YachtController],
  providers: [YachtService],
  exports: [YachtService],
})
export class YachtModule {} 