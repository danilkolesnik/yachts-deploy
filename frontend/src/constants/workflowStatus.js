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

export const ARCHIVE_TABS = [
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'archived', label: 'Archived' },
    { id: 'changes', label: 'Change history' },
];

const ARCHIVE_STATUS_MAP = {
    offers: {
        completed: COMPLETED_OFFER_STATUSES,
        cancelled: CANCELLED_OFFER_STATUSES,
        archived: ARCHIVED_OFFER_STATUSES,
    },
    orders: {
        completed: COMPLETED_ORDER_STATUSES,
        cancelled: CANCELLED_ORDER_STATUSES,
        archived: ARCHIVED_ORDER_STATUSES,
    },
};

const ORDER_STATUS_ALIASES = {
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

const OFFER_STATUS_ALIASES = {
    Created: 'created',
    Sent: 'sent',
    Discussing: 'discussing',
    Confirmed: 'confirmed',
    Finished: 'finished',
    Closed: 'closed',
    Canceled: 'canceled',
    Cancelled: 'canceled',
};

export function normalizeOrderStatus(status) {
    if (status == null || status === '') return '';
    const raw = String(status).trim();
    if (ORDER_STATUS_ALIASES[raw]) return ORDER_STATUS_ALIASES[raw];
    return raw.toLowerCase().replace(/_/g, '-');
}

export function normalizeOfferStatus(status) {
    if (status == null || status === '') return '';
    const raw = String(status).trim();
    if (OFFER_STATUS_ALIASES[raw]) return OFFER_STATUS_ALIASES[raw];
    return raw.toLowerCase().replace(/_/g, '-');
}

export function isActiveOfferStatus(status) {
    return ACTIVE_OFFER_STATUSES.includes(normalizeOfferStatus(status));
}

export function isActiveOrderStatus(status) {
    return ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));
}

export function getArchiveStatuses(entity, tab) {
    return ARCHIVE_STATUS_MAP[entity]?.[tab] || [];
}

export function matchesArchiveTab(status, entity, tab) {
    const normalized =
        entity === 'orders'
            ? normalizeOrderStatus(status)
            : normalizeOfferStatus(status);
    return getArchiveStatuses(entity, tab).includes(normalized);
}
