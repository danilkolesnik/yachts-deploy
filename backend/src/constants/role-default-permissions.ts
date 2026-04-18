import { PermissionsList } from './permissions';

/**
 * Default capability sets per static role. Admins use '*' elsewhere.
 * Individual overrides live on `EmployeeProfile.permissions`.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  manager: [
    PermissionsList.OFFERS_READ,
    PermissionsList.ORDERS_READ,
    PermissionsList.ORDERS_CREATE,
    PermissionsList.ORDERS_UPDATE,
    PermissionsList.ORDERS_MATERIALS_ADD,
    PermissionsList.ORDERS_STATUS_CHANGE,
    PermissionsList.ORDERS_ASSIGNMENT_MANAGE,
    PermissionsList.ORDERS_MEDIA_ADD,
    PermissionsList.ORDERS_MEDIA_DELETE,
    PermissionsList.ORDERS_COMMENT_ADD,
    PermissionsList.ORDERS_TIMER_USE,
    PermissionsList.ORDERS_TIMER_STOP,
    PermissionsList.ORDERS_TIMERS_GLOBAL_READ,
    PermissionsList.ORDERS_DELETE,
    PermissionsList.ORDERS_OFFER_CLOSE,
    PermissionsList.USERS_READ,
    PermissionsList.USERS_MANAGE,
    PermissionsList.USERS_PERMISSIONS_MANAGE,
    PermissionsList.USERS_AUDIT_READ,
  ],
  mechanic: [
    PermissionsList.ORDERS_READ,
    PermissionsList.ORDERS_UPDATE,
    PermissionsList.ORDERS_MATERIALS_ADD,
    PermissionsList.ORDERS_STATUS_CHANGE,
    PermissionsList.ORDERS_MEDIA_ADD,
    PermissionsList.ORDERS_MEDIA_DELETE,
    PermissionsList.ORDERS_COMMENT_ADD,
    PermissionsList.ORDERS_TIMER_USE,
  ],
  electrician: [
    PermissionsList.ORDERS_READ,
    PermissionsList.ORDERS_UPDATE,
    PermissionsList.ORDERS_MATERIALS_ADD,
    PermissionsList.ORDERS_STATUS_CHANGE,
    PermissionsList.ORDERS_MEDIA_ADD,
    PermissionsList.ORDERS_MEDIA_DELETE,
    PermissionsList.ORDERS_COMMENT_ADD,
    PermissionsList.ORDERS_TIMER_USE,
  ],
  user: [
    PermissionsList.OFFERS_READ,
    PermissionsList.ORDERS_READ,
    PermissionsList.SELF_OFFERS_READ,
    PermissionsList.SELF_ORDERS_READ,
  ],
  client: [PermissionsList.SELF_OFFERS_READ, PermissionsList.SELF_ORDERS_READ],
};
