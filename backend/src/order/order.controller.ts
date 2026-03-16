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
import { Permissions } from 'src/auth/permissions.decorator';
import { PermissionsList } from 'src/constants/permissions';

interface UploadResponse {
  message: string;
  code: number;
  file?: any;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  @Permissions(PermissionsList.ORDERS_CREATE)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Post(':id/workers')
  @Permissions(PermissionsList.ORDERS_ASSIGNMENT_MANAGE)
  async updateOrderWorkers(
    @Param('id') orderId: string,
    @Body('userIds') userIds: string[],
    @Req() request: Request,
  ) {
    return this.orderService.updateOrderWorkers(orderId, userIds, request);
  }

  @Get(':id')
  @Permissions(PermissionsList.ORDERS_READ)
  async getOrderById(@Param('id') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Get('')
  @Permissions(PermissionsList.ORDERS_READ)
  async getAllOrders(@Req() request: Request) {
    return this.orderService.allOrder(request);
  }

  @Post(':id/status')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async updateOrderStatus(@Param('id') orderId: string, @Body('status') newStatus: string) {
    return this.orderService.updateOrderStatus(orderId, newStatus);
  }

  @Post('delete/:id')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async deleteOrder(@Param('id') orderId: string) {
    return this.orderService.deleteOrder(orderId);
  }

  @Post(':id/close')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async closeOffer(@Param('id') id: string, @Req() req: Request) {
    const token = getBearerToken(req);
    const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
    return this.orderService.closeOffer(id, login.id);
  }

  @Get('offers/filter')
  @Permissions(PermissionsList.ORDERS_READ)
  async getOffersWithFilter(@Req() req: Request, @Query('status') status?: string) {
    return this.orderService.getOffersWithFilter(req, status);
  }

  @Post(':orderId/timer/start')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async startTimer(@Param('orderId') orderId: string, @Req() request: Request) {
    return this.orderService.startTimer(orderId, request);
  }
 
  @Post(':orderId/timer/pause')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async pauseTimer(@Param('orderId') orderId: string) {
    return this.orderService.pauseTimer(orderId);
  }

  @Post(':orderId/timer/resume') 
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async resumeTimer(@Param('orderId') orderId: string) {
    return this.orderService.resumeTimer(orderId);
  }

  @Post(':orderId/timer/stop')
  @Permissions(PermissionsList.ORDERS_STATUS_CHANGE)
  async stopTimer(@Param('orderId') orderId: string) {
    return this.orderService.stopTimer(orderId);
  }

  @Get(':orderId/timer')
  @Permissions(PermissionsList.ORDERS_READ)
  async getTimerStatus(@Param('orderId') orderId: string) {
    return this.orderService.getTimerStatus(orderId);
  }

  @Get(':orderId/timer/history')
  @Permissions(PermissionsList.ORDERS_READ)
  async getTimerHistory(@Param('orderId') orderId: string) {
    return this.orderService.getTimerHistory(orderId);
  }

  @Get(':orderId/status-history')
  @Permissions(PermissionsList.ORDERS_READ)
  async getStatusHistory(@Param('orderId') orderId: string) {
    return this.orderService.getOrderStatusHistory(orderId);
  }

  @Get('timers/active')
  @Permissions(PermissionsList.ORDERS_READ)
  async getActiveTimers() {
    return this.orderService.getActiveTimers();
  }

  @Get('timers/all')
  @Permissions(PermissionsList.ORDERS_READ)
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
  @Permissions(PermissionsList.ORDERS_MEDIA_DELETE)
  async deleteFile(
    @Param('orderId') orderId: string,
    @Param('tab') tab: string,
    @Body('fileUrl') fileUrl: string
  ): Promise<{ message: string; code: number }> {
    return this.orderService.deleteFileFromOrder(orderId, fileUrl, tab);
  }

  @Get(':orderId/assignment-history')
  @Permissions(PermissionsList.ORDERS_READ)
  async getAssignmentHistory(@Param('orderId') orderId: string) {
    return this.orderService.getOrderAssignmentHistory(orderId);
  }
}