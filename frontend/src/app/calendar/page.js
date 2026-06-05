"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Select, Option } from '@material-tailwind/react';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import { URL } from '@/utils/constants';

const TaskCalendar = dynamic(() => import('@/component/calendar/TaskCalendar'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center py-16">
            <Loader loading />
        </div>
    ),
});
import { statusStyles } from '@/utils/statusStyles';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import {
    buildCalendarTasks,
    filterCalendarTasks,
    formatDateKeyLabel,
    getOfferStatusOptions,
    getOrderStatusOptions,
    getUniqueFilterOptions,
    groupTasksByDate,
    isFieldWorkerRole,
    parseDateKey,
    tasksToCalendarEvents,
    toDateKey,
} from '@/utils/calendarTasks';

const StatusBadge = ({ status }) => (
    <span
        style={{
            ...(statusStyles[status] || { backgroundColor: '#e5e7eb', color: '#111' }),
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
        }}
    >
        {status}
    </span>
);

const TaskCard = ({ task }) => (
    <Link
        href={task.href}
        className="block border border-gray-200 rounded-lg p-4 bg-white hover:border-[#dd3333] hover:shadow-sm transition-all"
    >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-semibold text-black">{task.label}</span>
            <div className="flex items-center gap-2">
                <span
                    className={`text-xs px-2 py-0.5 rounded ${
                        task.type === 'offer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                    }`}
                >
                    {task.type === 'offer' ? 'Offer' : 'Work order'}
                </span>
                <StatusBadge status={task.status} />
            </div>
        </div>
        <div className="text-sm text-gray-700 space-y-1">
            {task.customer && (
                <p>
                    <span className="font-medium text-gray-900">Client:</span> {task.customer}
                </p>
            )}
            {task.yacht && (
                <p>
                    <span className="font-medium text-gray-900">Yacht:</span> {task.yacht}
                </p>
            )}
            {task.workers.length > 0 && (
                <p>
                    <span className="font-medium text-gray-900">Workers:</span>{' '}
                    {task.workers.map((w) => w.fullName).join(', ')}
                </p>
            )}
        </div>
    </Link>
);

