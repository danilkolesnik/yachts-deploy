import { Controller, Post, Get, Param, Body, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import * as jwt from 'jsonwebtoken';
import getBearerToken from 'src/methods/getBearerToken';
import { JwtPayload } from 'jsonwebtoken';

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

  @Post(':id/close')
  async closeOffer(@Param('id') id: string, @Req() req: Request) {
    const token = getBearerToken(req);
    const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
    return this.orderService.closeOffer(id, login.id);
  }

  @Get('offers/filter')
  async getOffersWithFilter(@Req() req: Request, @Query('status') status?: string) {
    return this.orderService.getOffersWithFilter(req, status);
  }

  @Post(':orderId/timer/start')
  async startTimer(@Param('orderId') orderId: string, @Req() request: Request) {
    return this.orderService.startTimer(orderId, request);
  }
 
  @Post(':orderId/timer/pause')
  async pauseTimer(@Param('orderId') orderId: string) {
    return this.orderService.pauseTimer(orderId);
  }

  @Post(':orderId/timer/resume') 
  async resumeTimer(@Param('orderId') orderId: string) {
    return this.orderService.resumeTimer(orderId);
  }

  @Post(':orderId/timer/stop')
  async stopTimer(@Param('orderId') orderId: string) {
    return this.orderService.stopTimer(orderId);
  }

  @Get(':orderId/timer')
  async getTimerStatus(@Param('orderId') orderId: string) {
    return this.orderService.getTimerStatus(orderId);
  }

  @Get(':orderId/timer/history')
  async getTimerHistory(@Param('orderId') orderId: string) {
    return this.orderService.getTimerHistory(orderId);
  }

  @Get('timers/active')
  async getActiveTimers() {
    return this.orderService.getActiveTimers();
  }

  @Get('timers/all')
  async getAllTimers() {
    return this.orderService.getAllTimers();
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