"use client"
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Select, Option, Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import {
    ASSIGNMENT_CHANGE_REASONS,
    buildAssignmentChangeReason,
    shouldPromptAssignmentReason,
} from '@/constants/orderAssignment';
import { can } from '@/utils/canPermission';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { ClipLoader } from 'react-spinners';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Link from 'next/link';
import WorkTimer from '@/component/workTimer/workTimer';
import { workerTimerIndex } from '@/constants/orderTimer';
import { statusStyles } from '@/utils/statusStyles';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { downloadWorkOrderPdf } from '@/utils/exportWorkOrderPdf';
import { getOrderDocumentNumber } from '@/utils/documentNumbers';
import { toast } from 'react-toastify';
import ReactSelect from 'react-select';
import { isActiveOrderStatus, normalizeOrderStatus } from '@/constants/workflowStatus';

const OrderPage = () => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
        client: '',
        yacht: '',
        employee: '',
        searchCriteria: 'id',
        searchValue: ''
    });
    const [sortField, setSortField] = useState('urgencyLevel');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [workOrderPdfLoading, setWorkOrderPdfLoading] = useState({});
    const id = useAppSelector(state => state.userData?.id);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const role = useAppSelector((s) => s.userData?.role);
    const [editStatusModalIsOpen, setEditStatusModalIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusOptions, setStatusOptions] = useState(null);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const tableRef = useRef(null);
    const [editWorkersModalIsOpen, setEditWorkersModalIsOpen] = useState(false);
    const [assignmentReasonOpen, setAssignmentReasonOpen] = useState(false);
    const [assignmentReasonPreset, setAssignmentReasonPreset] = useState('');
    const [assignmentReasonOther, setAssignmentReasonOther] = useState('');
    const [assignmentError, setAssignmentError] = useState('');
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [selectedWorkersForEdit, setSelectedWorkersForEdit] = useState([]);
    const [timersModalOrder, setTimersModalOrder] = useState(null);
    const [clearTimersOpen, setClearTimersOpen] = useState(false);
    const [clearTimersOrderId, setClearTimersOrderId] = useState(null);
    const [clearTimersLoading, setClearTimersLoading] = useState(false);
    const [clearTimersConfirmed, setClearTimersConfirmed] = useState(false);
    const [timersRefreshKey, setTimersRefreshKey] = useState(0);

    const roleNormalized = String(role || '').toLowerCase();
    const canClearAllOrderTimers =
        can(permissions, PermissionsList.ORDERS_TIMER_CLEAR_ALL) &&
        ['admin', 'manager'].includes(roleNormalized);

    const openClearTimersConfirm = () => {
        if (!timersModalOrder) return;
        setClearTimersOrderId(timersModalOrder.id);
        setClearTimersConfirmed(false);
        setClearTimersOpen(true);
    };

    const confirmClearAllTimers = async () => {
        if (!clearTimersOrderId || !canClearAllOrderTimers || !clearTimersConfirmed) return;
        setClearTimersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${URL}/orders/${clearTimersOrderId}/timers/clear`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data?.code === 200) {
                setClearTimersOpen(false);
                setClearTimersOrderId(null);
                setClearTimersConfirmed(false);
                setTimersRefreshKey((k) => k + 1);
                const list = await fetchOrders();
                if (list && timersModalOrder) {
                    const updated = list.find((o) => o.id === timersModalOrder.id);
                    if (updated) setTimersModalOrder(updated);
                }
                toast.success('All timer data deleted for this order.');
            } else {
                toast.error(res.data?.message || 'Could not clear timers.');
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || error.message || 'Could not clear timers.',
            );
        } finally {
            setClearTimersLoading(false);
        }
    };

    // Manual/Help content in English
    const helpSections = {
        overview: {
            title: "Order Management System - User Manual",
            content: [
                "Welcome to the Order Management System! This system allows you to manage all work orders efficiently.",
                "Orders are created from confirmed offers and track the complete workflow from creation to completion.",
                "Use the 'Help' button for quick access to this manual at any time."
            ]
        },
        navigation: {
            title: "Understanding the Order Table",
            content: [
                "**Order Number** - Unique order ID, click to view detailed information",
                "**Creation Date** - Date and time when order was created",
                "**Customer** - Name of the customer who placed the order",
                "**Yacht** - Yacht name associated with the order",
                "**Responsible** - Assigned employee(s) for this order",
                "**Status** - Current workflow status (color-coded for quick identification)",
                "**Timers** — click **Open timers** to run or pause time per work line (or a single line if the order has no service list)",
                "**Actions** - Edit status or delete orders (admin only)"
            ]
        },
        statuses: {
            title: "Order Statuses Explained",
            content: [
                "**created** 🟡 - Order created but not yet started",
                "**confirmed** 🔵 - Order confirmed and ready to begin",
                "**canceled** 🔴 - Order has been cancelled",
                "**in-progress** 🟠 - Work on the order is currently active",
                "**waiting** 🟣 - Order is waiting for parts or information",
                "**awaiting-approval** 🟢 - Waiting for customer approval",
                "**completed** ✅ - All work has been finished",
                "**closed** ⚫ - Order is officially closed and archived"
            ]
        },
        filtering: {
            title: "Filtering and Searching Orders",
            content: [
                "**Search by:** Select what to search:",
                "• Yacht Name - Search by yacht name",
                "• Customer - Search by customer name",
                "• Worker - Search by assigned worker name",
                "",
                "**Search box:** Enter text to filter order list",
                "",
                "**Status filter:** Select specific status to view only those orders",
                "",
                "**Date filter:** Filter orders by creation date",
                "",
                "**Real-time filtering:** Results update automatically as you type or select filters"
            ]
        },
        actions: {
            title: "Available Actions on Orders",
            content: [
                "**Click on Order Number** - View complete order details and history",
                "",
                "**Edit Status (Pencil icon - Admin only):**",
                "1. Click the pencil icon in Actions column",
                "2. Select new status from dropdown",
                "3. Click Update to save changes",
                "",
                "**Delete Order (Trash icon - Admin only):**",
                "• Permanently removes the order",
                "• Use with caution - action cannot be undone",
                "",
                "**Work Timers:**",
                "• Click **Open timers** in the Timers column to open the timer panel for that order",
                "• One timer per service line (or one generic line if the order has no services yet)",
                "• Stopping a line timer does **not** auto-close the whole order (change status when all work is done)",
                "• Useful when different employees work on different lines",
            ]
        },
        workflow: {
            title: "Order Workflow Process",
            content: [
                "**Standard Workflow:**",
                "1. created → Order is created from confirmed offer",
                "2. confirmed → Order is reviewed and confirmed",
                "3. in-progress → Work has started on the order",
                "4. awaiting-approval → Waiting for customer review",
                "5. completed → All work is finished",
                "6. closed → Order is archived",
                "",
                "**Alternative Paths:**",
                "• waiting → Used when waiting for parts or information",
                "• canceled → If customer cancels the order",
                "",
                "**Best Practice:** Update status regularly to maintain accurate workflow tracking"
            ]
        },
        export: {
            title: "Exporting and Reporting",
            content: [
                "**Export to Excel:**",
                "• Click 'Export to Excel' button to download all filtered orders",
                "• Exports current view with applied filters",
                "• Includes all visible columns in the export",
                "",
                "**History View:**",
                "• Click 'History' button to view completed and closed orders",
                "• Useful for historical analysis and reporting",
                "",
                "**Data Usage:**",
                "• Export data for backup purposes",
                "• Use Excel data for billing and invoicing",
                "• Analyze productivity and workload distribution"
            ]
        },
        bestPractices: {
            title: "Best Practices for Order Management",
            content: [
                "**Status Management:**",
                "• Update status immediately when work state changes",
                "• Use 'waiting' status when awaiting parts or information",
                "• Mark orders as 'closed' only after final customer approval",
                "",
                "**Timer Usage:**",
                "• Start timers when work begins",
                "• Stop timers during breaks or waiting periods",
                "• Review timer data for accurate billing",
                "",
                "**Data Integrity:**",
                "• Regularly review and update order information",
                "• Keep customer and yacht information current",
                "• Use filters to manage workload effectively",
                "",
                "**Communication:**",
                "• Update status promptly to keep stakeholders informed",
                "• Use order details for internal communication",
                "• Document special instructions in order notes"
            ]
        }
    };

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${URL}/orders`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const code = response.data?.code;
            if (code !== undefined && code !== 200) {
                toast.error(response.data?.message || 'Failed to load orders');
                setOrders([]);
                return [];
            }
            const list = (response.data?.data || []).map((order) => ({
                ...order,
                status: normalizeOrderStatus(order.status),
            }));
            setOrders(list);
            return list;
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(error?.response?.data?.message || 'Failed to load orders');
            setOrders([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (value, name) => {
        if (name) {
            setFilters({ ...filters, [name]: value });
        } else {
            console.error('Name is not provided');
        }
    };

    const handleSortChange = (field) => {
        setSortField(field);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const filteredOrders = (orders || []).filter(order => {
        const orderDate = new Date(order.createdAt);
        const filterDate = filters.date ? new Date(filters.date) : null;
        const searchValue = filters.searchValue.toLowerCase();

        const matchesSearch = () => {
            switch(filters.searchCriteria) {
                case 'id':
                    return getOrderDocumentNumber(order).toLowerCase().includes(searchValue);
                case 'customer':
                    return order.offer?.customerFullName?.toLowerCase().includes(searchValue);
                case 'worker':
                    return order.assignedWorkers?.some(worker => 
                        worker.fullName.toLowerCase().includes(searchValue)
                    );
                default:
                    return true;
            }
        };

        const orderStatus = normalizeOrderStatus(order.status);

        return (
            isActiveOrderStatus(orderStatus) &&
            (filters.status ? orderStatus === filters.status : true) &&
            (filters.client ? order.offer && order.offer.customerFullName === filters.client : true) &&
            (filterDate ? orderDate.toDateString() === filterDate.toDateString() : true) &&
            (filters.searchValue ? matchesSearch() : true)
        );
    });

    const sortedOrders = filteredOrders.sort((a, b) => {
        if (sortField === 'status') {
            return sortOrder === 'asc' 
                ? a[sortField].localeCompare(b[sortField]) 
                : b[sortField].localeCompare(a[sortField]);
        }
        if (sortOrder === 'asc') {
            return a[sortField] - b[sortField];
        } else {
            return b[sortField] - a[sortField];
        }
    });

    const handleStatusEdit = (order) => {
        setSelectedOrder(order);
        setEditStatusModalIsOpen(true);
    };

    const closeEditStatusModal = () => {
        setEditStatusModalIsOpen(false)
    };

    const handleStatusChange = (value) => {
        if (selectedOrder) {
            setSelectedOrder({ ...selectedOrder, status: value });
            setStatusOptions(value);
        }
    };

    const updateOrderStatus = async () => {
        if (!selectedOrder) return;
        try {
            setLoadingUpdate(true);
            const token = localStorage.getItem('token');
            await axios.post(
                `${URL}/orders/${selectedOrder.id}/status`,
                { status: selectedOrder.status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            fetchOrders();
            closeEditStatusModal(); 
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Error updating order status');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const openEditWorkersModal = (order) => {
        setSelectedOrder(order);
        const initialSelected = (order.assignedWorkers || []).map(worker => ({
            value: worker.id,
            label: worker.fullName,
        }));
        setSelectedWorkersForEdit(initialSelected);
        setEditWorkersModalIsOpen(true);
    };

    const closeEditWorkersModal = () => {
        setEditWorkersModalIsOpen(false);
        setSelectedWorkersForEdit([]);
    };

    const openOrderReport = (orderId, e) => {
        if (e) e.stopPropagation();
        window.open(`/orders/${orderId}/report`, '_blank', 'noopener,noreferrer,width=960,height=900');
    };

    const handleExportWorkOrderPdf = async (order, e) => {
        if (e) e.stopPropagation();
        const orderId = typeof order === 'string' ? order : order?.id;
        if (!orderId) return;
        const documentNumber =
            typeof order === 'object' ? getOrderDocumentNumber(order) : undefined;
        setWorkOrderPdfLoading((prev) => ({ ...prev, [orderId]: true }));
        try {
            await downloadWorkOrderPdf(orderId, documentNumber);
        } catch (error) {
            console.error('Error exporting work order PDF:', error);
            alert('Error exporting work order PDF');
        } finally {
            setWorkOrderPdfLoading((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const updateOrderWorkers = async (changeReason) => {
        if (!selectedOrder) return;
        const userIds = (selectedWorkersForEdit || []).map(w => w.value);
        setAssignmentError('');
        try {
            setLoadingUpdate(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${URL}/orders/${selectedOrder.id}/workers`,
                { userIds, changeReason: changeReason || undefined },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (res.data?.code === 400) {
                setAssignmentError(res.data.message || 'Validation failed');
                toast.error(res.data.message || 'Please provide a replacement reason');
                return;
            }
            const list = await fetchOrders();
            if (selectedOrder?.id) {
                refreshTimersModalOrder(selectedOrder.id, list);
            }
            setAssignmentReasonOpen(false);
            setAssignmentReasonPreset('');
            setAssignmentReasonOther('');
            closeEditWorkersModal();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error updating order workers';
            setAssignmentError(msg);
            console.error('Error updating order workers:', error);
            toast.error(msg);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const onSaveWorkersFromList = () => {
        if (shouldPromptAssignmentReason(selectedOrder, selectedWorkersForEdit)) {
            setAssignmentReasonPreset('');
            setAssignmentReasonOther('');
            setAssignmentError('');
            setAssignmentReasonOpen(true);
            return;
        }
        updateOrderWorkers();
    };

    const getOptionalAssignmentReason = () => {
        const reason = buildAssignmentChangeReason(assignmentReasonPreset, assignmentReasonOther);
        return reason || undefined;
    };

    const confirmAssignmentReasonFromList = () => {
        setAssignmentError('');
        updateOrderWorkers(getOptionalAssignmentReason());
    };

    const saveAssignmentWithoutReasonFromList = () => {
        setAssignmentError('');
        updateOrderWorkers(undefined);
    };

    const handleDelete = (id) => {
        setOrderToDelete(id);
        setDeleteConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;
        
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${URL}/orders/delete/${orderToDelete}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            fetchOrders();
            toast.success("Order deleted successfully");
            setDeleteConfirmModalOpen(false);
            setOrderToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Error deleting order");
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmModalOpen(false);
        setOrderToDelete(null);
    };

    const getOrderServiceLinesForTimers = (order) => {
        const services =
            Array.isArray(order?.services) && order.services.length > 0
                ? order.services
                : Array.isArray(order?.offer?.services)
                  ? order.offer.services
                  : [];
        return services.map((s, idx) => ({
            idx,
            name: (String(s?.serviceName ?? s?.label ?? s?.name ?? '').trim()) || `Service ${idx + 1}`,
        }));
    };

    const getOrderWorkersForTimers = (order) =>
        (order?.assignedWorkers || []).map((w, slot) => ({
            slot,
            timerIndex: workerTimerIndex(slot),
            name: w?.fullName || w?.id || `Worker ${slot + 1}`,
            id: w?.id,
        }));

    const refreshTimersModalOrder = (orderId, ordersList) => {
        const list = ordersList || orders;
        const updated = list.find((o) => String(o.id) === String(orderId));
        if (updated) {
            setTimersModalOrder((prev) =>
                prev && String(prev.id) === String(orderId) ? { ...prev, ...updated } : prev,
            );
        }
    };

    const columns = [
        { name: 'Order Number', selector: row => getOrderDocumentNumber(row), sortable: true, cell: row => (
            <Link href={`/orders/${row.id}`} className="text-black">
                    <div className="text-blue-500 hover:underline">{getOrderDocumentNumber(row)}</div>
            </Link>
        ) },
        { name: 'Creation Date', selector: row => {
            return new Date(row.createdAt).toLocaleString();
        }, sortable: true },
        { name: 'Customer', selector: row => (row.offer && row.offer.customerFullName) ? row.offer.customerFullName : 'N/A', sortable: true },
        { name: 'Yacht', selector: row => row.offer && row.offer.yachtName ? row.offer.yachtName : '', sortable: true },
        { name: 'Responsible', selector: row => Array.isArray(row.assignedWorkers) 
            ? row.assignedWorkers.map(worker => worker.fullName).join(', ') 
            : 'N/A', sortable: true },
        { name: 'Status', selector: row => row.status, sortable: true, cell: row => (
            <span style={{
                ...statusStyles[row.status],
                padding: '5px 10px',
                borderRadius: '5px'
            }}>
                {row.status}
            </span>
        ) },
        ...(can(permissions, PermissionsList.ORDERS_READ)
            ? [{
            name: 'Report',
            cell: row => (
                <div className="flex justify-center gap-1 py-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="outlined"
                        color="gray"
                        className="normal-case text-xs px-3 py-1"
                        onClick={(e) => openOrderReport(row.id, e)}
                    >
                        Report
                    </Button>
                    <Button
                        size="sm"
                        variant="outlined"
                        color="purple"
                        className="normal-case text-xs px-3 py-1"
                        disabled={workOrderPdfLoading[row.id]}
                        onClick={(e) => handleExportWorkOrderPdf(row, e)}
                    >
                        {workOrderPdfLoading[row.id] ? '...' : 'PDF'}
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
        }] : []),
        ...(can(permissions, PermissionsList.ORDERS_TIMER_USE) || can(permissions, PermissionsList.ORDERS_TIMER_STOP)
            ? [{
            name: 'Timers',
            cell: row => (
                <div className="flex justify-center py-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="outlined"
                        color="blue"
                        className="normal-case text-xs px-3 py-1"
                        onClick={() => setTimersModalOrder(row)}
                    >
                        Open timers
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
        }] : []),
        ...((can(permissions, PermissionsList.ORDERS_STATUS_CHANGE) ||
            can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE) ||
            can(permissions, PermissionsList.ORDERS_DELETE)) && role !== 'user'
            ? [{
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    {can(permissions, PermissionsList.ORDERS_STATUS_CHANGE) && (
                    <button
                        onClick={() => handleStatusEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit order status"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    )}
                    {can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE) && (
                    <button
                        onClick={() => openEditWorkersModal(row)}
                        className="text-green-500 hover:text-green-700"
                        title="Edit assigned workers"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    )}
                    {can(permissions, PermissionsList.ORDERS_DELETE) && (
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete order"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    )}
                </div>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
    ];

    useEffect(() => {
        fetchOrders();
    }, [id]);

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const res = await axios.get(`${URL}/users/role/worker`);
                const workers = res.data.data || [];
                const options = workers.map(worker => ({
                    value: worker.id,
                    label: worker.fullName,
                }));
                setAvailableWorkers(options);
            } catch (error) {
                console.error('Error fetching workers:', error);
            }
        };
        fetchWorkers();
    }, []);

    const exportToExcel = async () => {
        const exportData = sortedOrders.map(row => ({
            'Order Number': getOrderDocumentNumber(row),
            'Creation Date': new Date(row.createdAt).toLocaleString(),
            'Customer': row.offer?.customerFullName || 'N/A',
            'Yacht': row.offer?.yachtName || '',
            'Responsible': Array.isArray(row.assignedWorkers) ? row.assignedWorkers.map(worker => worker.fullName).join(', ') : 'N/A',
            'Status': row.status
        }));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');
        const headers = Object.keys(exportData[0] || {});
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <Header />
            <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                        <div className="relative flex flex-col md:flex-row justify-between gap-4 mb-4 p-4">
                            <div className="filters flex flex-col md:flex-row gap-4 md:gap-8">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 w-full md:w-auto">
                                    <Select
                                        label="Search by"
                                        value={filters.searchCriteria}
                                        onChange={(value) => handleFilterChange(value, 'searchCriteria')}
                                        className="text-black border-gray-300 rounded-xs w-full"
                                        labelProps={{ className: 'text-black' }}
                                        containerProps={{ className: 'min-w-[120px] w-full md:w-auto' }}
                                    >
                                        <Option className="text-black" value="id">Number</Option>
                                        <Option className="text-black" value="yachtName">Yacht Name</Option>
                                        <Option className="text-black" value="customer">Customer</Option>
                                        <Option className="text-black" value="worker">Worker</Option>
                                    </Select>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.searchValue}
                                        onChange={(e) => handleFilterChange(e.target.value, 'searchValue')}
                                        className="border p-2 text-black rounded w-full md:w-48 h-10"
                                    />
                                </div>
                                <Select
                                    label="Status"
                                    name="status"
                                    value={filters.status}
                                    onChange={(value) => handleFilterChange(value, 'status')}
                                    className="text-black border-gray-300 rounded-xs w-full md:w-48"
                                    labelProps={{ className: 'text-black' }}
                                    containerProps={{ className: 'w-full md:w-auto' }}
                                    menuProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">All active</Option>
                                    <Option className="text-black" value="created">Created</Option>
                                    <Option className="text-black" value="confirmed">Confirmed</Option>
                                    <Option className="text-black" value="in-progress">In Progress</Option>
                                    <Option className="text-black" value="waiting">Waiting</Option>
                                    <Option className="text-black" value="awaiting-approval">Awaiting Approval</Option>
                                </Select>
                                <input
                                    type="date"
                                    name="date"
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange(e.target.value, 'date')}
                                    className="border p-2 text-black h-10 w-full md:w-auto"
                                    lang="en"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto justify-end">
                                {/* Help Button */}
                                <Button 
                                    onClick={() => setHelpModalOpen(true)}
                                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                                >
                                    <QuestionMarkCircleIcon className="w-5 h-5" />
                                    <span>Help</span>
                                </Button>
                                
                                {role !== 'user' && can(permissions, PermissionsList.ORDERS_TIMERS_GLOBAL_READ) && (
                                    <>
                                    <Button className="w-full sm:w-auto bg-[#282828] text-white" onClick={exportToExcel}>
                                        Export to Excel
                                    </Button>
                                <Button onClick={() => router.push('/orders/history')} color="white" className="w-full md:w-auto border border-gray-400 text-[#000]">
                                    <span>Timer history</span>
                                </Button>
                                    </>
                                )}
                                {can(permissions, PermissionsList.ARCHIVE_READ) && (
                                <Button onClick={() => router.push('/archive?entity=orders')} color="white" className="w-full md:w-auto border-[2px] border-[#D33] text-[#000]">
                                    <span>Archive &amp; History</span>
                                </Button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table ref={tableRef} style={{ display: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Order Number</th>
                                        <th>Creation Date</th>
                                        <th>Customer</th>
                                        <th>Yacht</th>
                                        <th>Responsible</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOrders.map((row) => (
                                        <tr key={row.id}>
                                            <td>{getOrderDocumentNumber(row)}</td>
                                            <td>{new Date(row.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</td>
                                            <td>{row.offer?.customerFullName || 'N/A'}</td>
                                            <td>{row.offer?.yachtName || ''}</td>
                                            <td>{Array.isArray(row.assignedWorkers) 
                                                ? row.assignedWorkers.map(worker => worker.fullName).join(', ') 
                                                : 'N/A'}</td>
                                            <td>{row.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <DataTable
                                columns={columns}
                                data={sortedOrders}
                                pagination
                                highlightOnHover
                                pointerOnHover
                                onRowClicked={(row) => router.push(`/orders/${row.id}`)}
                                onSort={handleSortChange}
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}

                {/* Help/Manual Modal */}
                <Modal 
                    isOpen={helpModalOpen} 
                    onClose={() => setHelpModalOpen(false)} 
                    title="Order Management Help & User Manual"
                    size="xl"
                >
                    <div className="max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Navigation Sidebar */}
                        <div className="border-b pb-4 mb-4">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {Object.keys(helpSections).map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setActiveHelpSection(section)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                                            activeHelpSection === section
                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {helpSections[section].title.split(' ').slice(0, 3).join(' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {helpSections[activeHelpSection].title}
                                </h2>
                                
                                <div className="space-y-3 text-gray-600">
                                    {helpSections[activeHelpSection].content.map((item, index) => {
                                        if (item.includes('**')) {
                                            const parts = item.split(/(\*\*.*?\*\*)/g);
                                            return (
                                                <p key={index} className="text-sm leading-relaxed">
                                                    {parts.map((part, i) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return (
                                                                <span key={i} className="font-semibold text-gray-800">
                                                                    {part.slice(2, -2)}
                                                                </span>
                                                            );
                                                        }
                                                        return part;
                                                    })}
                                                </p>
                                            );
                                        }
                                        
                                        if (item.startsWith('•')) {
                                            return (
                                                <div key={index} className="flex items-start">
                                                    <span className="mr-2 text-gray-400">•</span>
                                                    <span className="text-sm leading-relaxed">{item.substring(1)}</span>
                                                </div>
                                            );
                                        }
                                        
                                        if (item === '') {
                                            return <div key={index} className="h-3"></div>;
                                        }
                                        
                                        return (
                                            <p key={index} className="text-sm leading-relaxed">
                                                {item}
                                            </p>
                                        );
                                    })}
                                </div>
                                
                                {/* Quick Tips for Overview Section */}
                                {activeHelpSection === 'overview' && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold text-blue-700 mb-2">Quick Start Guide</h3>
                                        <ul className="space-y-2 text-sm text-blue-600">
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Click <strong>Order Number</strong> to view detailed information</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use <strong>filters</strong> to find specific orders quickly</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Update <strong>status</strong> regularly to track progress</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use <strong>timers</strong> to track working hours (admin only)</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Color Legend for Statuses Section */}
                                {activeHelpSection === 'statuses' && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h3 className="font-semibold text-gray-700 mb-3">Status Color Legend</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(statusStyles).map(([status, style]) => (
                                                <div key={status} className="flex items-center gap-2">
                                                    <div 
                                                        className="w-4 h-4 rounded" 
                                                        style={{ backgroundColor: style.backgroundColor || style.color }}
                                                    ></div>
                                                    <span className="text-sm text-gray-600">{status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Export Tips */}
                                {activeHelpSection === 'export' && (
                                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                                        <p className="text-sm text-green-700">
                                            <span className="font-semibold">Tip:</span> Export data regularly for backup and use it for client billing reports and productivity analysis.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                For additional support, contact system administrator
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="text"
                                    color="gray"
                                    onClick={() => setHelpModalOpen(false)}
                                    className="text-sm"
                                >
                                    Close
                                </Button>
                                <Button
                                    color="blue"
                                    onClick={() => {
                                        const printContent = `
                                            <html>
                                                <head>
                                                    <title>Order Management Manual - ${helpSections[activeHelpSection].title}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                                                        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                                                        h2 { color: #555; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                                                        h3 { color: #666; margin-top: 15px; }
                                                        p { line-height: 1.6; margin: 10px 0; }
                                                        ul { margin-left: 20px; }
                                                        li { margin-bottom: 5px; line-height: 1.5; }
                                                        .tip { background: #f0f8ff; padding: 10px; border-left: 4px solid #007bff; margin: 15px 0; }
                                                        .note { background: #fff8e1; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                                                        .highlight { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-weight: bold; }
                                                        .color-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
                                                        .color-item { display: flex; align-items: center; gap: 10px; }
                                                        .color-box { width: 20px; height: 20px; border-radius: 3px; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <h1>${helpSections[activeHelpSection].title}</h1>
                                                    ${helpSections[activeHelpSection].content.map(item => {
                                                        if (item.includes('**')) {
                                                            const htmlItem = item.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');
                                                            return item.startsWith('•') ? `<p>${htmlItem}</p>` : `<p>${htmlItem}</p>`;
                                                        }
                                                        return item.startsWith('•') ? `<p>${item}</p>` : `<p>${item}</p>`;
                                                    }).join('')}
                                                    ${activeHelpSection === 'overview' ? `
                                                        <div class="tip">
                                                            <h3>Quick Start Guide</h3>
                                                            <ul>
                                                                <li>Click <span class="highlight">Order Number</span> to view detailed information</li>
                                                                <li>Use <span class="highlight">filters</span> to find specific orders quickly</li>
                                                                <li>Update <span class="highlight">status</span> regularly to track progress</li>
                                                                <li>Use <span class="highlight">timers</span> to track working hours (admin only)</li>
                                                            </ul>
                                                        </div>
                                                    ` : ''}
                                                    ${activeHelpSection === 'statuses' ? `
                                                        <div class="note">
                                                            <h3>Status Color Legend</h3>
                                                            <div class="color-legend">
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #ffc107;"></div>
                                                                    <span>created</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #0dcaf0;"></div>
                                                                    <span>confirmed</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #dc3545;"></div>
                                                                    <span>canceled</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #fd7e14;"></div>
                                                                    <span>in-progress</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #6f42c1;"></div>
                                                                    <span>waiting</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #198754;"></div>
                                                                    <span>awaiting-approval</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #20c997;"></div>
                                                                    <span>completed</span>
                                                                </div>
                                                                <div class="color-item">
                                                                    <div class="color-box" style="background-color: #212529;"></div>
                                                                    <span>closed</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                                        <p>Printed from Order Management System on ${new Date().toLocaleDateString()}</p>
                                                        <p>© ${new Date().getFullYear()} Order Management System. All rights reserved.</p>
                                                    </div>
                                                </body>
                                            </html>
                                        `;
                                        
                                        const printWindow = window.open('', '_blank');
                                        printWindow.document.write(printContent);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }}
                                    className="text-sm"
                                >
                                    Print This Section
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Edit Workers Modal */}
                <Modal isOpen={editWorkersModalIsOpen} onClose={closeEditWorkersModal} title="Edit Assigned Workers">
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Current Order:</span> {selectedOrder?.id} - {selectedOrder?.offer?.customerFullName || 'N/A'}
                            </p>
                        </div>
                        <ReactSelect
                            options={availableWorkers}
                            value={selectedWorkersForEdit}
                            onChange={(selected) => setSelectedWorkersForEdit(selected || [])}
                            isMulti
                            isClearable
                            isSearchable
                            placeholder="Select workers..."
                            className="mb-4 text-black"
                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                            menuPlacement="bottom"
                            menuPosition="fixed"
                            menuShouldScrollIntoView={false}
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                                multiValueLabel: (provided) => ({
                                    ...provided,
                                    color: 'black',
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: 240,
                                }),
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="text" color="red" onClick={closeEditWorkersModal} className="w-full md:w-auto">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={onSaveWorkersFromList} disabled={loadingUpdate} className="w-full md:w-auto">
                                {loadingUpdate ? <ClipLoader size={13} color={"#123abc"} /> : <span>Save</span>}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={assignmentReasonOpen}
                    onClose={() => {
                        if (!loadingUpdate) setAssignmentReasonOpen(false);
                    }}
                    title="Remove or replace worker"
                >
                    <div className="space-y-3 text-black">
                        <p className="text-sm text-gray-600">
                            You are removing or replacing an assigned worker. You may note why (optional). If left
                            blank, the change is still saved. Adding workers only does not show this step.
                        </p>
                        <div className="space-y-2">
                            {ASSIGNMENT_CHANGE_REASONS.map((r) => (
                                <label key={r.value} className="flex items-start gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="listAssignmentReason"
                                        value={r.value}
                                        checked={assignmentReasonPreset === r.value}
                                        onChange={() => setAssignmentReasonPreset(r.value)}
                                        className="mt-1"
                                    />
                                    <span>{r.label}</span>
                                </label>
                            ))}
                        </div>
                        {assignmentReasonPreset === 'other' && (
                            <textarea
                                className="border rounded p-2 w-full text-sm"
                                rows={3}
                                placeholder="Describe the reason…"
                                value={assignmentReasonOther}
                                onChange={(e) => setAssignmentReasonOther(e.target.value)}
                            />
                        )}
                        {assignmentError && <p className="text-sm text-red-600">{assignmentError}</p>}
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="text"
                                color="gray"
                                onClick={() => !loadingUpdate && setAssignmentReasonOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                color="gray"
                                onClick={saveAssignmentWithoutReasonFromList}
                                disabled={loadingUpdate}
                            >
                                {loadingUpdate ? 'Saving…' : 'Continue without reason'}
                            </Button>
                            <Button
                                type="button"
                                color="green"
                                onClick={confirmAssignmentReasonFromList}
                                disabled={loadingUpdate}
                            >
                                {loadingUpdate ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Status Modal */}
                <Modal isOpen={editStatusModalIsOpen} onClose={closeEditStatusModal} title="Edit Order Status">
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Current Order:</span> {selectedOrder?.id} - {selectedOrder?.offer?.customerFullName || 'N/A'}
                            </p>
                        </div>
                        
                        <ReactSelect
                            value={
                                selectedOrder?.status
                                    ? { value: selectedOrder.status, label: selectedOrder.status }
                                    : null
                            }
                            onChange={(option) => handleStatusChange(option ? option.value : '')}
                            options={[
                                { value: 'created', label: 'Created' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'canceled', label: 'Canceled' },
                                { value: 'waiting', label: 'Waiting' },
                                { value: 'awaiting-approval', label: 'Awaiting Approval' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'closed', label: 'Closed' },
                            ]}
                            placeholder="Select status..."
                            className="text-black"
                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                            menuPlacement="bottom"
                            menuPosition="fixed"
                            menuShouldScrollIntoView={false}
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                }),
                                singleValue: (provided) => ({
                                    ...provided,
                                    color: 'black',
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: 240,
                                }),
                            }}
                        />
                        
                        <div className="flex justify-end gap-2">
                            <Button variant="text" color="red" onClick={closeEditStatusModal} className="w-full md:w-auto">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={() => updateOrderStatus(selectedOrder.id)} disabled={loadingUpdate} className="w-full md:w-auto">
                                {loadingUpdate ? <ClipLoader size={13} color={"#123abc"} /> : <span>Update</span>}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={!!timersModalOrder}
                    onClose={() => setTimersModalOrder(null)}
                    title={timersModalOrder ? `Timers · Order ${timersModalOrder.id}` : 'Timers'}
                    bodyClassName="max-h-[70vh] overflow-y-auto"
                >
                    {timersModalOrder && (() => {
                        const lines = getOrderServiceLinesForTimers(timersModalOrder);
                        const workers = getOrderWorkersForTimers(timersModalOrder);
                        const workerKey = (workers || []).map((w) => w.id).join(',');
                        return (
                            <div className="space-y-4 text-black">
                                <div className="text-sm text-gray-700 border-b border-gray-200 pb-3">
                                    <div><span className="font-semibold">Customer:</span> {timersModalOrder.offer?.customerFullName || 'N/A'}</div>
                                    <div><span className="font-semibold">Yacht:</span> {timersModalOrder.offer?.yachtName || '—'}</div>
                                    <div><span className="font-semibold">Status:</span> {timersModalOrder.status}</div>
                                    <div><span className="font-semibold">Assigned:</span>{' '}
                                        {workers.length > 0
                                            ? workers.map((w) => w.name).join(', ')
                                            : '—'}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {lines.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-800">By service line</h3>
                                            <div className="flex flex-col gap-3">
                                                {lines.map((line) => (
                                                    <div key={`line-${line.idx}`} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                                        <WorkTimer
                                                            key={`${timersModalOrder.id}-line-${line.idx}-${timersRefreshKey}`}
                                                            orderId={timersModalOrder.id}
                                                            serviceLineIndex={line.idx}
                                                            serviceLabel={line.name}
                                                            refreshToken={timersRefreshKey}
                                                            onStop={fetchOrders}
                                                            canUseTimer={can(permissions, PermissionsList.ORDERS_TIMER_USE)}
                                                            canStopTimer={can(permissions, PermissionsList.ORDERS_TIMER_STOP)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {workers.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-800">By assigned worker</h3>
                                            <div className="flex flex-col gap-3">
                                                {workers.map((w) => (
                                                    <div key={`worker-${w.id}`} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                                        <WorkTimer
                                                            key={`${timersModalOrder.id}-worker-${w.id}-${workerKey}-${timersRefreshKey}`}
                                                            orderId={timersModalOrder.id}
                                                            serviceLineIndex={w.timerIndex}
                                                            serviceLabel={w.name}
                                                            refreshToken={timersRefreshKey}
                                                            onStop={fetchOrders}
                                                            canUseTimer={can(permissions, PermissionsList.ORDERS_TIMER_USE)}
                                                            canStopTimer={can(permissions, PermissionsList.ORDERS_TIMER_STOP)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {lines.length === 0 && workers.length === 0 && (
                                        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                            <WorkTimer
                                                key={`${timersModalOrder.id}-fallback-${timersRefreshKey}`}
                                                orderId={timersModalOrder.id}
                                                serviceLineIndex={0}
                                                serviceLabel="Work (no lines)"
                                                refreshToken={timersRefreshKey}
                                                onStop={fetchOrders}
                                                canUseTimer={can(permissions, PermissionsList.ORDERS_TIMER_USE)}
                                                canStopTimer={can(permissions, PermissionsList.ORDERS_TIMER_STOP)}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-200">
                                    {canClearAllOrderTimers ? (
                                        <button
                                            type="button"
                                            onClick={openClearTimersConfirm}
                                            className="text-sm px-3 py-1.5 rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                                        >
                                            Clear all timers…
                                        </button>
                                    ) : (
                                        <span />
                                    )}
                                    <Button
                                        type="button"
                                        variant="text"
                                        color="gray"
                                        onClick={() => setTimersModalOrder(null)}
                                        className="ml-auto"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </Modal>

                <Modal
                    isOpen={clearTimersOpen}
                    onClose={() => {
                        if (!clearTimersLoading) {
                            setClearTimersOpen(false);
                            setClearTimersConfirmed(false);
                            setClearTimersOrderId(null);
                        }
                    }}
                    title="Confirm: delete all timer data"
                    size="md"
                    bodyClassName="overflow-y-auto"
                >
                    <div className="space-y-4 text-black">
                        <p className="text-sm text-gray-700">
                            All timer records for work order{' '}
                            <span className="font-mono font-semibold">{clearTimersOrderId}</span> will be
                            permanently deleted. This cannot be undone. The action is written to the audit
                            log.
                        </p>
                        <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={clearTimersConfirmed}
                                onChange={(e) => setClearTimersConfirmed(e.target.checked)}
                                disabled={clearTimersLoading}
                            />
                            <span>
                                I understand that all timer data for this work order will be permanently
                                deleted.
                            </span>
                        </label>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="text"
                                color="gray"
                                onClick={() => {
                                    if (!clearTimersLoading) {
                                        setClearTimersOpen(false);
                                        setClearTimersConfirmed(false);
                                        setClearTimersOrderId(null);
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                color="red"
                                onClick={confirmClearAllTimers}
                                disabled={clearTimersLoading || !clearTimersConfirmed}
                            >
                                {clearTimersLoading ? 'Deleting…' : 'Delete all timer data'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete order <strong>#{orderToDelete}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                                variant="text" 
                                color="gray" 
                                onClick={cancelDelete}
                                disabled={deleting}
                                className="mr-2"
                            >
                                <span>No, Cancel</span>
                            </Button>
                            <Button 
                                color="red" 
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <div className="flex items-center gap-2">
                                        <ClipLoader size={13} color={"#ffffff"} />
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    <span>Yes, Delete</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OrderPage;