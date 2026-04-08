import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
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
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OrderAssignmentHistory } from './entities/order-assignment-history.entity';
import { OrderClientMessage } from './entities/order-client-message.entity';
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
    @InjectRepository(OrderStatusHistory)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(OrderAssignmentHistory)
    private readonly orderAssignmentHistoryRepository: Repository<OrderAssignmentHistory>,
    @InjectRepository(OrderClientMessage)
    private readonly orderClientMessageRepository: Repository<OrderClientMessage>,
  ) {}

  private async canAccessOrder(orderId: string, requester: { id: string; role: string }) {
    const orderEntity = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['assignedWorkers'],
    });

    if (!orderEntity) {
      return { ok: false as const, code: 404 as const, message: 'Order not found' };
    }

    if (requester.role === 'admin') {
      return { ok: true as const, order: orderEntity };
    }

    if (requester.role === 'mechanic' || requester.role === 'electrician' || requester.role === 'manager') {
      const isAssigned =
        (orderEntity.assignedWorkers || []).some((w) => String(w.id) === String(requester.id));
      if (isAssigned) return { ok: true as const, order: orderEntity };
      return { ok: false as const, code: 403 as const, message: 'Access denied' };
    }

    // user/client: only own orders
    if (requester.role === 'user' || requester.role === 'client') {
      if (String(orderEntity.customerId) === String(requester.id)) {
        return { ok: true as const, order: orderEntity };
      }
      return { ok: false as const, code: 403 as const, message: 'Access denied' };
    }

    return { ok: false as const, code: 403 as const, message: 'Access denied' };
  }

  private sanitizeOfferForClient(offerEntity: any) {
    if (!offerEntity) return offerEntity;
    // remove financials: services pricing and any internal fields
    const cleaned = { ...offerEntity };
    // services in DB may be object/array; strip price fields
    if (cleaned.services) {
      if (Array.isArray(cleaned.services)) {
        cleaned.services = cleaned.services.map((s: any) => ({
          serviceName: s?.serviceName,
          unitsOfMeasurement: s?.unitsOfMeasurement,
          description: s?.description,
        }));
      } else if (typeof cleaned.services === 'object') {
        cleaned.services = {
          serviceName: cleaned.services?.serviceName,
          unitsOfMeasurement: cleaned.services?.unitsOfMeasurement,
          description: cleaned.services?.description,
        };
      }
    }
    // parts: hide pricePerUnit/inventory
    if (Array.isArray(cleaned.parts)) {
      cleaned.parts = cleaned.parts.map((p: any) => ({
        label: p?.label,
        quantity: p?.quantity,
      }));
    }
    return cleaned;
  }

  async getClientOrders(req: Request) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      // client: only own, staff/admin: same logic as existing allOrder but without Permissions decorator
      const base = await this.allOrder(req);
      if (base?.code !== 200) return base;

      const data = (base.data || []).map((o: any) => {
        if (requester.role === 'client') {
          return { ...o, offer: this.sanitizeOfferForClient(o.offer) };
        }
        return o;
      });
      return { code: 200, data };
    } catch (err) {
      return { code: 401, message: err instanceof Error ? err.message : 'Unauthorized' };
    }
  }

  async getClientOrderById(orderId: string, req: Request) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) return { code: access.code, message: access.message };

      const offerEntity = await this.offerRepository.findOne({ where: { id: access.order.offerId } });
      const orderWithOffer = {
        ...access.order,
        offer: requester.role === 'client' ? this.sanitizeOfferForClient(offerEntity) : offerEntity,
      };
      return { code: 200, data: orderWithOffer };
    } catch (err) {
      return { code: 401, message: err instanceof Error ? err.message : 'Unauthorized' };
    }
  }

  async addClientMessage(orderId: string, req: Request, payload: { kind?: string; message: string }) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      if (requester.role !== 'client') {
        return { code: 403, message: 'Only client can add messages' };
      }
      if (!payload?.message || !payload.message.trim()) {
        return { code: 400, message: 'Message is required' };
      }

      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) return { code: access.code, message: access.message };

      const saved = await this.orderClientMessageRepository.save(
        this.orderClientMessageRepository.create({
          orderId,
          userId: requester.id,
          kind: payload.kind === 'additional_work' ? 'additional_work' : 'comment',
          message: payload.message.trim(),
        }),
      );

      // store in existing order history stream as well
      await this.orderStatusHistoryRepository.save(
        this.orderStatusHistoryRepository.create({
          orderId,
          oldStatus: undefined,
          newStatus: `client:${saved.kind}`,
          changedBy: requester.id,
        }),
      );

      return { code: 201, data: saved };
    } catch (err) {
      return { code: 500, message: err instanceof Error ? err.message : 'Internal server error' };
    }
  }

  async getClientMessages(orderId: string, req: Request) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) return { code: access.code, message: access.message };

      const msgs = await this.orderClientMessageRepository.find({
        where: { orderId },
        order: { createdAt: 'ASC' },
      });
      return { code: 200, data: msgs };
    } catch (err) {
      return { code: 401, message: err instanceof Error ? err.message : 'Unauthorized' };
    }
  }

  async getClientStatusHistory(orderId: string, req: Request) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) return { code: access.code, message: access.message };

      const history = await this.orderStatusHistoryRepository.find({
        where: { orderId },
        order: { changedAt: 'ASC' },
      });
      return { code: 200, data: history };
    } catch (err) {
      return { code: 401, message: err instanceof Error ? err.message : 'Unauthorized' };
    }
  }

  async getClientTimerHistory(orderId: string, req: Request) {
    const token = getBearerToken(req);
    if (!token) return { code: 401, message: 'Authorization token missing' };
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const requester = { id: String(login.id), role: String(login.role) };

      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) return { code: access.code, message: access.message };

      const timers = await this.orderTimerRepository.find({
        where: { orderId },
        order: { startTime: 'DESC' },
      });
      return { code: 200, data: timers };
    } catch (err) {
      return { code: 401, message: err instanceof Error ? err.message : 'Unauthorized' };
    }
  }

  private async logOrderStatusChange(
    orderId: string,
    oldStatus: string | null,
    newStatus: string,
    changedBy?: string,
  ) {
    if (oldStatus === newStatus) {
      return;
    }
    const history = this.orderStatusHistoryRepository.create({
      orderId,
      oldStatus: oldStatus ?? undefined,
      newStatus,
      changedBy,
    });
    await this.orderStatusHistoryRepository.save(history);
  }

  private async logOrderAssignmentChange(
    orderId: string,
    oldWorkerIds: string[] | null,
    newWorkerIds: string[],
    changedBy?: string,
  ) {
    const history = this.orderAssignmentHistoryRepository.create({
      orderId,
      oldWorkerIds: oldWorkerIds ?? [],
      newWorkerIds,
      changedBy,
    });
    await this.orderAssignmentHistoryRepository.save(history);
  }

  // =============== CRUD МЕТОДЫ ===============
  async create(data: CreateOrderDto) {
    if (!data.offerId || !data.userId || !data.customerId) {
      return { code: 400, message: 'Not all arguments' };
    }
    
    try {
      const checkOffer = await this.offerRepository.findOne({
        where: { id: data.offerId },
      });

      if (!checkOffer) {
        return { code: 404, message: 'Offer not found' };
      }

      if (checkOffer.status !== 'confirmed') {
        return { code: 400, message: 'Offer must be confirmed before creating an order' };
      }

      const userIds = data.userId.map((user) => user.value);
      const assignedWorkers = await this.usersRepository.find({
        where: { id: In(userIds) },
      });

      if (assignedWorkers.length !== data.userId.length) {
        return { code: 404, message: 'One or more users not found' };
      }

      const newOrder = await this.orderRepository.save(
        this.orderRepository.create({
          offerId: data.offerId,
          assignedWorkers: assignedWorkers,
          customerId: data.customerId,
          status: 'created',
          startedAt: new Date(),
        })
      );

      // After creating an order, mark the related offer as confirmed
      await this.offerRepository.update(data.offerId, { 
        status: 'confirmed' 
      });

      // log initial assignment (if any)
      const initialWorkerIds = assignedWorkers.map((w) => String(w.id));
      if (initialWorkerIds.length > 0) {
        await this.logOrderAssignmentChange(newOrder.id, [], initialWorkerIds, String(data.customerId));
      }

      await this.logOrderStatusChange(newOrder.id, null, 'created');

      return { code: 201, data: newOrder };
    } catch (err) {
      return { code: 500, message: err };
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
          return { ...order, offer };
        })
      ) as any[];
  
      const userRoles = ['mechanic', 'electrician'];
      let filteredOrders = ordersWithOffers;

      if (login.role === 'admin') {
        return { code: 200, data: ordersWithOffers };
      } else if (userRoles.includes(login.role)) {
        filteredOrders = ordersWithOffers.filter(order =>
          order.assignedWorkers.some((worker: any) => String(worker.id) === String(login.id))
        );
      } else if (login.role === 'user' || login.role === 'client') {
        filteredOrders = ordersWithOffers.filter(order =>
          String(order.customerId) === String(login.id)
        );
      } else {
        return { code: 403, message: 'Access denied' };
      }
      
      return { code: 200, data: filteredOrders };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  // =============== СТАТУСЫ ===============
  async updateOrderStatus(orderId: string, newStatus: string, req?: Request) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });
  
      if (!order) {
        return { code: 404, message: 'Order not found' };
      }
  
      const offer = await this.offerRepository.findOne({
        where: { id: order.offerId },
      });
  
      if (!offer) {
        return { code: 404, message: 'Offer not found' };
      }
  
      const previousStatus = order.status;
      let changedBy: string | undefined;
      try {
        if (req) {
          const token = getBearerToken(req);
          if (token) {
            const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
            changedBy = String(login.id);
          }
        }
      } catch {}

      // Обновляем статус и дату
      order.status = newStatus;
      if (newStatus === 'finished') {
        order.finishedAt = new Date();
      } else if (newStatus === 'completed') {
        order.completedAt = new Date();
      }
      
      await this.orderRepository.save(order);

      await this.logOrderStatusChange(orderId, previousStatus, newStatus, changedBy);
  
      // ЛОГИКА ДЛЯ СТАТУСА FINISHED
      if (newStatus === 'finished') {
        // 1. Меняем статус Offer на "finished"
        offer.status = 'finished';
        offer.finishedAt = new Date();
        await this.offerRepository.save(offer);
  
        // 2. Создаем запись в истории Offer
        const offerHistory = this.offerHistoryRepository.create({
          offerId: offer.id,
          userId: order.customerId,
          changeDate: new Date(),
          changeDescription: JSON.stringify({ 
            status: 'finished',
            trigger: 'order_finished',
            orderId: orderId 
          }),
        });
        await this.offerHistoryRepository.save(offerHistory);
  
        // 3. Уведомление администрации
        await this.notifyAdminsAboutFinishedOffer(offer, order);
      }
  
      // ЛОГИКА ДЛЯ СТАТУСА COMPLETED
      if (newStatus === 'completed') {
        const customer = await this.usersRepository.findOne({
          where: { id: order.customerId },
        });
  
        if (customer) {
          const subject = 'Invoice created';
          const message = '<p>Invoice created. Please find the attached PDF.</p>';
          const orderData = { ...order, offer: { ...offer } };
          
          await sendEmail(customer.email, orderData, 'Invoice', subject, message);
        }
      }
  
      return {
        code: 200,
        message: 'Order status updated successfully',
        data: order,
      };
    } catch (err) {
      console.error(err);
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async updateOrderWorkers(orderId: string, userIds: string[], req: Request) {
    try {
      const orderEntity = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['assignedWorkers'],
      });

      if (!orderEntity) {
        return { code: 404, message: 'Order not found' };
      }

      const oldWorkerIds = (orderEntity.assignedWorkers || []).map((w) => String(w.id));

      const workers = await this.usersRepository.find({
        where: { id: In(userIds) },
      });

      orderEntity.assignedWorkers = workers;
      await this.orderRepository.save(orderEntity);

      let changedBy: string | undefined;
      try {
        const token = getBearerToken(req);
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
        changedBy = String(login.id);
      } catch {
        changedBy = undefined;
      }

      await this.logOrderAssignmentChange(
        orderId,
        oldWorkerIds,
        workers.map((w) => String(w.id)),
        changedBy,
      );

      return {
        code: 200,
        message: 'Order workers updated successfully',
        data: orderEntity,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async closeOffer(offerId: string, userId: string) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id: offerId },
      });
  
      if (!offer) {
        return { code: 404, message: 'Offer not found' };
      }
  
      // Проверяем, что Offer в статусе "finished"
      if (offer.status !== 'finished') {
        return {
          code: 400,
          message: 'Offer must be in "finished" status before closing',
        };
      }
  
      // Проверяем права пользователя
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
  
      if (!user || !['admin', 'accountant', 'manager'].includes(user.role)) {
        return {
          code: 403,
          message: 'Only admin, accountant or manager can close offers',
        };
      }
  
      // Меняем статус на "closed"
      offer.status = 'closed';
      offer.closedAt = new Date();
      offer.closedBy = userId;
      await this.offerRepository.save(offer);
  
      // Создаем запись в истории
      const offerHistory = this.offerHistoryRepository.create({
        offerId: offer.id,
        userId: userId,
        changeDate: new Date(),
        changeDescription: JSON.stringify({ 
          status: 'closed',
          closedBy: userId,
          closedAt: new Date().toISOString()
        }),
      });
      await this.offerHistoryRepository.save(offerHistory);
  
      return {
        code: 200,
        message: 'Offer closed successfully',
        data: offer,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  // =============== ТАЙМЕРЫ ===============
  async startTimer(orderId: string, req: Request): Promise<any> {
    try {
      const token = getBearerToken(req);
      if (!token) {
        return { code: 401, message: 'Authorization token missing' };
      }

      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

      const timer = this.orderTimerRepository.create({
        orderId,
        userId: login.id,
        startTime: new Date(),
        status: 'In Progress',
        isRunning: true,
        isPaused: false,
      });

      // Обновляем статус заказа
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      const previousStatus = order?.status ?? null;
      await this.orderRepository.update(orderId, { status: 'in-progress' });
      await this.logOrderStatusChange(orderId, previousStatus, 'in-progress', String(login.id));

      const savedTimer = await this.orderTimerRepository.save(timer);
      return { code: 200, data: savedTimer };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async pauseTimer(orderId: string): Promise<any> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId, isRunning: true, isPaused: false },
    });
  
    if (!timer) {
      return { code: 404, message: 'No active timer found for this order' };
    }
  
    const now = new Date();
    timer.isPaused = true;
    timer.status = 'Paused';
    timer.pauseTime = now;
    
    let totalDuration = now.getTime() - timer.startTime.getTime();
    if (timer.totalPausedTime) {
      totalDuration -= timer.totalPausedTime;
    }
    
    timer.totalDuration = Math.max(0, totalDuration);
  
    // Обновляем статус заказа
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    const previousStatus = order?.status ?? null;
    await this.orderRepository.update(orderId, { status: 'waiting' });
    await this.logOrderStatusChange(orderId, previousStatus, 'waiting');
  
    const savedTimer = await this.orderTimerRepository.save(timer);
    return { code: 200, data: savedTimer };
  }

  async resumeTimer(orderId: string): Promise<any> {
    const timer = await this.orderTimerRepository.findOne({
      where: { orderId, isRunning: true, isPaused: true },
    });
 
    if (!timer) {
      return { code: 404, message: 'No paused timer found for this order' };
    }

    if (timer.pauseTime) {
      const pauseDuration = new Date().getTime() - timer.pauseTime.getTime();
      const currentTotal = Number(timer.totalPausedTime || 0);
      const newTotal = currentTotal + pauseDuration;
      const MAX_BIGINT_SAFE = 9_000_000_000_000_000_000; // ~9e18, меньше максимума bigint PostgreSQL
      timer.totalPausedTime = Math.min(newTotal, MAX_BIGINT_SAFE);
    }

    timer.isPaused = false;
    timer.status = 'In Progress';
    
    // Обновляем статус заказа
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    const previousStatus = order?.status ?? null;
    await this.orderRepository.update(orderId, { status: 'in-progress' });
    await this.logOrderStatusChange(orderId, previousStatus, 'in-progress');

    const savedTimer = await this.orderTimerRepository.save(timer);
    return { code: 200, data: savedTimer };
  }

  async stopTimer(orderId: string): Promise<any> {
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
  
    const saved = await this.orderTimerRepository.save(timer);
 
    // АВТОМАТИЧЕСКОЕ ИЗМЕНЕНИЕ СТАТУСА ORDER И OFFER НА FINISHED
    await this.updateOrderStatus(orderId, 'finished');
 
    return { code: 200, data: saved };
  }

  async getOrderStatusHistory(orderId: string) {
    try {
      const history = await this.orderStatusHistoryRepository.find({
        where: { orderId },
        order: { changedAt: 'ASC' },
      });

      return {
        code: 200,
        data: history,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOrderAssignmentHistory(orderId: string) {
    try {
      const history = await this.orderAssignmentHistoryRepository.find({
        where: { orderId },
        order: { changedAt: 'ASC' },
      });

      return {
        code: 200,
        data: history,
      };
    } catch (err) {
      return {
        code: 500,
        message:
          err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  // =============== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===============
  private async notifyAdminsAboutFinishedOffer(offer: offer, order: order) {
    try {
      const admins = await this.usersRepository.find({
        where: { role: In(['admin', 'accountant', 'manager']) }
      });

      for (const admin of admins) {
        const subject = '✅ Offer Ready for Processing';
        const message = `
          <h3>Offer #${offer.id} has been marked as FINISHED</h3>
          <p><strong>Order:</strong> #${order.id}</p>
          <p><strong>Yacht:</strong> ${offer.yachtName} (${offer.yachtModel})</p>
          <p><strong>Customer:</strong> ${offer.customerFullName}</p>
          <p><strong>Finished at:</strong> ${new Date().toLocaleString()}</p>
          <br>
          <p><em>Please perform necessary actions:</em></p>
          <ul>
            <li>Inventory write-off</li>
            <li>Create invoice</li>
            <li>Send to customer</li>
            <li>Mark offer as CLOSED when done</li>
          </ul>
        `;

        await sendEmail(admin.email, { offer, order }, 'Offer Notification', subject, message);
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  // =============== ПОЛУЧЕНИЕ OFFER С ФИЛЬТРАЦИЕЙ ===============
  async getOffersWithFilter(req: Request, status?: string) {
    const token = getBearerToken(req);
    
    try {
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      const userRole = login.role;

      let whereCondition: any = {};

      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      // Для не-админов скрываем закрытые офферы
      if (userRole !== 'admin') {
        if (status === 'closed') {
          return {
            code: 403,
            message: 'Access denied to closed offers',
            data: []
          };
        }
        // Если не указан статус или 'all' - показываем все кроме closed
        if (!status || status === 'all') {
          whereCondition.status = Not('closed');
        }
      }

      const offers = await this.offerRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

      return {
        code: 200,
        data: offers,
        userRole, // для фронтенда
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  // =============== ДРУГИЕ МЕТОДЫ (оставлены без изменений) ===============
  async getOrderById(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['assignedWorkers'],
      });

      if (!order) {
        return { code: 404, message: 'Order not found' };
      }

      const offer = await this.offerRepository.findOne({
        where: { id: order.offerId },
      });

      return { code: 200, data: { ...order, offer } };
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
        return { code: 404, message: 'Order not found' };
      }

      await this.orderRepository.remove(order);
      return { code: 200, message: 'Order deleted successfully' };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  private normalizeUrl(url: string): string {
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
      file: { ...newFile, url: fileUrl }
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
      const sinceStart = now - timer.startTime.getTime();

      // totalPausedTime может быть "испорчена" старыми значениями,Clamp
      const effectiveTotalPaused = Math.min(
        Number(timer.totalPausedTime || 0),
        Math.max(sinceStart, 0),
      );

      let currentDuration = sinceStart - effectiveTotalPaused;
      
      if (timer.isPaused && timer.pauseTime) {
        const currentPauseDuration = now - timer.pauseTime.getTime();
        currentDuration -= currentPauseDuration;
      }
 
      result.currentDuration = Math.max(0, currentDuration);
    } else {
      result.endTime = timer.endTime;
      result.totalDuration = timer.totalDuration;
    }
  
    return result;
  }

  async getActiveTimers(): Promise<OrderTimer[]> {
    return this.orderTimerRepository.find({
      where: { isRunning: true, isPaused: false },
      order: { startTime: 'DESC' }
    });
  }

  async getTimerHistory(orderId: string): Promise<OrderTimer[]> {
    return this.orderTimerRepository.find({
      where: { orderId },
      order: { startTime: 'DESC' }
    });
  }

  async getAllTimers() {
    const timers = await this.orderTimerRepository.find({
      order: { startTime: 'DESC' },
      where: { status: In(['Completed', 'Paused', "finished"]) }
    });

    const assignedWorkers = await this.usersRepository.find({
      where: { id: In(timers.map(timer => timer.userId)) }
    });

    const timersWithWorkers = timers.map(timer => ({
      ...timer,
      worker: assignedWorkers.find(worker => worker.id === timer.userId)
    }));

    const orders = await this.orderRepository.find({
      where: { id: In(timers.map(timer => timer.orderId)) }
    });

    const timersWithOrders = timersWithWorkers.map(timer => ({
      ...timer,
      order: orders.find(order => order.id === timer.orderId)
    }));
    
    return { code: 200, data: timersWithOrders };
  }
}