import {
    ACTIVE_OFFER_STATUSES,
    ACTIVE_ORDER_STATUSES,
    isActiveOfferStatus,
    isActiveOrderStatus,
} from '@/constants/workflowStatus';

export function toDateKey(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function parseDateKey(dateKey) {
    if (!dateKey) return null;
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

export function formatDateKeyLabel(dateKey) {
    const d = parseDateKey(dateKey);
    if (!d) return dateKey || '';
    return d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function getYachtNameFromOffer(offer) {
    if (!offer) return '';
    if (offer.yachtName) return offer.yachtName;
    if (Array.isArray(offer.yachts) && offer.yachts.length > 0) {
        return offer.yachts.map((y) => y.name).filter(Boolean).join(', ');
    }
    return '';
}

export function buildCalendarTasks(offers = [], orders = [], options = {}) {
    const { includeOffers = true, includeOrders = true } = options;
    const tasks = [];

    if (includeOffers) {
        for (const offer of offers) {
            if (!isActiveOfferStatus(offer.status)) continue;
            const dateKey = toDateKey(offer.createdAt);
            if (!dateKey) continue;
            tasks.push({
                id: `offer-${offer.id}`,
                sourceId: offer.id,
                type: 'offer',
                dateKey,
                status: offer.status,
                customer: offer.customerFullName || '',
                yacht: getYachtNameFromOffer(offer),
                workers: [],
                label: `Offer ${offer.id}`,
                href: `/offers/${offer.id}`,
            });
        }
    }

    if (includeOrders) {
        for (const order of orders) {
            if (!isActiveOrderStatus(order.status)) continue;
            const dateKey = toDateKey(order.startedAt || order.createdAt);
            if (!dateKey) continue;
            tasks.push({
                id: `order-${order.id}`,
                sourceId: order.id,
                type: 'order',
                dateKey,
                status: order.status,
                customer: order.offer?.customerFullName || '',
                yacht: getYachtNameFromOffer(order.offer),
                workers: (order.assignedWorkers || []).map((w) => ({
                    id: w.id,
                    fullName: w.fullName,
                })),
                label: `Work order ${order.offerId || order.offer?.id || order.id}`,
                href: `/orders/${order.id}`,
            });
        }
    }

    return tasks;
}

export function filterCalendarTasks(tasks, filters = {}) {
    const {
        entity = 'all',
        status = '',
        client = '',
        yacht = '',
        employee = '',
    } = filters;

    return tasks.filter((task) => {
        if (entity === 'offers' && task.type !== 'offer') return false;
        if (entity === 'orders' && task.type !== 'order') return false;
        if (status && task.status !== status) return false;
        if (client && task.customer !== client) return false;
        if (yacht && task.yacht !== yacht) return false;
        if (employee) {
            if (task.type !== 'order') return false;
            return task.workers.some((w) => String(w.id) === String(employee));
        }
        return true;
    });
}

export function groupTasksByDate(tasks) {
    const map = {};
    for (const task of tasks) {
        if (!map[task.dateKey]) map[task.dateKey] = [];
        map[task.dateKey].push(task);
    }
    for (const key of Object.keys(map)) {
        map[key].sort((a, b) => a.label.localeCompare(b.label));
    }
    return map;
}

export function getUniqueFilterOptions(tasks) {
    const clients = new Set();
    const yachts = new Set();
    const statuses = new Set();

    for (const task of tasks) {
        if (task.customer) clients.add(task.customer);
        if (task.yacht) yachts.add(task.yacht);
        if (task.status) statuses.add(task.status);
    }

    return {
        clients: [...clients].sort((a, b) => a.localeCompare(b)),
        yachts: [...yachts].sort((a, b) => a.localeCompare(b)),
        statuses: [...statuses].sort((a, b) => a.localeCompare(b)),
    };
}

export function getOfferStatusOptions() {
    return ACTIVE_OFFER_STATUSES;
}

export function getOrderStatusOptions() {
    return ACTIVE_ORDER_STATUSES;
}

export function isFieldWorkerRole(role) {
    return ['mechanic', 'electrician'].includes(String(role || '').toLowerCase());
}

export function tasksToCalendarEvents(tasks = []) {
    return tasks
        .map((task) => {
            const start = parseDateKey(task.dateKey);
            if (!start) return null;

            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const prefix = task.type === 'offer' ? 'Offer' : 'ZN';
            const title = task.customer
                ? `${prefix}: ${task.customer}`
                : task.label;

            return {
                id: task.id,
                title,
                start,
                end,
                allDay: true,
                resource: task,
            };
        })
        .filter(Boolean);
}