const CalendarPage = () => {
    const router = useRouter();
    const session = useAppSelector((s) => s.userData?.session);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const userId = useAppSelector((s) => s.userData?.id);
    const role =
        useAppSelector((s) => s.userData?.role) ||
        (typeof window !== 'undefined' ? localStorage.getItem('role') : '');

    const canReadOffers = can(permissions, PermissionsList.OFFERS_READ);
    const canReadOrders = can(permissions, PermissionsList.ORDERS_READ);
    const canFilterByEmployee =
        can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE) ||
        ['admin', 'manager'].includes(String(role || '').toLowerCase());

    const now = new Date();
    const [calendarDate, setCalendarDate] = useState(now);
    const [selectedDate, setSelectedDate] = useState(toDateKey(now));

    const [offers, setOffers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    const defaultEntity = canReadOffers && canReadOrders
        ? 'all'
        : canReadOrders
          ? 'orders'
          : 'offers';

    const [filters, setFilters] = useState({
        entity: defaultEntity,
        status: '',
        client: '',
        yacht: '',
        employee: isFieldWorkerRole(role) ? String(userId || '') : '',
    });

    useEffect(() => {
        if (session !== true) return;
        if (role === 'client') {
            router.replace('/client/orders');
            return;
        }
        if (!canReadOffers && !canReadOrders) {
            const landing = can(permissions, PermissionsList.USERS_READ) ? '/yachts' : '/login';
            router.replace(landing);
        }
    }, [session, role, permissions, router, canReadOffers, canReadOrders]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const requests = [];

            if (canReadOffers) {
                requests.push(
                    axios.get(`${URL}/offer`, { headers }).then((res) => {
                        setOffers(res.data?.data || []);
                    }),
                );
            } else {
                setOffers([]);
            }

            if (canReadOrders) {
                requests.push(
                    axios.get(`${URL}/orders`, { headers }).then((res) => {
                        setOrders(res.data?.data || []);
                    }),
                );
            } else {
                setOrders([]);
            }

            if (canFilterByEmployee) {
                requests.push(
                    axios.get(`${URL}/users/role/worker`, { headers }).then((res) => {
                        setWorkers(res.data?.data || res.data || []);
                    }).catch(() => setWorkers([])),
                );
            }

            await Promise.all(requests);
        } catch (error) {
            console.error('Error loading calendar data:', error);
        } finally {
            setLoading(false);
        }
    }, [canReadOffers, canReadOrders, canFilterByEmployee]);

    useEffect(() => {
        if (session === true && (canReadOffers || canReadOrders)) {
            fetchData();
        }
    }, [session, canReadOffers, canReadOrders, fetchData]);

    useEffect(() => {
        if (isFieldWorkerRole(role) && userId && !filters.employee) {
            setFilters((prev) => ({ ...prev, employee: String(userId) }));
        }
    }, [role, userId, filters.employee]);

    const allTasks = useMemo(
        () =>
            buildCalendarTasks(offers, orders, {
                includeOffers: canReadOffers,
                includeOrders: canReadOrders,
            }),
        [offers, orders, canReadOffers, canReadOrders],
    );

    const filteredTasks = useMemo(
        () => filterCalendarTasks(allTasks, filters),
        [allTasks, filters],
    );

    const tasksByDate = useMemo(
        () => groupTasksByDate(filteredTasks),
        [filteredTasks],
    );

    const calendarEvents = useMemo(
        () => tasksToCalendarEvents(filteredTasks),
        [filteredTasks],
    );

    const filterOptions = useMemo(
        () => getUniqueFilterOptions(allTasks),
        [allTasks],
    );

    const statusOptions = useMemo(() => {
        if (filters.entity === 'offers') return getOfferStatusOptions();
        if (filters.entity === 'orders') return getOrderStatusOptions();
        return [...new Set([...getOfferStatusOptions(), ...getOrderStatusOptions()])];
    }, [filters.entity]);

    const workerOptions = useMemo(() => {
        if (workers.length > 0) return workers;
        const fromOrders = new Map();
        for (const order of orders) {
            for (const w of order.assignedWorkers || []) {
                fromOrders.set(w.id, w);
            }
        }
        return [...fromOrders.values()];
    }, [workers, orders]);

    const selectedDayTasks = tasksByDate[selectedDate] || [];

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectDate = (dateKey) => {
        if (!dateKey) return;
        setSelectedDate(dateKey);
        const parsed = parseDateKey(dateKey);
        if (parsed) setCalendarDate(parsed);
    };

    const resetFilters = () => {
        setFilters({
            entity: defaultEntity,
            status: '',
            client: '',
            yacht: '',
            employee: isFieldWorkerRole(role) ? String(userId || '') : '',
        });
    };

    if (session !== true) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="p-4 md:p-8 font-sans">
                <div className="w-full space-y-6">
                    <div className="bg-white rounded shadow-md p-4 md:p-6">
                        <h1 className="text-2xl font-bold text-black mb-1">Calendar</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Active offers and work orders by date. Select a day to view tasks.
                            {isFieldWorkerRole(role) && ' Showing your assigned work orders by default.'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                            {canReadOffers && canReadOrders && (
                                <Select
                                    label="Type"
                                    value={filters.entity}
                                    onChange={(value) => handleFilterChange('entity', value)}
                                    className="text-black"
                                    labelProps={{ className: 'text-black' }}
                                >
                                    <Option value="all" className="text-black">All</Option>
                                    <Option value="offers" className="text-black">Offers</Option>
                                    <Option value="orders" className="text-black">Work orders</Option>
                                </Select>
                            )}

                            <Select
                                label="Status"
                                value={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                                className="text-black"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option value="" className="text-black">All statuses</Option>
                                {statusOptions.map((status) => (
                                    <Option key={status} value={status} className="text-black">
                                        {status}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                label="Client"
                                value={filters.client}
                                onChange={(value) => handleFilterChange('client', value)}
                                className="text-black"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option value="" className="text-black">All clients</Option>
                                {filterOptions.clients.map((client) => (
                                    <Option key={client} value={client} className="text-black">
                                        {client}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                label="Yacht"
                                value={filters.yacht}
                                onChange={(value) => handleFilterChange('yacht', value)}
                                className="text-black"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option value="" className="text-black">All yachts</Option>
                                {filterOptions.yachts.map((yacht) => (
                                    <Option key={yacht} value={yacht} className="text-black">
                                        {yacht}
                                    </Option>
                                ))}
                            </Select>

                            {canReadOrders && (canFilterByEmployee || isFieldWorkerRole(role)) && (
                                <Select
                                    label="Employee"
                                    value={filters.employee}
                                    onChange={(value) => handleFilterChange('employee', value)}
                                    className="text-black"
                                    labelProps={{ className: 'text-black' }}
                                    disabled={isFieldWorkerRole(role) && !canFilterByEmployee}
                                >
                                    {!isFieldWorkerRole(role) && (
                                        <Option value="" className="text-black">All employees</Option>
                                    )}
                                    {isFieldWorkerRole(role) && userId && (
                                        <Option value={String(userId)} className="text-black">
                                            My tasks
                                        </Option>
                                    )}
                                    {canFilterByEmployee &&
                                        workerOptions.map((worker) => (
                                            <Option
                                                key={worker.id}
                                                value={String(worker.id)}
                                                className="text-black"
                                            >
                                                {worker.fullName}
                                            </Option>
                                        ))}
                                </Select>
                            )}

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-10 mt-6 md:mt-0 px-4 border border-gray-300 rounded-md text-sm text-black hover:bg-gray-50 self-end"
                            >
                                Reset filters
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader loading />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className="xl:col-span-2">
                                    <TaskCalendar
                                        events={calendarEvents}
                                        calendarDate={calendarDate}
                                        onNavigate={setCalendarDate}
                                        onSelectDate={handleSelectDate}
                                    />
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h2 className="text-lg font-semibold text-black mb-1">
                                        {formatDateKeyLabel(selectedDate)}
                                    </h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {selectedDayTasks.length} task
                                        {selectedDayTasks.length !== 1 ? 's' : ''}
                                    </p>

                                    {selectedDayTasks.length === 0 ? (
                                        <p className="text-sm text-gray-500 py-8 text-center">
                                            No tasks for this date with current filters.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                            {selectedDayTasks.map((task) => (
                                                <TaskCard key={task.id} task={task} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
