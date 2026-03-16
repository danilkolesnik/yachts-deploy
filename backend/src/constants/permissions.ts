export const PermissionsList = {
  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_STATUS_CHANGE: 'orders.status.change',
  ORDERS_ASSIGNMENT_MANAGE: 'orders.assignment.manage',
  ORDERS_MEDIA_ADD: 'orders.media.add',
  ORDERS_MEDIA_DELETE: 'orders.media.delete',
  ORDERS_COMMENT_ADD: 'orders.comment.add',

  // Self-access for clients
  SELF_OFFERS_READ: 'self.offers.read',
  SELF_ORDERS_READ: 'self.orders.read',
} as const;

export type PermissionCode = (typeof PermissionsList)[keyof typeof PermissionsList] | '*';

