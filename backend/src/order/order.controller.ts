import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request } from 'express';

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
}