import { Controller, Post, UploadedFile, UseInterceptors, Param, Get, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { offer } from 'src/offer/entities/offer.entity';
import { unlink } from 'fs/promises';

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

    const file = await this.fileRepository.findOne({ where: { filename, offerId } });
    if (!file) {
      return { message: 'Файл не найден.', code: 404 };
    }

    await unlink(file.path);

    await this.fileRepository.delete(file.id);

    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (offer) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (isImage) {
        offer.imageUrls = offer.imageUrls.filter(imageUrl => imageUrl !== url);
      } else if (isVideo) {
        offer.videoUrls = offer.videoUrls.filter(videoUrl => videoUrl !== url);
      }

      await this.offerRepository.save(offer);
    }

    return { message: 'Файл успешно удалён.', code: 200 };
  } catch (error) {
    return { message: 'Ошибка при удалении файла.', code: 500, error: error.message };
  }
}

  @Post(':offerId')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        let folder = '/app/uploads'; 

        if (isImage) {
          folder = '/app/uploads/image';
        } else if (isVideo) {
          folder = '/app/uploads/video';
        }

        callback(null, folder);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('offerId') offerId: string) {
    if (!file) {
      return { message: 'Файл не загружен.' };
    }

    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (!offer) {
      return { message: 'Offer не найден.' };
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    let folder = 'uploads'; 

    if (isImage) {
      folder = 'uploads/image';
    } else if (isVideo) {
      folder = 'uploads/video';
    }

    const fileUrl = `${process.env.SERVER_URL}/${folder}/${file.filename}`;

    if (isImage) {
      offer.imageUrls = offer.imageUrls ? [...offer.imageUrls, fileUrl] : [fileUrl];
    } else if (isVideo) {
      offer.videoUrls = offer.videoUrls ? [...offer.videoUrls, fileUrl] : [fileUrl];
    }

    await this.offerRepository.save(offer);

    const newFile = this.fileRepository.create({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      offerId: offerId,
    });

    await this.fileRepository.save(newFile);

    return { message: 'Файл успешно загружен.', code: 200, file: newFile };
  }

  @Get(':id')
  async getFile(@Param('id') id: number) {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      return { message: 'Файл не найден.' };
    }

    const fileUrl = `${process.env.SERVER_URL}/${file.filename}`;

    return {
      id: file.id,
      filename: file.filename,
      url: fileUrl,
      mimetype: file.mimetype,
    };
  }
}