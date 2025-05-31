"use client"
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Select, Option,Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { useAppSelector } from '@/lib/hooks';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ClipLoader } from 'react-spinners';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Link from 'next/link';
import WorkTimer from '@/component/workTimer/workTimer';
import { statusStyles } from '@/utils/statusStyles';
import { useRouter } from 'next/navigation';
import { DownloadTableExcel } from 'react-export-table-to-excel-xlsx';

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
    const id = useAppSelector(state => state.userData?.id);
    const [editStatusModalIsOpen, setEditStatusModalIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusOptions, setStatusOptions] = useState(null);
    const [role, setRole] = useState(null);
    const tableRef = useRef(null);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${URL}/orders`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setOrders(response.data.data || []);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
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
                    return order.id.toString().includes(searchValue);
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

        return (
            (filters.status ? order.status === filters.status : true) &&
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
            await axios.post(`${URL}/orders/${selectedOrder.id}/status`, { status: selectedOrder.status });
            fetchOrders();
            closeEditStatusModal(); 
        } catch (error) {
            console.error('Error updating order status:', error);
        }finally {
            setLoadingUpdate(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/orders/delete/${id}`);
            fetchOrders()
                .then((res) => {
                    setOrders(res);
                });
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        { name: 'Order Number', selector: row => (
            <Link href={`/orders/${row.id}`} className="text-black">
                    <div className="text-blue-500 hover:underline">{row.id}</div>
            </Link>
        ), sortable: true },
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
        ...(role !== 'user' ? [{
            name: 'Timers',
            cell: row => (
                <div className="flex justify-center">
                    <WorkTimer orderId={row.id}/>
                </div>
            ),
            ignoreRowClick: true,
        }] : []),
        ...(role !== 'user' ? [{
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleStatusEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
    ];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('role');
            setRole(storedRole);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [id]);

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
                                        className="text-black border-gray-300 rounded-xs w-full md:w-36"
                                        labelProps={{ className: 'text-black' }}
                                        containerProps={{ className: 'min-w-[120px] w-full md:w-auto' }}
                                    >
                                        <Option className="text-black" value="id">ID</Option>
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
                                    onChange={(value) => handleFilterChange(value, 'status')}
                                    className="text-black border-gray-300 rounded-xs w-full md:w-48"
                                    labelProps={{ className: 'text-black' }}
                                    containerProps={{ className: 'w-full md:w-auto' }}
                                    menuProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">All</Option>
                                    <Option className="text-black" value="created">Created</Option>
                                    <Option className="text-black" value="confirmed">Confirmed</Option>
                                    <Option className="text-black" value="canceled">Canceled</Option>
                                    <Option className="text-black" value="in-progress">In Progress</Option>
                                    <Option className="text-black" value="waiting">Waiting</Option>
                                    <Option className="text-black" value="awaiting-approval">Awaiting Approval</Option>
                                    <Option className="text-black" value="completed">Completed</Option>
                                    <Option className="text-black" value="closed">Closed</Option>
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
                                <DownloadTableExcel
                                    filename="orders_export"
                                    sheet="Orders"
                                    currentTableRef={tableRef.current}
                                >
                                    <Button color="purple" className="w-full sm:w-auto">
                                        Export to Excel
                                    </Button>
                                </DownloadTableExcel>
                                <Button color="green" onClick={() => router.push('/orders/history')} className="w-full sm:w-auto">
                                    <span>History</span>
                                </Button>
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
                                            <td>{row.id}</td>
                                            <td>{new Date(row.createdAt).toLocaleString()}</td>
                                            <td>{row.offer && row.offer.customerFullName ? row.offer.customerFullName : 'N/A'}</td>
                                            <td>{row.offer && row.offer.yachtName ? row.offer.yachtName : ''}</td>
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
                                onSort={handleSortChange}
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}
                <Modal isOpen={editStatusModalIsOpen} onClose={closeEditStatusModal} title="Edit Order Status">
                    <div className="space-y-4">            
                        <Select
                            label="Status"
                            value={selectedOrder?.status || ''}
                            onChange={handleStatusChange} 
                            className="text-black w-full"
                            labelProps={{ className: 'text-black' }}
                        >
                            <Option value="created" className="text-black">Created</Option>
                            <Option value="confirmed" className="text-black">Confirmed</Option>
                            <Option value="canceled" className="text-black">Canceled</Option>
                            <Option value="in-progress" className="text-black">In Progress</Option>
                            <Option value="waiting" className="text-black">Waiting</Option>
                            <Option value="awaiting-approval" className="text-black">Awaiting Approval</Option>
                            <Option value="completed" className="text-black">Completed</Option>
                            <Option value="closed" className="text-black">Closed</Option>
                        </Select>
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
            </div>
        </div>
    );
};

export default OrderPage;