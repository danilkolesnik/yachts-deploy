import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,In } from 'typeorm';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';
import { order } from './entities/order.entity';
import getBearerToken from 'src/methods/getBearerToken';

import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(offer)
    private readonly offerRepository: Repository<offer>,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(order)
    private readonly orderRepository: Repository<order>,
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
}