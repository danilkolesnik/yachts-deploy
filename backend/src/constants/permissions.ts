export const PermissionsList = {
  OFFERS_READ: 'offers.read',

  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_MATERIALS_ADD: 'orders.materials.add',
  ORDERS_STATUS_CHANGE: 'orders.status.change',
  ORDERS_ASSIGNMENT_MANAGE: 'orders.assignment.manage',
  ORDERS_MEDIA_ADD: 'orders.media.add',
  ORDERS_MEDIA_DELETE: 'orders.media.delete',
  ORDERS_COMMENT_ADD: 'orders.comment.add',
  ORDERS_TIMER_USE: 'orders.timer.use',
  ORDERS_TIMER_STOP: 'orders.timer.stop',
  ORDERS_TIMERS_GLOBAL_READ: 'orders.timers.global.read',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_OFFER_CLOSE: 'orders.offer.close',

  // Users / employees / permissions
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage', // create/update/delete users, assign roles
  USERS_PERMISSIONS_MANAGE: 'users.permissions.manage', // edit responsibility & permission overrides
  USERS_AUDIT_READ: 'users.audit.read', // view history/audit

  // Self-access for clients (portal `/client`, API `/orders/client/*`)
  SELF_OFFERS_READ: 'self.offers.read',
  SELF_ORDERS_READ: 'self.orders.read',
  /** Client portal: post comments / additional-work on own orders */
  SELF_ORDERS_MESSAGES_WRITE: 'self.orders.messages.write',
} as const;

export type PermissionCode = (typeof PermissionsList)[keyof typeof PermissionsList] | '*';

