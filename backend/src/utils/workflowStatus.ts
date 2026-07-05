export type WorkflowBucket = 'active' | 'completed' | 'cancelled' | 'archived' | 'all';

export const ACTIVE_OFFER_STATUSES = ['created', 'sent', 'discussing', 'confirmed'];
export const COMPLETED_OFFER_STATUSES = ['finished', 'completed'];
export const CANCELLED_OFFER_STATUSES = ['canceled'];
export const ARCHIVED_OFFER_STATUSES = ['closed'];

export const ACTIVE_ORDER_STATUSES = [
  'created',
  'confirmed',
  'in-progress',
  'waiting',
  'awaiting-approval',
];
export const COMPLETED_ORDER_STATUSES = ['completed', 'finished'];
export const CANCELLED_ORDER_STATUSES = ['canceled'];
export const ARCHIVED_ORDER_STATUSES = ['closed'];

const ORDER_STATUS_ALIASES: Record<string, string> = {
  Created: 'created',
  Confirmed: 'confirmed',
  'In Progress': 'in-progress',
  in_progress: 'in-progress',
  Waiting: 'waiting',
  'Awaiting Approval': 'awaiting-approval',
  awaiting_approval: 'awaiting-approval',
  Completed: 'completed',
  Finished: 'finished',
  Closed: 'closed',
  Canceled: 'canceled',
  Cancelled: 'canceled',
};

const OFFER_STATUS_ALIASES: Record<string, string> = {
  Created: 'created',
  Sent: 'sent',
  Discussing: 'discussing',
  Confirmed: 'confirmed',
  Finished: 'finished',
  Completed: 'completed',
  Closed: 'closed',
  Canceled: 'canceled',
  Cancelled: 'canceled',
};

export function normalizeOrderStatus(status: unknown): string {
  if (status == null || status === '') return '';
  const raw = String(status).trim();
  if (ORDER_STATUS_ALIASES[raw]) return ORDER_STATUS_ALIASES[raw];
  return raw.toLowerCase().replace(/_/g, '-');
}

export function normalizeOfferStatus(status: unknown): string {
  if (status == null || status === '') return '';
  const raw = String(status).trim();
  if (OFFER_STATUS_ALIASES[raw]) return OFFER_STATUS_ALIASES[raw];
  return raw.toLowerCase().replace(/_/g, '-');
}

export function resolveWorkflowBucket(query?: unknown): WorkflowBucket {
  const value = String(query ?? 'active').trim().toLowerCase();
  if (value === 'active' || value === 'completed' || value === 'cancelled' || value === 'archived' || value === 'all') {
    return value;
  }
  return 'active';
}

export function getOfferStatusesForBucket(bucket: WorkflowBucket): string[] | null {
  switch (bucket) {
    case 'active':
      return ACTIVE_OFFER_STATUSES;
    case 'completed':
      return COMPLETED_OFFER_STATUSES;
    case 'cancelled':
      return CANCELLED_OFFER_STATUSES;
    case 'archived':
      return ARCHIVED_OFFER_STATUSES;
    default:
      return null;
  }
}

export function getOrderStatusesForBucket(bucket: WorkflowBucket): string[] | null {
  switch (bucket) {
    case 'active':
      return ACTIVE_ORDER_STATUSES;
    case 'completed':
      return COMPLETED_ORDER_STATUSES;
    case 'cancelled':
      return CANCELLED_ORDER_STATUSES;
    case 'archived':
      return ARCHIVED_ORDER_STATUSES;
    default:
      return null;
  }
}

export function filterOffersByBucket<T extends { status?: string }>(
  offers: T[],
  bucket: WorkflowBucket,
): T[] {
  const statuses = getOfferStatusesForBucket(bucket);
  if (!statuses) return offers;
  return offers.filter((offer) =>
    statuses.includes(normalizeOfferStatus(offer.status)),
  );
}

export function filterOrdersByBucket<T extends { status?: string }>(
  orders: T[],
  bucket: WorkflowBucket,
): T[] {
  const statuses = getOrderStatusesForBucket(bucket);
  if (!statuses) return orders;
  return orders.filter((order) =>
    statuses.includes(normalizeOrderStatus(order.status)),
  );
}
