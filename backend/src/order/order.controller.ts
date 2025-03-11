import { Controller, Post, Get, Param, Body, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

interface UploadResponse {
  message: string;
  code: number;
  file?: any;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get(':id')
  async getOrderById(@Param('id') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Get('')
  async getAllOrders(@Req() request: Request) {
    return this.orderService.allOrder(request);
  }

  @Post(':id/status')
  async updateOrderStatus(@Param('id') orderId: string, @Body('status') newStatus: string) {
    return this.orderService.updateOrderStatus(orderId, newStatus);
  }

  @Post('delete/:id')
  async deleteOrder(@Param('id') orderId: string) {
    return this.orderService.deleteOrder(orderId);
  }

  @Post(':orderId/upload/:tab')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        let folder = './uploads'; 

        if (isImage) {
          folder = './uploads/image';
        } else if (isVideo) {
          folder = './uploads/video';
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('orderId') orderId: string,
    @Param('tab') tab: string
  ): Promise<UploadResponse> {
    return await this.orderService.uploadFileToOrder(orderId, file, tab) as UploadResponse;
  }

  @Post(':orderId/delete/:tab')
  async deleteFile(
    @Param('orderId') orderId: string,
    @Param('tab') tab: string,
    @Body('fileUrl') fileUrl: string
  ): Promise<{ message: string; code: number }> {
    return this.orderService.deleteFileFromOrder(orderId, fileUrl, tab);
  }

}