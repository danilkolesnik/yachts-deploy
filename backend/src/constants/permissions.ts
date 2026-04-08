export const PermissionsList = {
  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_STATUS_CHANGE: 'orders.status.change',
  ORDERS_ASSIGNMENT_MANAGE: 'orders.assignment.manage',
  ORDERS_MEDIA_ADD: 'orders.media.add',
  ORDERS_MEDIA_DELETE: 'orders.media.delete',
  ORDERS_COMMENT_ADD: 'orders.comment.add',

  // Users / employees / permissions
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage', // create/update/delete users, assign roles
  USERS_PERMISSIONS_MANAGE: 'users.permissions.manage', // edit responsibility & permission overrides
  USERS_AUDIT_READ: 'users.audit.read', // view history/audit

  // Self-access for clients
  SELF_OFFERS_READ: 'self.offers.read',
  SELF_ORDERS_READ: 'self.orders.read',
} as const;

export type PermissionCode = (typeof PermissionsList)[keyof typeof PermissionsList] | '*';

