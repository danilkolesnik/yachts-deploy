import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Get,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { offer } from 'src/offer/entities/offer.entity';
import { unlink } from 'fs/promises';
import {
  createMediaUploadOptions,
  detectMediaKind,
  getPublicMediaUrl,
} from 'src/utils/mediaUpload';

@Controller('upload')
export class UploadController {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
  ) {}

  @Post('delete')
  async deleteFile(@Body() body: { url: string; offerId: string }) {
    const { url, offerId } = body;
    try {
      const filename = url.split('/').pop();
      if (!filename) {
        return { message: 'Некорректный URL.', code: 400 };
      }

      const file = await this.fileRepository.findOne({
        where: { filename, offerId },
      });
      if (!file) {
        return { message: 'Файл не найден.', code: 404 };
      }

      await unlink(file.path);

      await this.fileRepository.delete(file.id);

      const offerEntity = await this.offerRepository.findOne({
        where: { id: offerId },
      });
      if (offerEntity) {
        const kind = detectMediaKind(file.mimetype, file.filename);
        if (kind === 'image') {
          offerEntity.imageUrls = offerEntity.imageUrls.filter(
            (imageUrl) => imageUrl !== url,
          );
        } else if (kind === 'video') {
          offerEntity.videoUrls = offerEntity.videoUrls.filter(
            (videoUrl) => videoUrl !== url,
          );
        }

        await this.offerRepository.save(offerEntity);
      }

      return { message: 'Файл успешно удалён.', code: 200 };
    } catch (error) {
      return {
        message: 'Ошибка при удалении файла.',
        code: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post(':offerId')
  @UseInterceptors(FileInterceptor('file', createMediaUploadOptions()))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('offerId') offerId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен.');
    }

    const offerEntity = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offerEntity) {
      throw new BadRequestException('Offer не найден.');
    }

    const kind = detectMediaKind(file.mimetype, file.originalname);
    if (!kind) {
      throw new BadRequestException(
        'Unsupported file type. Upload images or videos (e.g. .mp4).',
      );
    }

    const fileUrl = getPublicMediaUrl(file.filename, kind);

    if (kind === 'image') {
      offerEntity.imageUrls = offerEntity.imageUrls
        ? [...offerEntity.imageUrls, fileUrl]
        : [fileUrl];
    } else {
      offerEntity.videoUrls = offerEntity.videoUrls
        ? [...offerEntity.videoUrls, fileUrl]
        : [fileUrl];
    }

    await this.offerRepository.save(offerEntity);

    const newFile = this.fileRepository.create({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      offerId: offerId,
    });

    await this.fileRepository.save(newFile);

    return {
      message: 'Файл успешно загружен.',
      code: 200,
      file: {
        ...newFile,
        url: fileUrl,
      },
    };
  }

  @Get(':id')
  async getFile(@Param('id') id: number) {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      return { message: 'Файл не найден.' };
    }

    const kind =
      detectMediaKind(file.mimetype, file.filename) === 'video'
        ? 'video'
        : 'image';
    const fileUrl = getPublicMediaUrl(file.filename, kind);

    return {
      id: file.id,
      filename: file.filename,
      url: fileUrl,
      mimetype: file.mimetype,
    };
  }
}
