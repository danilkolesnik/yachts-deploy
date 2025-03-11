import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,In } from 'typeorm';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';
import { File } from 'src/upload/entities/file.entity';
import getBearerToken from 'src/methods/getBearerToken';

import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(order)
    private readonly orderRepository: Repository<order>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async create(data: CreateOrderDto) {

    if (!data.offerId || !data.userId || !data.customerId) {
      return {
        code: 400,
        message: 'Not all arguments',
      };
    }
    try {
      const checkOffer = await this.offerRepository.findOne({
        where: { id: data.offerId },
      });

      if (!checkOffer) {
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      const userIds = data.userId.map((user) => user.value);

      const assignedWorkers = await this.usersRepository.find({
        where: { id: In(userIds) },
      });

      if (assignedWorkers.length !== data.userId.length) {
        return {
          code: 404,
          message: 'One or more users not found',
        };                   
      }

      const newOrder = await this.orderRepository.save(
        this.orderRepository.create({
          offerId: data.offerId,
          assignedWorkers: assignedWorkers,
          customerId: data.customerId,
          status: 'created',
        })
      );

      return {
        code: 201,
        data: newOrder,
      };

    } catch (err) {
      return {
        code: 500,
        message: err,
      };
    }
  }

  async allOrder(req: Request) {

    const token = getBearerToken(req);
  
    try {

      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

      const orders = await this.orderRepository.find({
        relations: ['assignedWorkers'],
        order: { createdAt: 'DESC' },
      });
  
      const ordersWithOffers = await Promise.all(
        orders.map(async (order) => {
          const offer = await this.offerRepository.findOne({
            where: { id: order.offerId },
          });
          return {
            ...order,
            offer,
          };
        })
      ) as any[];
  
      const userRoles = ['mechanic', 'electrician'];

      let filteredOrders = ordersWithOffers;

      if (login.role === 'admin') {
        filteredOrders = ordersWithOffers;
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
      } else if (userRoles.includes(login.role)) {
        filteredOrders = ordersWithOffers.filter(order =>
          order.assignedWorkers.some((worker: any) => String(worker.id) === String(login.id))
        );
      } else if (login.role === 'user') {
        filteredOrders = ordersWithOffers.filter(order =>
          String(order.customerId) === String(login.id)
        );
      } else {
        return {
          code: 403,
          message: 'Access denied',
        };
      }

      filteredOrders = ordersWithOffers;

      return {
        code: 200,
        data: filteredOrders,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOrderById(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['assignedWorkers'],
      });

      if (!order) {
        return {
          code: 404,
          message: 'Order not found',
        };
      }

      const offer = await this.offerRepository.findOne({
        where: { id: order.offerId },
      });

      return {
        code: 200,
        data: { ...order, offer },
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return {
          code: 404,
          message: 'Order not found',
        };
      }

      order.status = newStatus;
      await this.orderRepository.save(order);

      return {
        code: 200,
        message: 'Order status updated successfully',
        data: order,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async deleteOrder(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return {
          code: 404,
          message: 'Order not found',
        };
      }

      await this.orderRepository.remove(order);

      return {
        code: 200,
        message: 'Order deleted successfully',
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async uploadFileToOrder(orderId: string, file: Express.Multer.File, tab: string): Promise<any> {
    if (!file) {
      return { message: 'Файл не загружен.' };
    }

    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      return { message: 'Order не найден.' };
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
    
    console.log(tab);

    if (tab === 'process') {
      if (isImage) {
        order.processImageUrls = order.processImageUrls ? [...order.processImageUrls, fileUrl] : [fileUrl];
      } else if (isVideo) {
        order.processVideoUrls = order.processVideoUrls ? [...order.processVideoUrls, fileUrl] : [fileUrl];
      }
    } else if (tab === 'result') {
      if (isImage) {
        order.resultImageUrls = order.resultImageUrls ? [...order.resultImageUrls, fileUrl] : [fileUrl];
      } else if (isVideo) {
        order.resultVideoUrls = order.resultVideoUrls ? [...order.resultVideoUrls, fileUrl] : [fileUrl];
      }
    } else if (tab === 'tab') {
      if (isImage) {
        order.tabImageUrls = order.tabImageUrls ? [...order.tabImageUrls, fileUrl] : [fileUrl];
      } else if (isVideo) {
        order.tabVideoUrls = order.tabVideoUrls ? [...order.tabVideoUrls, fileUrl] : [fileUrl];
      }
    }

    await this.orderRepository.save(order);

    const newFile = this.fileRepository.create({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      offerId: order.offerId,
    });

    await this.fileRepository.save(newFile);

    return { message: 'Файл успешно загружен.', code: 200, file: newFile };
  }

  async deleteFileFromOrder(orderId: string, fileUrl: string, tab: string): Promise<{ message: string; code: number }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      return { message: 'Order не найден.', code: 404 };
    }

  
    const filename = fileUrl.split('/').pop();
    if (!filename) {
      return { message: 'Некорректный URL.', code: 400 };
    }

    const file = await this.fileRepository.findOne({ where: { filename, offerId: order.offerId } });
    if (!file) {
      return { message: 'Файл не найден.', code: 404 };
    }

    await unlink(file.path);
    await this.fileRepository.delete(file.id);

    if (tab === 'process') {
      order.processImageUrls = order.processImageUrls ? order.processImageUrls.filter(url => url !== fileUrl) : [];
      order.processVideoUrls = order.processVideoUrls ? order.processVideoUrls.filter(url => url !== fileUrl) : [];
    } else if (tab === 'result') {
      order.resultImageUrls = order.resultImageUrls ? order.resultImageUrls.filter(url => url !== fileUrl) : [];
      order.resultVideoUrls = order.resultVideoUrls ? order.resultVideoUrls.filter(url => url !== fileUrl) : [];
    } else if (tab === 'tab') {
      order.tabImageUrls = order.tabImageUrls ? order.tabImageUrls.filter(url => url !== fileUrl) : [];
      order.tabVideoUrls = order.tabVideoUrls ? order.tabVideoUrls.filter(url => url !== fileUrl) : [];
    }

    await this.orderRepository.save(order);

    return { message: 'Файл успешно удалён.', code: 200 };
  }

}