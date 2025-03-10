import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { offer } from 'src/offer/entities/offer.entity';
@Module({
  imports: [TypeOrmModule.forFeature([File, offer])],
  providers: [UploadService],
  controllers: [UploadController]
})
export class UploadModule {}
