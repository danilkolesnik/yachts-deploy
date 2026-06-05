"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@material-tailwind/react';
import Link from 'next/link';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import { URL } from '@/utils/constants';
import { statusStyles } from '@/utils/statusStyles';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import {
    ARCHIVE_TABS,
    matchesArchiveTab,
} from '@/constants/workflowStatus';

const StatusBadge = ({ status }) => (
    <span
        style={{
            ...(statusStyles[status] || {}),
            padding: '5px 10px',
            borderRadius: '5px',
        }}
    >
        {status}
    </span>
);

const ArchivePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useAppSelector((s) => s.userData?.session);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const role = useAppSelector((s) => s.userData?.role) || (typeof window !== 'undefined' ? localStorage.getItem('role') : '');

    const tabParam = searchParams.get('tab') || 'completed';
    const entityParam = searchParams.get('entity') || 'offers';

    const [activeTab, setActiveTab] = useState(
        ARCHIVE_TABS.some((t) => t.id === tabParam) ? tabParam : 'completed',
    );
    const [activeEntity, setActiveEntity] = useState(
        entityParam === 'orders' ? 'orders' : 'offers',
    );
    const [offers, setOffers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [changeHistory, setChangeHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');

    const canReadOffers = can(permissions, PermissionsList.OFFERS_READ);
    const canReadOrders = can(permissions, PermissionsList.ORDERS_READ);

    useEffect(() => {
        if (session !== true) return;
        if (role === 'client') {
            router.replace('/client/orders');
            return;
        }
        if (!canReadOffers && !canReadOrders) {
            const landing =
                can(permissions, PermissionsList.USERS_READ) ? '/yachts' : '/login';
            router.replace(landing);
        }
    }, [session, role, permissions, router, canReadOffers, canReadOrders]);

    useEffect(() => {
        const tab = ARCHIVE_TABS.some((t) => t.id === tabParam) ? tabParam : 'completed';
        setActiveTab(tab);
    }, [tabParam]);

    useEffect(() => {
        setActiveEntity(entityParam === 'orders' ? 'orders' : 'offers');
    }, [entityParam]);

    const updateUrl = useCallback(
        (tab, entity) => {
            const params = new URLSearchParams();
            params.set('tab', tab);
            if (tab !== 'changes') {
                params.set('entity', entity);
            }
            router.replace(`/archive?${params.toString()}`);
        },
        [router],
    );

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        updateUrl(tab, activeEntity);
    };

    const handleEntityChange = (entity) => {
        setActiveEntity(entity);
        updateUrl(activeTab, entity);
    };

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

            if (canReadOffers) {
                requests.push(
                    axios.get(`${URL}/offer/changes/history`, { headers }).then((res) => {
                        setChangeHistory(res.data?.data || []);
                    }),
                );
            } else {
                setChangeHistory([]);
            }

            await Promise.all(requests);
        } catch (error) {
            console.error('Error loading archive data:', error);
        } finally {
            setLoading(false);
        }
    }, [canReadOffers, canReadOrders]);

    useEffect(() => {
        if (session === true && (canReadOffers || canReadOrders)) {
            fetchData();
        }
    }, [session, canReadOffers, canReadOrders, fetchData]);

    useEffect(() => {
        if (!canReadOffers && canReadOrders && activeEntity === 'offers') {
            handleEntityChange('orders');
        }
        if (canReadOffers && !canReadOrders && activeEntity === 'orders') {
            handleEntityChange('offers');
        }
    }, [canReadOffers, canReadOrders, activeEntity]);

    const filteredOffers = useMemo(() => {
        const search = searchValue.trim().toLowerCase();
        return offers.filter((offer) => {
            if (!matchesArchiveTab(offer.status, 'offers', activeTab)) return false;
            if (!search) return true;
            return (
                String(offer.id).includes(search) ||
                offer.customerFullName?.toLowerCase().includes(search) ||
                offer.yachtName?.toLowerCase().includes(search)
            );
        });
    }, [offers, activeTab, searchValue]);

    const filteredOrders = useMemo(() => {
        const search = searchValue.trim().toLowerCase();
        return orders.filter((order) => {
            if (!matchesArchiveTab(order.status, 'orders', activeTab)) return false;
            if (!search) return true;
            return (
                String(order.id).includes(search) ||
                order.offer?.customerFullName?.toLowerCase().includes(search) ||
                order.offer?.yachtName?.toLowerCase().includes(search)
            );
        });
    }, [orders, activeTab, searchValue]);

    const filteredChanges = useMemo(() => {
        const search = searchValue.trim().toLowerCase();
        if (!search) return changeHistory;
        return changeHistory.filter((entry) => {
            const changesText = (entry.changes || [])
                .map((c) => c.summary || c.fieldLabel || c.field)
                .join(' ')
                .toLowerCase();
            return (
                String(entry.offerId).includes(search) ||
                entry.offerCustomer?.toLowerCase().includes(search) ||
                entry.author?.fullName?.toLowerCase().includes(search) ||
                changesText.includes(search)
            );
        });
    }, [changeHistory, searchValue]);

    const offerColumns = [
        {
            name: 'ID',
            selector: (row) => row.id,
            sortable: true,
            cell: (row) => (
                <Link href={`/offers/${row.id}`} className="text-blue-600 hover:underline">
                    {row.id}
                </Link>
            ),
        },
        {
            name: 'Date',
            selector: (row) => row.createdAt,
            sortable: true,
            cell: (row) => new Date(row.createdAt).toLocaleString(),
        },
        {
            name: 'Customer',
            selector: (row) => row.customerFullName || '',
            sortable: true,
        },
        {
            name: 'Yacht',
            selector: (row) => row.yachtName || '',
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row) => row.status,
            sortable: true,
            cell: (row) => <StatusBadge status={row.status} />,
        },
    ];

    const orderColumns = [
        {
            name: 'Order #',
            selector: (row) => row.id,
            sortable: true,
            cell: (row) => (
                <Link href={`/orders/${row.id}`} className="text-blue-600 hover:underline">
                    {row.id}
                </Link>
            ),
        },
        {
            name: 'Created',
            selector: (row) => row.createdAt,
            sortable: true,
            cell: (row) => new Date(row.createdAt).toLocaleString(),
        },
        {
            name: 'Customer',
            selector: (row) => row.offer?.customerFullName || '',
            sortable: true,
        },
        {
            name: 'Yacht',
            selector: (row) => row.offer?.yachtName || '',
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row) => row.status,
            sortable: true,
            cell: (row) => <StatusBadge status={row.status} />,
        },
    ];

    const changeColumns = [
        {
            name: 'Offer ID',
            selector: (row) => row.offerId,
            sortable: true,
            cell: (row) => (
                <Link href={`/offers/${row.offerId}`} className="text-blue-600 hover:underline">
                    {row.offerId}
                </Link>
            ),
        },
        {
            name: 'Customer',
            selector: (row) => row.offerCustomer || '',
            sortable: true,
        },
        {
            name: 'Date',
            selector: (row) => row.changedAt || row.changeDate,
            sortable: true,
            cell: (row) =>
                row.changedAt
                    ? new Date(row.changedAt).toLocaleDateString()
                    : row.changedDate
                      ? new Date(row.changedDate).toLocaleDateString()
                      : '—',
        },
        {
            name: 'Time',
            selector: (row) => row.changedTime || '',
            cell: (row) =>
                row.changedTime ||
                (row.changedAt ? new Date(row.changedAt).toLocaleTimeString() : '—'),
        },
        {
            name: 'Author',
            selector: (row) => row.author?.fullName || '',
            sortable: true,
        },
        {
            name: 'Changes',
            grow: 2,
            cell: (row) => {
                const items = row.changes || [];
                if (items.length === 0) return <span className="text-gray-500">—</span>;
                return (
                    <ul className="text-sm text-gray-800 list-disc list-inside py-1">
                        {items.map((c, idx) => (
                            <li key={`${row.id}-${c.field}-${idx}`}>
                                {c.summary ||
                                    `${c.fieldLabel || c.field}: ${String(c.oldValue ?? '—')} → ${String(c.newValue ?? '—')}`}
                            </li>
                        ))}
                    </ul>
                );
            },
        },
    ];

    const tableData =
        activeTab === 'changes'
            ? filteredChanges
            : activeEntity === 'orders'
              ? filteredOrders
              : filteredOffers;

    const tableColumns =
        activeTab === 'changes'
            ? changeColumns
            : activeEntity === 'orders'
              ? orderColumns
              : offerColumns;

    const tabTitle = ARCHIVE_TABS.find((t) => t.id === activeTab)?.label || 'Archive';
    const entityLabel = activeEntity === 'orders' ? 'work orders' : 'offers';

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
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <div className="bg-white rounded shadow-md p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-black">Archive &amp; History</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Completed, cancelled, and archived records. Active offers and work orders
                                remain on the main pages.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {canReadOffers && (
                                <Link href="/offers">
                                    <Button variant="outlined" className="border-gray-400 text-black">
                                        Active offers
                                    </Button>
                                </Link>
                            )}
                            {canReadOrders && (
                                <Link href="/orders">
                                    <Button variant="outlined" className="border-gray-400 text-black">
                                        Active orders
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b pb-4">
                        {ARCHIVE_TABS.map((tab) => {
                            const disabled =
                                tab.id === 'changes'
                                    ? !canReadOffers
                                    : !canReadOffers && !canReadOrders;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-[#dd3333] text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab !== 'changes' && canReadOffers && canReadOrders && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleEntityChange('offers')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeEntity === 'offers'
                                        ? 'bg-[#3e4a66] text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Offers
                            </button>
                            <button
                                type="button"
                                onClick={() => handleEntityChange('orders')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeEntity === 'orders'
                                        ? 'bg-[#3e4a66] text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Work orders
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            {activeTab === 'changes'
                                ? `${filteredChanges.length} change record(s)`
                                : `${tableData.length} ${entityLabel}`}
                            {' · '}
                            {tabTitle}
                        </p>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="border border-gray-300 px-3 py-2 text-gray-700 rounded-md w-full sm:w-64 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <DataTable
                        columns={tableColumns}
                        data={tableData}
                        progressPending={loading}
                        progressComponent={<Loader loading />}
                        pagination
                        highlightOnHover
                        responsive
                        noDataComponent={
                            <p className="py-8 text-gray-500">No records in this section.</p>
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default ArchivePage;
