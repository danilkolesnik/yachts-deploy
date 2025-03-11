"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Select, Option,Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { useAppSelector } from '@/lib/hooks';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Link from 'next/link';
import { statusStyles } from '@/utils/statusStyles';

const OrderPage = () => {

    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
        client: '',
        yacht: '',
        employee: ''
    });
    const [sortField, setSortField] = useState('urgencyLevel');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);
    const id = useAppSelector(state => state.userData?.id);
    const [editStatusModalIsOpen, setEditStatusModalIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusOptions, setStatusOptions] = useState(null);
    const [role] = useState(localStorage.getItem('role'));

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
        console.log(value, name);
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

        return (
            (filters.status ? order.status === filters.status : true) &&
            (filters.client ? order.offer && order.offer.customerFullName === filters.client : true) &&
            (filterDate ? orderDate.toDateString() === filterDate.toDateString() : true)
        );
    });

    const sortedOrders = filteredOrders.sort((a, b) => {
        if (sortField === 'client') {
            return sortOrder === 'asc' 
                ? (a.offer ? a.offer.customerFullName : '').localeCompare(b.offer ? b.offer.customerFullName : '') 
                : (b.offer ? b.offer.customerFullName : '').localeCompare(a.offer ? a.offer.customerFullName : '');
        }
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
            await axios.post(`${URL}/orders/${selectedOrder.id}/status`, { status: selectedOrder.status });
            fetchOrders();
            closeEditStatusModal(); 
        } catch (error) {
            console.error('Error updating order status:', error);
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
        { name: 'Creation Date', selector: row => {
            return new Date(row.createdAt).toLocaleString();
        }, sortable: true },
        { name: 'Order Number', selector: row => (
            <Link href={`/orders/${row.id}`} className="text-black">
                    <div className="text-blue-500 hover:underline">{row.id}</div>
            </Link>
        ), sortable: true },
        { name: 'Customer', selector: row => row.offer && row.offer.customerFullName ? row.offer.customerFullName : '', sortable: true },
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
        fetchOrders();
    }, [id]);

    return (
        <div>
            <Header />
            <div className="min-h-screen bg-gray-100 p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                        <div className="relative flex justify-between mb-4 p-4">
                            <div className="filters flex gap-8">
                                <Select
                                    label="Status"
                                    name="status"
                                    onChange={(value) => handleFilterChange(value, 'status')}
                                    className="text-black border-gray-300 rounded-xs"
                                    labelProps={{ className: 'text-black' }}
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
                                <Select
                                    label="Client"
                                    name="client"
                                    onChange={(e) => handleFilterChange(e.target.value, 'client')}
                                    className="text-black border-gray-300 rounded-md"
                                    labelProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">All Clients</Option>
                                    {[...new Set(orders.map(order => order.offer.customerFullName))].map(clientName => (
                                        <Option key={clientName} className="text-black" value={clientName}>{clientName}</Option>
                                    ))}
                                </Select>
                                <input
                                    type="date"
                                    name="date"
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange(e.target.value, 'date')}
                                    className="border p-2 text-black"
                                    lang="en"
                                />
                                
                            </div>
                        </div>
                        <DataTable
                            columns={columns}
                            data={sortedOrders}
                            pagination
                            highlightOnHover
                            pointerOnHover
                            onSort={handleSortChange}
                            className="min-w-full border-collapse"
                        />
                    </div>
                )}
                <Modal isOpen={editStatusModalIsOpen} onClose={closeEditStatusModal} title="Edit Order Status">
                <div className="space-y-4">            
                    <Select
                        label="Status"
                        value={selectedOrder?.status || ''}
                        onChange={handleStatusChange } 
                        className="text-black"
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
                    <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeEditStatusModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={() => updateOrderStatus(selectedOrder.id)}>
                                <span>Update</span>
                            </Button>
                    </div>
                </div>
            </Modal>
            </div>
            
        </div>
    );
};

export default OrderPage;