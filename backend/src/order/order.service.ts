import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,In } from 'typeorm';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';
import { File } from 'src/upload/entities/file.entity';
import { OrderTimer } from './entities/order-timer.entity';
import { warehouse } from 'src/warehouse/entities/warehouse.entity';
import { WarehouseHistory } from 'src/warehouse/entities/warehouseHistory.entity';
import { sendEmail } from 'src/utils/sendEmail';
import { OfferHistory } from 'src/offer/entities/offer-history.entity';
import getBearerToken from 'src/methods/getBearerToken';

import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises';
import * as fs from 'fs';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(order)
    private readonly orderRepository: Repository<order>,
    @InjectRepository(warehouse)
    private readonly warehouseRepository: Repository<warehouse>,
    @InjectRepository(WarehouseHistory)
    private readonly warehouseHistoryRepository: Repository<WarehouseHistory>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(OrderTimer)
    private readonly orderTimerRepository: Repository<OrderTimer>,
    @InjectRepository(OfferHistory)
    private readonly offerHistoryRepository: Repository<OfferHistory>,
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

        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        return {
          code: 200,
          data: ordersWithOffers,
        };
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

      const offer = await this.offerRepository.findOne({
        where: { id: order.offerId },
      });

      if(!offer){
        return {
          code: 404,
          message: 'Offer not found',
        };
      }

      order.status = newStatus;
      await this.orderRepository.save(order);

      const customer = await this.usersRepository.findOne({
        where: { id: order.customerId },
      });

      if (!customer) {
        return {
          code: 404,
          message: 'Customer not found',
        };
      }

      const orderData = {
        ...order,
        offer: {...offer}
      };

      if(newStatus === 'completed'){
        const subject = 'Invoice created';
        const message = '<p>Invoice created. Please find the attached PDF.</p>';

        offer.status = 'confirmed';
        await this.offerRepository.save(offer);

        const offerHistory = this.offerHistoryRepository.create({
          offerId: offer.id,
          userId: offer.customerId,
          changeDate: new Date(),
          changeDescription: JSON.stringify({ status: 'confirmed' }),
        });
        await this.offerHistoryRepository.save(offerHistory);
       
        //@ts-expect-error: value property exists in runtime data
        const partIds = offer.parts.map(part => part.value);
        console.log('Part IDs to update:', partIds);

        const parts = await this.warehouseRepository.find({ where: { id: In(partIds) } });
        console.log('Found parts in warehouse:', parts);

        for (const part of offer.parts) {
          //@ts-expect-error: value property exists in runtime data
          const warehouse = await this.warehouseRepository.findOne({ where: { id: String(part.value) } });

          const warehouseHistory = this.warehouseHistoryRepository.create({
            //@ts-expect-error: value property exists in runtime data
            warehouseId: String(part.value),
            action: 'write-off',
            data: {
              //@ts-expect-error: label property exists in runtime data
              name: part.label,
              quantity: part.quantity,
              //@ts-expect-error: pricePerUnit property exists in runtime data
              pricePerUnit: warehouse.pricePerUnit,
            },
          });
          await this.warehouseHistoryRepository.save(warehouseHistory);
          console.log('Created warehouse history:', warehouseHistory);
        }

        for (const part of parts) {
          //@ts-expect-error: value property exists in runtime data
          const partData = offer.parts.find(p => p.value === part.id);
          console.log('Current part data:', part);
          console.log('Matching offer part:', partData);
          
          if (part && partData) {
            const oldQuantity = part.quantity;
            part.quantity = ((parseInt(part.quantity, 10) || 0) - 1).toString();
            await this.warehouseRepository.save(part);
            console.log(`Updated part quantity: ${oldQuantity} -> ${part.quantity}`);
          }
        }

        await sendEmail(customer.email, orderData, 'Invoice', subject,message);
      }

      return {
        code: 200,
        message: 'Order status updated successfully',
        data: order,
      };
    } catch (err) {
      console.log(err);
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

  private normalizeUrl(url: string): string {
    // Удаляем двойные слеши, кроме http(s)://
    return url.replace(/([^:]\/)\/+/g, "$1");
  }

  private getPublicUrl(filename: string, isImage: boolean): string {
    const folder = isImage ? 'image' : 'video';
    return this.normalizeUrl(`${process.env.SERVER_URL}/uploads/${folder}/${filename}`);
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
    let folder = '/app/uploads'; 

    if (isImage) {
      folder = '/app/uploads/image';
    } else if (isVideo) {
      folder = '/app/uploads/video';
    }

    // Используем новый метод для получения публичного URL
    const fileUrl = this.getPublicUrl(file.filename, isImage);
    
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

    return { 
      message: 'Файл успешно загружен.', 
      code: 200, 
      file: {
        ...newFile,
        url: fileUrl
      }
    };
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

  async startTimer(orderId: string, req: Request): Promise<OrderTimer> {

    const token = getBearerToken(req);

    const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

    const timer = this.orderTimerRepository.create({
      orderId,
      userId: login.id,
      startTime: new Date(),
      status: 'In Progress',
      isRunning: true,
      isPaused: false
    });

    return this.orderTimerRepository.save(timer);
  }

  async pauseTimer(orderId: string): Promise<OrderTimer> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId, isRunning: true, isPaused: false }
    });
  
    if (!timer) {
      throw new Error('No active timer found for this order');
    }
  
    const now = new Date();
    timer.isPaused = true;
    timer.status = 'Paused';
    timer.pauseTime = now;
    
    // Вычисляем общее время работы до паузы
    let totalDuration = now.getTime() - timer.startTime.getTime();
    
    // Вычитаем накопленное время пауз
    if (timer.totalPausedTime) {
      totalDuration -= timer.totalPausedTime;
    }
    
    timer.totalDuration = Math.max(0, totalDuration);
  
    return this.orderTimerRepository.save(timer);
  }

  async resumeTimer(orderId: string): Promise<OrderTimer> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId, isRunning: true, isPaused: true }
    });

    if (!timer) {
      throw new Error('No paused timer found for this order');
    }

    if (timer.pauseTime) {
      const pauseDuration = new Date().getTime() - timer.pauseTime.getTime();
      timer.totalPausedTime = (timer.totalPausedTime || 0) + pauseDuration;
    }

    timer.isPaused = false;
    timer.status = 'In Progress';
    timer.pauseTime = new Date();

    return this.orderTimerRepository.save(timer);
  }

  async stopTimer(orderId: string): Promise<OrderTimer> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId, isRunning: true }
    });

    if (!timer) {
      throw new Error('No active timer found for this order');
    }

    const now = new Date();
    timer.endTime = now;
    timer.isRunning = false;
    timer.isPaused = false;
    timer.status = 'Completed';
    timer.totalDuration = now.getTime() - timer.startTime.getTime();

    await this.orderTimerRepository.save(timer);

    return await this.orderTimerRepository.save(
      this.orderTimerRepository.create({
        orderId: orderId,
        isRunning: false,
        isPaused: false,
        status: 'Ready',
        startTime: new Date(),
        totalPausedTime: 0
      })
    );
  }

  async getTimerStatus(orderId: string): Promise<{
    status: string;
    startTime: Date;
    currentDuration?: number;
    endTime?: Date;
    totalDuration?: number;
    isPaused: boolean;
  } | null> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId },
      order: { startTime: 'DESC' }
    });
  
    if (!timer) {
      return null;
    }
  
    const result: any = {
      status: timer.status,
      startTime: timer.startTime,
      isPaused: timer.isPaused
    };
  
    if (timer.isRunning) {
      const now = new Date().getTime();
      let currentDuration = now - timer.startTime.getTime();
      
      // Если есть накопленное время пауз
      if (timer.totalPausedTime) {
        currentDuration -= timer.totalPausedTime;
      }
      
      // Если сейчас на паузе
      if (timer.isPaused && timer.pauseTime) {
        const currentPauseDuration = now - timer.pauseTime.getTime();
        currentDuration -= currentPauseDuration;
      }
  
      // Проверяем, что длительность не отрицательная
      result.currentDuration = Math.max(0, currentDuration);
    } else {
      result.endTime = timer.endTime;
      result.totalDuration = timer.totalDuration;
    }
  
    return result;
  }

  
  async getActiveTimers(): Promise<OrderTimer[]> {
    return this.orderTimerRepository.find({
      where: { 
        isRunning: true,
        isPaused: false 
      },
      order: { 
        startTime: 'DESC' 
      }
    });
  }

  async getTimerHistory(orderId: string): Promise<OrderTimer[]> {
    return this.orderTimerRepository.find({
      where: { orderId },
      order: { startTime: 'DESC' }
    });
  }

  async getAllTimers(){
    const timers = await this.orderTimerRepository.find({
      order: {
        startTime: 'DESC',
      },
      where:{
        status: In(['Completed', 'Paused'])
      }
    });


    const assignedWorkers = await this.usersRepository.find({
      where: {
        id: In(timers.map(timer => timer.userId))
      }
    });

    const timersWithWorkers = timers.map(timer => ({
      ...timer,
      worker: assignedWorkers.find(worker => worker.id === timer.userId)
    }));

    const orders = await this.orderRepository.find({
      where: {
        id: In(timers.map(timer => timer.orderId))
      }
    });

    const timersWithOrders = timersWithWorkers.map(timer => ({
      ...timer,
      order: orders.find(order => order.id === timer.orderId)
    }));

    // const customers = await this.usersRepository.find({
    //   where: {
    //     id: In(orders.map(order => order.customerId))
    //   }
    // });

    // const timersWithCustomers = timersWithOrders.map(timer => ({
    //   ...timer,
    //   customer: timer.order?.customerId ? customers.find(customer => customer.id === timer.order?.customerId) : null,
    // }));
    
    return{
      code: 200,
      data: timersWithOrders
    }
  }

}