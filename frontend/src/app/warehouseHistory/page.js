"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import { URL } from '@/utils/constants';

const WarehouseHistoryPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        {
            name: 'Date & Time',
            selector: row => new Date(row.createdAt).toLocaleString(),
            sortable: true,
        },
        {
            name: 'Item Name',
            selector: row => row.data?.name || '',
            sortable: true,
        },
        {
            name: 'Operation',
            selector: row => {
                switch (row.action) {
                    case 'create':
                        return 'Receipt';
                    case 'delete':
                        return 'Write-off';
                    case 'update':
                    default:
                        return 'Adjustment';
                }
            },
            sortable: true,
        },
        {
            name: 'Qty change',
            selector: row => {
                const oldQ = typeof row.oldQuantity === 'number' ? row.oldQuantity : 0;
                const newQ = typeof row.newQuantity === 'number' ? row.newQuantity : 0;
                const diff = newQ - oldQ;
                if (!diff) return '0';
                return diff > 0 ? `+${diff}` : `${diff}`;
            },
            sortable: true,
        },
        {
            name: 'New qty',
            selector: row => row.newQuantity ?? row.data?.quantity ?? '',
            sortable: true,
        },
        {
            name: 'Warehouse',
            selector: row => row.warehouseType === 'official' ? 'Official' : 'Unofficial',
            sortable: true,
        },
        {
            name: 'User',
            selector: row => row.user?.fullName || row.userId || '',
            sortable: true,
        },
    ];

    const getData = async () => {
        try {
            const res = await axios.get(`${URL}/warehouse/history`);
            setData(res.data.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <>
        <Header />
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <Loader loading={loading} />
                </div>
            ) : data.length === 0 ? (
                <div className="flex justify-center items-center min-h-[50vh]">
                    <p className="text-gray-500 text-lg">No warehouse history records found</p>
                </div>
            ) : (
                <div className="w-full space-y-6 bg-white rounded shadow-md">
                    <DataTable
                        columns={columns}
                        data={data}
                        pagination
                        highlightOnHover
                        pointerOnHover
                        className="min-w-full border-collapse"
                    />
                </div>
            )}
        </div>
        </>
    );
};

export default WarehouseHistoryPage;