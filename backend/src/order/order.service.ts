import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
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
import { OrderTimerHistory } from './entities/order-timer-history.entity';
import { OrderClientMessage } from './entities/order-client-message.entity';
import { EmployeeProfile } from 'src/users/entities/employee-profile.entity';
import { PermissionsList } from 'src/constants/permissions';
import { WORKER_TIMER_INDEX_BASE, isWorkerTimerIndex } from 'src/constants/order-timer';
import { getEffectivePermissions, hasAllPermissions } from 'src/users/effective-permissions';
import getBearerToken from 'src/methods/getBearerToken';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises';
import { InvoiceService } from 'src/invoice/invoice.service';
import {
  detectMediaKind,
  getPublicMediaUrl,
} from 'src/utils/mediaUpload';
import {
  isValidOrderMediaTab,
  normalizeMediaUrlList,
  normalizeOrderMediaFields,
} from 'src/constants/order-media';

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
    @InjectRepository(OrderTimerHistory)
    private readonly orderTimerHistoryRepository: Repository<OrderTimerHistory>,
    @InjectRepository(OrderClientMessage)
    private readonly orderClientMessageRepository: Repository<OrderClientMessage>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepository: Repository<EmployeeProfile>,
    private readonly invoiceService: InvoiceService,
  ) {}

  private tryGetUserIdFromRequest(req?: Request): string | undefined {
    try {
      if (!req) return undefined;
      const token = getBearerToken(req);
      if (!token) return undefined;
      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
      return String(login.id);
    } catch {
      return undefined;
    }
  }

  private getRequesterFromReq(req: Request): { id: string; role: string } {
    const token = getBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Authorization token missing');
    }
    const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
    return { id: String(login.id), role: String(login.role) };
  }

  private async assertCanAccessOrder(orderId: string, req: Request) {
    const requester = this.getRequesterFromReq(req);
    const access = await this.canAccessOrder(orderId, requester);
    if (!access.ok) {
      if (access.code === 404) {
        throw new NotFoundException(access.message);
      }
      throw new ForbiddenException(access.message);
    }
    return access.order;
  }

  private assertGlobalTimersRead(req: Request) {
    const requester = this.getRequesterFromReq(req);
    if (requester.role !== 'admin' && requester.role !== 'manager') {
      throw new ForbiddenException('Access denied');
    }
  }

  /** Full timer wipe: only administrator / manager roles (in addition to route permission). */
  private assertTimerClearAllowedByRole(req: Request): void {
    const requester = this.getRequesterFromReq(req);
    const r = String(requester.role || '').toLowerCase();
    if (r !== 'admin' && r !== 'manager') {
      throw new ForbiddenException(
        'Удаление данных таймеров по заказу доступно только администратору или менеджеру',
      );
    }
  }

  /** Portal `/client`: staff keeps existing behaviour; `client` must match profile/role defaults. */
  private async assertClientPortalPermission(
    requester: { id: string; role: string },
    required: string[],
  ): Promise<{ ok: true } | { ok: false; code: number; message: string }> {
    if (requester.role !== 'client') {
      return { ok: true };
    }
    const profile = await this.employeeProfileRepository.findOne({
      where: { userId: requester.id },
    });
    const effective = getEffectivePermissions(requester.role, profile?.permissions);
    if (!hasAllPermissions(effective, required)) {
      return { ok: false, code: 403, message: 'Access denied' };
    }
    return { ok: true };
  }

  private async logOrderTimerEvent(
    orderId: string,
    timerId: string | null | undefined,
    action: string,
    changedBy?: string,
    meta?: Record<string, unknown>,
  ) {
    try {
      await this.orderTimerHistoryRepository.save(
        this.orderTimerHistoryRepository.create({
          orderId,
          timerId: timerId || undefined,
          action,
          changedBy,
          meta: meta && Object.keys(meta).length ? JSON.stringify(meta) : undefined,
        }),
      );
    } catch {
      // never break main flow
    }
  }

  private static readonly ORDER_TIMER_MAX_PAUSED_MS = 9_000_000_000_000_000_000;

  private anchorSegmentStart(timer: OrderTimer): Date {
    const seg = timer.segmentStartedAt;
    return seg ? new Date(seg) : new Date(timer.startTime);
  }

  /** Active-work milliseconds from segment start to endMs (wall clock ms). */
  private segmentWorkedMsTo(timer: OrderTimer, endMs: number): number {
    return Math.max(0, endMs - this.anchorSegmentStart(timer).getTime());
  }

  private userRef(id: string | null | undefined, byId: Map<string, users>) {
    if (id == null || !String(id).trim()) return null;
    const key = String(id);
    const row = byId.get(key);
    return {
      id: key,
      fullName: (row?.fullName && String(row.fullName).trim()) || key,
    };
  }

  private async loadUsersByIds(ids: Iterable<string | null | undefined>): Promise<Map<string, users>> {
    const unique = new Set<string>();
    for (const raw of ids) {
      if (raw != null && String(raw).trim()) unique.add(String(raw));
    }
    if (!unique.size) return new Map();
    const rows = await this.usersRepository.find({ where: { id: In([...unique]) } });
    return new Map(rows.map((u) => [String(u.id), u]));
  }

  private collectIdsFromTimerMeta(metaRaw?: string): string[] {
    if (!metaRaw) return [];
    try {
      const meta = JSON.parse(metaRaw) as Record<string, unknown>;
      return [
        meta.triggeredByUserId,
        meta.timerOwnerUserId,
        meta.timerUserId,
        meta.clearedByUserId,
      ]
        .filter((x) => x != null)
        .map((x) => String(x));
    } catch {
      return [];
    }
  }

  private async canAccessOrder(orderId: string, requester: { id: string; role: string }) {
    const orderEntity = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['assignedWorkers'],
    });

    if (!orderEntity) {
      return { ok: false as const, code: 404 as const, message: 'Order not found' };
    }

    if (requester.role === 'admin' || requester.role === 'manager') {
      return { ok: true as const, order: orderEntity };
    }

    if (requester.role === 'mechanic' || requester.role === 'electrician') {
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

      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_READ,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
      }

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

      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_READ,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
      }

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
      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_MESSAGES_WRITE,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
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

      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_READ,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
      }

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

      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_READ,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
      }

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

      const portalGate = await this.assertClientPortalPermission(requester, [
        PermissionsList.SELF_ORDERS_READ,
      ]);
      if (!portalGate.ok) {
        return { code: portalGate.code, message: portalGate.message };
      }

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

  private workersAssignmentChanged(oldWorkerIds: string[], newWorkerIds: string[]): boolean {
    const a = new Set((oldWorkerIds || []).map(String));
    const b = new Set((newWorkerIds || []).map(String));
    if (a.size !== b.size) return true;
    for (const id of a) {
      if (!b.has(id)) return true;
    }
    return false;
  }

  private async logOrderAssignmentChange(
    orderId: string,
    oldWorkerIds: string[] | null,
    newWorkerIds: string[],
    changedBy?: string,
    changeReason?: string,
  ) {
    const history = this.orderAssignmentHistoryRepository.create({
      orderId,
      oldWorkerIds: oldWorkerIds ?? [],
      newWorkerIds,
      changedBy,
      changeReason: changeReason?.trim() || undefined,
    });
    await this.orderAssignmentHistoryRepository.save(history);
  }

  // =============== CRUD МЕТОДЫ ===============
  async create(data: CreateOrderDto, req?: Request) {
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

      const createdBy = req ? this.tryGetUserIdFromRequest(req) : undefined;

      const newOrder = await this.orderRepository.save(
        this.orderRepository.create({
          offerId: data.offerId,
          assignedWorkers: assignedWorkers,
          customerId: data.customerId,
          createdBy: createdBy || undefined,
          status: 'created',
          startedAt: new Date(),
          services: Array.isArray(checkOffer.services) ? checkOffer.services : [],
          parts: Array.isArray(checkOffer.parts) ? checkOffer.parts : [],
        })
      );

      // After creating an order, mark the related offer as confirmed
      await this.offerRepository.update(data.offerId, { 
        status: 'confirmed' 
      });

      // log initial assignment (if any)
      const initialWorkerIds = assignedWorkers.map((w) => String(w.id));
      if (initialWorkerIds.length > 0) {
        await this.logOrderAssignmentChange(
          newOrder.id,
          [],
          initialWorkerIds,
          createdBy || String(data.customerId),
        );
      }

      await this.logOrderStatusChange(newOrder.id, null, 'created');

      return { code: 201, data: newOrder };
    } catch (err) {
      return { code: 500, message: err };
    }
  }

  async updateOrderItems(
    orderId: string,
    items: { services?: any[]; parts?: any[] },
    req: Request,
  ) {
    await this.assertCanAccessOrder(orderId, req);
    const changedBy = this.tryGetUserIdFromRequest(req);

    const orderEntity = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!orderEntity) return { code: 404, message: 'Order not found' };

    const prevServices = Array.isArray(orderEntity.services) ? orderEntity.services : [];
    const prevParts = Array.isArray(orderEntity.parts) ? orderEntity.parts : [];
    const nextServices = items.services !== undefined ? (Array.isArray(items.services) ? items.services : []) : prevServices;
    const nextParts = items.parts !== undefined ? (Array.isArray(items.parts) ? items.parts : []) : prevParts;

    orderEntity.services = nextServices as any;
    orderEntity.parts = nextParts as any;
    const saved = await this.orderRepository.save(orderEntity);

    await this.auditOrderItems(orderId, changedBy, {
      servicesCountBefore: prevServices.length,
      servicesCountAfter: Array.isArray(nextServices) ? nextServices.length : 0,
      partsCountBefore: prevParts.length,
      partsCountAfter: Array.isArray(nextParts) ? nextParts.length : 0,
      servicesSummaryBefore: prevServices.map((s: any) => s?.serviceName || s?.label || s?.name).filter(Boolean),
      servicesSummaryAfter: (nextServices as any[])
        .map((s: any) => s?.serviceName || s?.label || s?.name)
        .filter(Boolean),
      partsSummaryBefore: prevParts.map((p: any) => p?.partName || p?.label || p?.name).filter(Boolean),
      partsSummaryAfter: (nextParts as any[])
        .map((p: any) => p?.partName || p?.label || p?.name)
        .filter(Boolean),
    });

    return { code: 200, data: saved };
  }

  private async auditOrderItems(orderId: string, changedBy?: string, meta?: Record<string, unknown>) {
    // reuse order timer history table as lightweight audit stream (non-breaking)
    await this.logOrderTimerEvent(orderId, null, 'items.updated', changedBy, meta);
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

      if (login.role === 'admin' || login.role === 'manager') {
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
      if (req) {
        await this.assertCanAccessOrder(orderId, req);
      }

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
  
        if (customer?.email) {
          const invoiceResult = await this.invoiceService.createFromOffer(
            offer.id,
            orderId,
          );

          if (invoiceResult.code === 200 || invoiceResult.code === 201) {
            const subject = 'Invoice created';
            const message = '<p>Invoice created. Please find the attached PDF.</p>';
            await sendEmail(
              customer.email,
              invoiceResult.data,
              'invoice',
              subject,
              message,
            );
          }
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

  async updateOrderWorkers(
    orderId: string,
    userIds: string[],
    changeReason: string | undefined,
    req: Request,
  ) {
    try {
      await this.assertCanAccessOrder(orderId, req);

      const orderEntity = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['assignedWorkers'],
      });

      if (!orderEntity) {
        return { code: 404, message: 'Order not found' };
      }

      const oldWorkerIds = (orderEntity.assignedWorkers || []).map((w) => String(w.id));
      const newWorkerIds = (userIds || []).map(String);
      const assignmentChanged = this.workersAssignmentChanged(oldWorkerIds, newWorkerIds);

      const workers =
        newWorkerIds.length > 0
          ? await this.usersRepository.find({
              where: { id: In(newWorkerIds) },
            })
          : [];

      orderEntity.assignedWorkers = workers;
      await this.orderRepository.save(orderEntity);

      const changedBy = this.tryGetUserIdFromRequest(req);

      if (assignmentChanged) {
        await this.logOrderAssignmentChange(
          orderId,
          oldWorkerIds,
          workers.map((w) => String(w.id)),
          changedBy,
          changeReason,
        );
      }

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
  /** Количество строк услуг в ЗН (order.services или снимок из offer.services). */
  private countOrderServiceLines(orderEntity: order, offer: offer | null): number {
    const o = orderEntity as any;
    if (Array.isArray(o?.services) && o.services.length > 0) {
      return o.services.length;
    }
    const off = offer as any;
    if (Array.isArray(off?.services) && off.services.length > 0) {
      return off.services.length;
    }
    return 0;
  }

  private perLineWhere(orderId: string, serviceLineIndex: number) {
    return { orderId, serviceLineIndex, isRunning: true } as const;
  }

  private legacyActiveWhere(orderId: string) {
    return { orderId, serviceLineIndex: IsNull(), isRunning: true } as const;
  }

  /** Returns error message or null if serviceLineIndex is valid for this order. */
  private validateTimerServiceLineIndex(
    order: order,
    offer: offer | null,
    serviceLineIndex: number,
  ): string | null {
    if (serviceLineIndex < 0) {
      return 'Invalid service line index';
    }
    if (isWorkerTimerIndex(serviceLineIndex)) {
      const slot = serviceLineIndex - WORKER_TIMER_INDEX_BASE;
      const workers = order.assignedWorkers || [];
      if (slot >= workers.length) {
        return 'Invalid worker timer slot (assign the worker to the order first)';
      }
      return null;
    }
    const lineCount = this.countOrderServiceLines(order, offer);
    if (lineCount === 0) {
      if (serviceLineIndex !== 0) {
        return 'Invalid service line index';
      }
    } else if (serviceLineIndex >= lineCount) {
      return 'Invalid service line index';
    }
    return null;
  }

  async startTimer(
    orderId: string,
    req: Request,
    serviceLineIndex?: number | null,
  ): Promise<any> {
    try {
      const order = await this.assertCanAccessOrder(orderId, req);
      const offer = await this.offerRepository.findOne({ where: { id: order.offerId } });
      const isPerLine = serviceLineIndex !== undefined && serviceLineIndex !== null;

      if (isPerLine) {
        const lineErr = this.validateTimerServiceLineIndex(
          order,
          offer,
          serviceLineIndex as number,
        );
        if (lineErr) {
          return { code: 400, message: lineErr };
        }
        const conflict = await this.orderTimerRepository.findOne({
          where: this.perLineWhere(orderId, serviceLineIndex as number),
        });
        if (conflict) {
          return { code: 409, message: 'A timer is already running for this service line' };
        }
      } else {
        const conflict = await this.orderTimerRepository.findOne({
          where: this.legacyActiveWhere(orderId),
        });
        if (conflict) {
          return { code: 409, message: 'A timer is already running for this order' };
        }
      }

      const token = getBearerToken(req);
      if (!token) {
        return { code: 401, message: 'Authorization token missing' };
      }

      const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

      const startedAt = new Date();
      const timer = this.orderTimerRepository.create({
        orderId,
        userId: login.id,
        startTime: startedAt,
        segmentStartedAt: startedAt,
        status: 'In Progress',
        isRunning: true,
        isPaused: false,
        serviceLineIndex: isPerLine ? (serviceLineIndex as number) : null,
      });

      const previousStatus = order?.status ?? null;
      await this.orderRepository.update(orderId, { status: 'in-progress' });
      await this.logOrderStatusChange(orderId, previousStatus, 'in-progress', String(login.id));

      const savedTimer = await this.orderTimerRepository.save(timer);
      const ownerId = String(savedTimer.userId || login.id);
      await this.logOrderTimerEvent(orderId, savedTimer.id, 'start', String(login.id), {
        triggeredByUserId: String(login.id),
        timerOwnerUserId: ownerId,
        timerUserId: ownerId,
        sessionStartedAt: startedAt.toISOString(),
        segmentStartedAt: startedAt.toISOString(),
        timerStatus: savedTimer.status,
        isRunning: savedTimer.isRunning,
        isPaused: savedTimer.isPaused,
        serviceLineIndex: savedTimer.serviceLineIndex,
      });
      return { code: 200, data: savedTimer };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async pauseTimer(
    orderId: string,
    req: Request,
    serviceLineIndex?: number | null,
  ): Promise<any> {
    await this.assertCanAccessOrder(orderId, req);

    const isPerLine = serviceLineIndex !== undefined && serviceLineIndex !== null;
    const timer = await this.orderTimerRepository.findOne({
      where: isPerLine
        ? { ...this.perLineWhere(orderId, serviceLineIndex as number), isPaused: false }
        : { orderId, serviceLineIndex: IsNull(), isRunning: true, isPaused: false },
    });

    if (!timer) {
      return { code: 404, message: 'No active timer found for this order' };
    }

    const changedBy = this.tryGetUserIdFromRequest(req);

    const now = new Date();
    const nowMs = now.getTime();
    const segmentStartedAtIso = this.anchorSegmentStart(timer).toISOString();
    const segmentWorkedMs = this.segmentWorkedMsTo(timer, nowMs);

    timer.isPaused = true;
    timer.status = 'Paused';
    timer.pauseTime = now;

    let totalDuration = nowMs - timer.startTime.getTime();
    if (timer.totalPausedTime) {
      totalDuration -= timer.totalPausedTime;
    }

    timer.totalDuration = Math.max(0, totalDuration);

    const perLine = timer.serviceLineIndex !== null && timer.serviceLineIndex !== undefined;
    if (!perLine) {
      const orderRow = await this.orderRepository.findOne({ where: { id: orderId } });
      const previousStatus = orderRow?.status ?? null;
      await this.orderRepository.update(orderId, { status: 'waiting' });
      await this.logOrderStatusChange(orderId, previousStatus, 'waiting', changedBy);
    }

    const savedTimer = await this.orderTimerRepository.save(timer);
    const ownerId = String(timer.userId || '');
    await this.logOrderTimerEvent(orderId, savedTimer.id, 'pause', changedBy, {
      triggeredByUserId: changedBy ?? null,
      timerOwnerUserId: ownerId,
      timerUserId: ownerId,
      pauseAt: now.toISOString(),
      segmentStartedAt: segmentStartedAtIso,
      segmentWorkedMs,
      cumulativeActiveWorkMs:
        savedTimer.totalDuration != null ? Number(savedTimer.totalDuration) : null,
      timerStatus: savedTimer.status,
      totalDurationMs: savedTimer.totalDuration != null ? Number(savedTimer.totalDuration) : null,
      orderStatusSideEffect: perLine ? null : 'waiting',
      serviceLineIndex: savedTimer.serviceLineIndex,
    });
    return { code: 200, data: savedTimer };
  }

  async resumeTimer(
    orderId: string,
    req: Request,
    serviceLineIndex?: number | null,
  ): Promise<any> {
    await this.assertCanAccessOrder(orderId, req);

    const isPerLine = serviceLineIndex !== undefined && serviceLineIndex !== null;
    const timer = await this.orderTimerRepository.findOne({
      where: isPerLine
        ? { ...this.perLineWhere(orderId, serviceLineIndex as number), isPaused: true }
        : { orderId, serviceLineIndex: IsNull(), isRunning: true, isPaused: true },
    });

    if (!timer) {
      return { code: 404, message: 'No paused timer found for this order' };
    }

    const changedBy = this.tryGetUserIdFromRequest(req);

    const resumeAt = new Date();
    const resumeMs = resumeAt.getTime();
    let pauseBreakMs: number | null = null;

    if (timer.pauseTime) {
      pauseBreakMs = resumeMs - timer.pauseTime.getTime();
      const currentTotal = Number(timer.totalPausedTime || 0);
      const newTotal = currentTotal + pauseBreakMs;
      timer.totalPausedTime = Math.min(newTotal, OrderService.ORDER_TIMER_MAX_PAUSED_MS);
    }

    timer.isPaused = false;
    timer.status = 'In Progress';
    timer.segmentStartedAt = resumeAt;

    const perLine = timer.serviceLineIndex !== null && timer.serviceLineIndex !== undefined;
    if (!perLine) {
      const orderRow = await this.orderRepository.findOne({ where: { id: orderId } });
      const previousStatus = orderRow?.status ?? null;
      await this.orderRepository.update(orderId, { status: 'in-progress' });
      await this.logOrderStatusChange(orderId, previousStatus, 'in-progress', changedBy);
    }

    const savedTimer = await this.orderTimerRepository.save(timer);
    const ownerId = String(timer.userId || '');
    await this.logOrderTimerEvent(orderId, savedTimer.id, 'resume', changedBy, {
      triggeredByUserId: changedBy ?? null,
      timerOwnerUserId: ownerId,
      timerUserId: ownerId,
      resumeAt: resumeAt.toISOString(),
      pauseBreakMs,
      newSegmentStartedAt: resumeAt.toISOString(),
      totalPausedTimeMs: savedTimer.totalPausedTime != null ? Number(savedTimer.totalPausedTime) : null,
      timerStatus: savedTimer.status,
      orderStatusSideEffect: perLine ? null : 'in-progress',
      serviceLineIndex: savedTimer.serviceLineIndex,
    });
    return { code: 200, data: savedTimer };
  }

  async stopTimer(
    orderId: string,
    req: Request,
    serviceLineIndex?: number | null,
  ): Promise<any> {
    await this.assertCanAccessOrder(orderId, req);

    const isPerLine = serviceLineIndex !== undefined && serviceLineIndex !== null;
    const timer = await this.orderTimerRepository.findOne({
      where: isPerLine
        ? this.perLineWhere(orderId, serviceLineIndex as number)
        : { orderId, serviceLineIndex: IsNull(), isRunning: true },
    });

    if (!timer) {
      return { code: 404, message: 'No active timer found for this order' };
    }

    const changedBy = this.tryGetUserIdFromRequest(req);

    const now = new Date();
    const nowMs = now.getTime();

    let segmentWorkedMs = 0;
    if (timer.isPaused && timer.pauseTime) {
      segmentWorkedMs = this.segmentWorkedMsTo(timer, timer.pauseTime.getTime());
    } else {
      segmentWorkedMs = this.segmentWorkedMsTo(timer, nowMs);
    }

    if (timer.isPaused && timer.pauseTime) {
      const tailPauseMs = nowMs - timer.pauseTime.getTime();
      const currentTotal = Number(timer.totalPausedTime || 0);
      timer.totalPausedTime = Math.min(
        currentTotal + tailPauseMs,
        OrderService.ORDER_TIMER_MAX_PAUSED_MS,
      );
    }

    timer.endTime = now;
    timer.isRunning = false;
    timer.isPaused = false;
    timer.pauseTime = null;
    timer.segmentStartedAt = null;
    timer.status = 'Completed';

    const wallMs = nowMs - timer.startTime.getTime();
    const pausedTotal = Number(timer.totalPausedTime || 0);
    timer.totalDuration = Math.max(0, wallMs - pausedTotal);

    const saved = await this.orderTimerRepository.save(timer);
    const perLine = saved.serviceLineIndex !== null && saved.serviceLineIndex !== undefined;
    const ownerId = String(timer.userId || '');
    await this.logOrderTimerEvent(orderId, saved.id, 'stop', changedBy, {
      triggeredByUserId: changedBy ?? null,
      timerOwnerUserId: ownerId,
      timerUserId: ownerId,
      stopAt: now.toISOString(),
      segmentWorkedMs,
      wallClockMs: wallMs,
      totalPausedTimeMs: pausedTotal,
      activeWorkTotalMs: saved.totalDuration != null ? Number(saved.totalDuration) : null,
      totalDurationMs: saved.totalDuration != null ? Number(saved.totalDuration) : null,
      endTime: saved.endTime ? saved.endTime.toISOString() : null,
      timerStatus: saved.status,
      serviceLineIndex: saved.serviceLineIndex,
    });

    if (!perLine) {
      await this.updateOrderStatus(orderId, 'finished', req);
    }

    return { code: 200, data: saved };
  }

  async getOrderStatusHistory(orderId: string, req: Request) {
    try {
      await this.assertCanAccessOrder(orderId, req);

      const history = await this.orderStatusHistoryRepository.find({
        where: { orderId },
        order: { changedAt: 'ASC' },
      });

      return {
        code: 200,
        data: history,
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOrderAssignmentHistory(orderId: string, req: Request) {
    try {
      await this.assertCanAccessOrder(orderId, req);

      const history = await this.orderAssignmentHistoryRepository.find({
        where: { orderId },
        order: { changedAt: 'ASC' },
      });

      const userIds: string[] = [];
      for (const item of history) {
        if (item.changedBy) userIds.push(String(item.changedBy));
        for (const id of item.oldWorkerIds || []) userIds.push(String(id));
        for (const id of item.newWorkerIds || []) userIds.push(String(id));
      }
      const usersById = await this.loadUsersByIds(userIds);

      const data = history.map((item) => ({
        ...item,
        changedByUser: this.userRef(item.changedBy, usersById),
        oldWorkers: (item.oldWorkerIds || []).map((wid) => this.userRef(wid, usersById)),
        newWorkers: (item.newWorkerIds || []).map((wid) => this.userRef(wid, usersById)),
      }));

      return {
        code: 200,
        data,
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
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

      // Для не-админов/не-менеджеров скрываем закрытые офферы
      if (userRole !== 'admin' && userRole !== 'manager') {
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

  async getOrderReport(orderId: string, req: Request) {
    try {
      const orderEntity = await this.assertCanAccessOrder(orderId, req);

      const offer = await this.offerRepository.findOne({
        where: { id: orderEntity.offerId },
      });

      const [
        statusHistory,
        assignmentHistory,
        timerSessions,
        timerEvents,
        clientMessages,
      ] = await Promise.all([
        this.orderStatusHistoryRepository.find({ where: { orderId }, order: { changedAt: 'ASC' } }),
        this.orderAssignmentHistoryRepository.find({ where: { orderId }, order: { changedAt: 'ASC' } }),
        this.orderTimerRepository.find({ where: { orderId }, order: { startTime: 'ASC' } }),
        this.orderTimerHistoryRepository.find({ where: { orderId }, order: { changedAt: 'ASC' } }),
        this.orderClientMessageRepository.find({ where: { orderId }, order: { createdAt: 'ASC' } }),
      ]);

      const userIds: string[] = [];
      if (orderEntity.createdBy) userIds.push(String(orderEntity.createdBy));
      for (const s of statusHistory) {
        if (s.changedBy) userIds.push(String(s.changedBy));
      }
      for (const a of assignmentHistory) {
        if (a.changedBy) userIds.push(String(a.changedBy));
        for (const id of a.oldWorkerIds || []) userIds.push(String(id));
        for (const id of a.newWorkerIds || []) userIds.push(String(id));
      }
      for (const t of timerSessions) {
        if (t.userId) userIds.push(String(t.userId));
      }
      for (const ev of timerEvents) {
        if (ev.changedBy) userIds.push(String(ev.changedBy));
        userIds.push(...this.collectIdsFromTimerMeta(ev.meta));
      }

      const usersById = await this.loadUsersByIds(userIds);
      const createdByUser = this.userRef(orderEntity.createdBy, usersById);

      const enrichedStatus = statusHistory.map((s) => ({
        ...s,
        changedByUser: this.userRef(s.changedBy, usersById),
      }));

      const enrichedAssignment = assignmentHistory.map((item) => ({
        ...item,
        changedByUser: this.userRef(item.changedBy, usersById),
        oldWorkers: (item.oldWorkerIds || []).map((wid) => this.userRef(wid, usersById)),
        newWorkers: (item.newWorkerIds || []).map((wid) => this.userRef(wid, usersById)),
      }));

      const enrichedTimers = timerSessions.map((t) => ({
        ...t,
        worker: this.userRef(t.userId, usersById),
      }));

      const enrichedTimerEvents = timerEvents.map((ev) => {
        let meta: Record<string, unknown> = {};
        try {
          if (ev.meta) meta = JSON.parse(ev.meta);
        } catch {
          meta = {};
        }
        const ownerId = meta.timerOwnerUserId ?? meta.timerUserId;
        return {
          ...ev,
          meta,
          changedByUser: this.userRef(ev.changedBy, usersById),
          timerOwnerUser: this.userRef(ownerId != null ? String(ownerId) : undefined, usersById),
        };
      });

      const itemChangeEvents = enrichedTimerEvents.filter((e) => e.action === 'items.updated');

      type TimelineRow = {
        at: string;
        kind: string;
        title: string;
        detail: string;
        actor?: string | null;
      };

      const timeline: TimelineRow[] = [];

      if (orderEntity.createdAt) {
        timeline.push({
          at: new Date(orderEntity.createdAt).toISOString(),
          kind: 'order.created',
          title: 'Work order created',
          detail: `Status: created · Offer ${orderEntity.offerId}`,
          actor: createdByUser?.fullName ?? orderEntity.createdBy ?? null,
        });
      }

      for (const s of enrichedStatus) {
        timeline.push({
          at: s.changedAt ? new Date(s.changedAt).toISOString() : '',
          kind: 'status',
          title: 'Status changed',
          detail: `${s.oldStatus || '—'} → ${s.newStatus}`,
          actor: s.changedByUser?.fullName ?? s.changedBy ?? null,
        });
      }

      for (const a of enrichedAssignment) {
        const oldNames = (a.oldWorkers || []).map((w) => w?.fullName).filter(Boolean).join(', ') || '—';
        const newNames = (a.newWorkers || []).map((w) => w?.fullName).filter(Boolean).join(', ') || '—';
        timeline.push({
          at: a.changedAt ? new Date(a.changedAt).toISOString() : '',
          kind: 'assignment',
          title: 'Workers assignment',
          detail: `${oldNames} → ${newNames}${a.changeReason ? ` · Reason: ${a.changeReason}` : ''}`,
          actor: a.changedByUser?.fullName ?? a.changedBy ?? null,
        });
      }

      for (const ev of itemChangeEvents) {
        const m = ev.meta || {};
        timeline.push({
          at: ev.changedAt ? new Date(ev.changedAt).toISOString() : '',
          kind: 'items',
          title: 'Order items updated',
          detail: `Services: ${m.servicesCountBefore ?? '?'} → ${m.servicesCountAfter ?? '?'}, parts: ${m.partsCountBefore ?? '?'} → ${m.partsCountAfter ?? '?'}`,
          actor: ev.changedByUser?.fullName ?? ev.changedBy ?? null,
        });
      }

      for (const ev of enrichedTimerEvents.filter((e) => e.action !== 'items.updated')) {
        const m = ev.meta || {};
        let detail = ev.action;
        if (ev.action === 'pause' && m.segmentWorkedMs != null) {
          detail = `Pause · segment ${m.segmentWorkedMs} ms`;
        } else if (ev.action === 'stop' && m.activeWorkTotalMs != null) {
          detail = `Stop · active total ${m.activeWorkTotalMs} ms`;
        } else if (ev.action === 'cleared') {
          detail = `All timer sessions cleared (${m.deletedCount ?? 0})`;
        }
        const line =
          m.serviceLineIndex != null ? ` · line #${Number(m.serviceLineIndex) + 1}` : '';
        timeline.push({
          at: ev.changedAt ? new Date(ev.changedAt).toISOString() : '',
          kind: 'timer',
          title: `Timer: ${ev.action}`,
          detail: `${detail}${line}`,
          actor: ev.changedByUser?.fullName ?? ev.changedBy ?? null,
        });
      }

      for (const m of clientMessages) {
        timeline.push({
          at: m.createdAt ? new Date(m.createdAt).toISOString() : '',
          kind: 'message',
          title: `Client message (${m.kind || 'note'})`,
          detail: String(m.message || '').slice(0, 500),
          actor: null,
        });
      }

      timeline.sort((a, b) => String(a.at).localeCompare(String(b.at)));

      return {
        code: 200,
        data: {
          order: { ...orderEntity, offer },
          createdByUser,
          statusHistory: enrichedStatus,
          assignmentHistory: enrichedAssignment,
          timerSessions: enrichedTimers,
          timerEvents: enrichedTimerEvents,
          clientMessages,
          timeline,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  // =============== ДРУГИЕ МЕТОДЫ (оставлены без изменений) ===============
  async getWorkOrderPdfPayload(orderId: string, req: Request) {
    try {
      const requester = this.getRequesterFromReq(req);
      const access = await this.canAccessOrder(orderId, requester);
      if (!access.ok) {
        return { code: access.code, message: access.message };
      }

      const offer = await this.offerRepository.findOne({
        where: { id: access.order.offerId },
      });

      if (!offer) {
        return { code: 404, message: 'Offer not found for this order' };
      }

      return {
        code: 200,
        data: { order: access.order, offer },
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getOrderById(orderId: string, req: Request) {
    try {
      const orderEntity = await this.assertCanAccessOrder(orderId, req);

      const offer = await this.offerRepository.findOne({
        where: { id: orderEntity.offerId },
      });

      const usersById = orderEntity.createdBy
        ? await this.loadUsersByIds([orderEntity.createdBy])
        : new Map();
      const createdByUser = this.userRef(orderEntity.createdBy, usersById);

      return {
        code: 200,
        data: normalizeOrderMediaFields({
          ...orderEntity,
          offer,
          createdByUser,
        }),
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async deleteOrder(orderId: string, req: Request) {
    try {
      await this.assertCanAccessOrder(orderId, req);

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return { code: 404, message: 'Order not found' };
      }

      await this.orderRepository.remove(order);
      return { code: 200, message: 'Order deleted successfully' };
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  private normalizeUrl(url: string): string {
    return url.replace(/([^:]\/)\/+/g, "$1");
  }

  async uploadFileToOrder(
    orderId: string,
    file: Express.Multer.File,
    tab: string,
    req: Request,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Файл не загружен.');
    }

    if (!isValidOrderMediaTab(tab)) {
      throw new BadRequestException(
        'Неверный раздел медиа-отчёта (ожидается: process, result, tab).',
      );
    }

    const order = await this.assertCanAccessOrder(orderId, req);

    order.processImageUrls = normalizeMediaUrlList(order.processImageUrls);
    order.processVideoUrls = normalizeMediaUrlList(order.processVideoUrls);
    order.resultImageUrls = normalizeMediaUrlList(order.resultImageUrls);
    order.resultVideoUrls = normalizeMediaUrlList(order.resultVideoUrls);
    order.tabImageUrls = normalizeMediaUrlList(order.tabImageUrls);
    order.tabVideoUrls = normalizeMediaUrlList(order.tabVideoUrls);

    const kind = detectMediaKind(file.mimetype, file.originalname);
    if (!kind) {
      throw new BadRequestException(
        'Unsupported file type. Upload images or videos (e.g. .mp4).',
      );
    }

    const isImage = kind === 'image';
    const isVideo = kind === 'video';
    const fileUrl = getPublicMediaUrl(file.filename, kind);
    
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
    } else {
      throw new BadRequestException(
        'Неверный раздел медиа-отчёта (ожидается: process, result, tab).',
      );
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

  async deleteFileFromOrder(
    orderId: string,
    fileUrl: string,
    tab: string,
    req: Request,
  ): Promise<{ message: string; code: number }> {
    if (!isValidOrderMediaTab(tab)) {
      throw new BadRequestException(
        'Неверный раздел медиа-отчёта (ожидается: process, result, tab).',
      );
    }

    const order = await this.assertCanAccessOrder(orderId, req);

    order.processImageUrls = normalizeMediaUrlList(order.processImageUrls);
    order.processVideoUrls = normalizeMediaUrlList(order.processVideoUrls);
    order.resultImageUrls = normalizeMediaUrlList(order.resultImageUrls);
    order.resultVideoUrls = normalizeMediaUrlList(order.resultVideoUrls);
    order.tabImageUrls = normalizeMediaUrlList(order.tabImageUrls);
    order.tabVideoUrls = normalizeMediaUrlList(order.tabVideoUrls);

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

  async getTimerStatus(
    orderId: string,
    req: Request,
    serviceLineIndex?: number | null,
  ): Promise<{
    status: string;
    startTime: Date;
    currentDuration?: number;
    endTime?: Date;
    totalDuration?: number;
    isPaused: boolean;
  } | null> {
    await this.assertCanAccessOrder(orderId, req);

    const isPerLine =
      serviceLineIndex !== undefined &&
      serviceLineIndex !== null &&
      !Number.isNaN(Number(serviceLineIndex));

    let timer: OrderTimer | null = null;

    if (isPerLine) {
      timer = await this.orderTimerRepository.findOne({
        where: this.perLineWhere(orderId, serviceLineIndex as number),
      });
    } else {
      timer = await this.orderTimerRepository.findOne({
        where: this.legacyActiveWhere(orderId),
      });
    }

    if (!timer) {
      return null;
    }

    const result: any = {
      status: timer.status,
      startTime: timer.startTime,
      isPaused: timer.isPaused,
    };

    const now = new Date().getTime();
    const sinceStart = now - timer.startTime.getTime();
    const effectiveTotalPaused = Math.min(
      Number(timer.totalPausedTime || 0),
      Math.max(sinceStart, 0),
    );

    if (timer.isPaused) {
      // Freeze display at pause — do not subtract growing pause wall time from "now"
      if (timer.totalDuration != null) {
        result.currentDuration = Math.max(0, Number(timer.totalDuration));
      } else if (timer.pauseTime) {
        const pauseMs = timer.pauseTime.getTime();
        const sinceStartAtPause = pauseMs - timer.startTime.getTime();
        const pausedAtPause = Math.min(
          Number(timer.totalPausedTime || 0),
          Math.max(sinceStartAtPause, 0),
        );
        result.currentDuration = Math.max(0, sinceStartAtPause - pausedAtPause);
      } else {
        result.currentDuration = Math.max(0, sinceStart - effectiveTotalPaused);
      }
    } else {
      result.currentDuration = Math.max(0, sinceStart - effectiveTotalPaused);
    }

    return result;
  }

  async getActiveTimers(req: Request): Promise<OrderTimer[]> {
    this.assertGlobalTimersRead(req);
    return this.orderTimerRepository.find({
      where: { isRunning: true, isPaused: false },
      order: { startTime: 'DESC' }
    });
  }

  async getTimerHistory(orderId: string, req: Request): Promise<Array<OrderTimer & { worker: { id: string; fullName: string } | null }>> {
    await this.assertCanAccessOrder(orderId, req);
    const timers = await this.orderTimerRepository.find({
      where: { orderId },
      order: { startTime: 'DESC' },
    });
    const usersById = await this.loadUsersByIds(timers.map((t) => t.userId));
    return timers.map((t) => ({
      ...t,
      worker: this.userRef(t.userId, usersById),
    }));
  }

  async getTimerEvents(
    orderId: string,
    req: Request,
  ): Promise<
    Array<
      OrderTimerHistory & {
        changedByUser: { id: string; fullName: string } | null;
        timerOwnerUser: { id: string; fullName: string } | null;
      }
    >
  > {
    await this.assertCanAccessOrder(orderId, req);
    const events = await this.orderTimerHistoryRepository.find({
      where: { orderId },
      order: { changedAt: 'ASC' },
    });

    const userIds: string[] = [];
    for (const ev of events) {
      if (ev.changedBy) userIds.push(String(ev.changedBy));
      userIds.push(...this.collectIdsFromTimerMeta(ev.meta));
    }
    const usersById = await this.loadUsersByIds(userIds);

    return events.map((ev) => {
      let timerOwnerId: string | undefined;
      try {
        if (ev.meta) {
          const meta = JSON.parse(ev.meta) as Record<string, unknown>;
          const owner = meta.timerOwnerUserId ?? meta.timerUserId;
          if (owner != null) timerOwnerId = String(owner);
        }
      } catch {
        timerOwnerId = undefined;
      }
      return {
        ...ev,
        changedByUser: this.userRef(ev.changedBy, usersById),
        timerOwnerUser: this.userRef(timerOwnerId, usersById),
      };
    });
  }

  async adjustOrderTimer(
    orderId: string,
    timerId: string,
    body: { totalDurationMs?: number; note?: string },
    req: Request,
  ): Promise<{ code: number; message?: string; data?: OrderTimer }> {
    try {
      await this.assertCanAccessOrder(orderId, req);
      if (body?.totalDurationMs == null || Number.isNaN(Number(body.totalDurationMs))) {
        return { code: 400, message: 'totalDurationMs is required (milliseconds)' };
      }
      const nextMs = Math.floor(Number(body.totalDurationMs));
      if (nextMs < 0) {
        return { code: 400, message: 'totalDurationMs must be non-negative' };
      }
      const MAX_MS = 14 * 24 * 60 * 60 * 1000;
      if (nextMs > MAX_MS) {
        return { code: 400, message: 'totalDurationMs exceeds allowed maximum' };
      }

      const timer = await this.orderTimerRepository.findOne({
        where: { id: timerId, orderId },
      });
      if (!timer) {
        return { code: 404, message: 'Timer not found' };
      }
      if (timer.isRunning) {
        return { code: 400, message: 'Stop the timer before adjusting duration' };
      }
      if (timer.status !== 'Completed') {
        return { code: 400, message: 'Only completed timers can be adjusted' };
      }

      const oldTotal = timer.totalDuration != null ? Number(timer.totalDuration) : null;
      timer.totalDuration = nextMs;
      const saved = await this.orderTimerRepository.save(timer);
      const changedBy = this.tryGetUserIdFromRequest(req);
      await this.logOrderTimerEvent(orderId, saved.id, 'adjusted', changedBy, {
        triggeredByUserId: changedBy ?? null,
        timerUserId: String(saved.userId || ''),
        timerOwnerUserId: String(saved.userId || ''),
        oldTotalDurationMs: oldTotal,
        newTotalDurationMs: saved.totalDuration != null ? Number(saved.totalDuration) : null,
        note: body.note?.trim() || undefined,
        serviceLineIndex: saved.serviceLineIndex,
      });
      return { code: 200, data: saved };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async clearOrderTimers(
    orderId: string,
    req: Request,
  ): Promise<{ code: number; message?: string; data?: { deletedCount: number } }> {
    try {
      await this.assertCanAccessOrder(orderId, req);
      this.assertTimerClearAllowedByRole(req);

      const existing = await this.orderTimerRepository.find({
        where: { orderId },
        order: { startTime: 'ASC' },
      });

      const changedBy = this.tryGetUserIdFromRequest(req);
      const requester = this.getRequesterFromReq(req);

      if (existing.length > 0) {
        await this.orderTimerRepository.delete({ orderId });
      }

      const deletedIds = existing.map((t) => t.id);
      await this.logOrderTimerEvent(orderId, null, 'cleared', changedBy, {
        workOrderId: orderId,
        orderId,
        clearedAt: new Date().toISOString(),
        clearedByUserId: changedBy ?? null,
        clearedByRole: requester.role,
        deletedCount: existing.length,
        removedTimerIds: deletedIds.slice(0, 200),
      });

      return { code: 200, data: { deletedCount: existing.length } };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getAllTimers(req: Request) {
    this.assertGlobalTimersRead(req);
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