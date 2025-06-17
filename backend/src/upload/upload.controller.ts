import { Controller, Post, UploadedFile, UseInterceptors, Param, Get, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { offer } from 'src/offer/entities/offer.entity';
import { unlink } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
  ) {}

  private ensureUploadDirectories() {
    const uploadDirs = ['uploads', 'uploads/video', 'uploads/image', 'uploads/logo'];
    uploadDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

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
        const uploadDirs = ['uploads', 'uploads/video', 'uploads/image', 'uploads/logo'];
        uploadDirs.forEach(dir => {
          const dirPath = path.join(__dirname, '..', '..', dir);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
        });

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        let folder = path.join(__dirname, '..', '..', 'uploads'); 

        if (isImage) {
          folder = path.join(__dirname, '..', '..', 'uploads', 'image');
        } else if (isVideo) {
          folder = path.join(__dirname, '..', '..', 'uploads', 'video');
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

    try {
      const offer = await this.offerRepository.findOne({ where: { id: offerId } });
      if (!offer) {
        return { message: 'Offer не найден.' };
      }

      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      let folder = path.join(__dirname, '..', '..', 'uploads'); 

      if (isImage) {
        folder = path.join(__dirname, '..', '..', 'uploads', 'image');
      } else if (isVideo) {
        folder = path.join(__dirname, '..', '..', 'uploads', 'video');
      }

      let urlPath = '';
      if (isImage) {
        urlPath = `/uploads/image/${file.filename}`;
      } else if (isVideo) {
        urlPath = `/uploads/video/${file.filename}`;
      } else {
        urlPath = `/uploads/${file.filename}`;
      }
      const fileUrl = `${process.env.SERVER_URL}${urlPath}`;

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
    } catch (error) {
      console.error('Error uploading file:', error);
      // Если произошла ошибка, удаляем загруженный файл
      if (file && file.path) {
        try {
          await unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file after failed upload:', unlinkError);
        }
      }
      return { message: 'Ошибка при загрузке файла.', code: 500, error: error.message };
    }
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