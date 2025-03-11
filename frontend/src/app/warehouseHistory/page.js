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
            name: 'Date',
            selector: row => new Date(row.createdAt).toLocaleString(),
            sortable: true,
        },
        {
            name: 'Action',
            selector: row => row.action,
            sortable: true,
        },
        {
            name: 'Name',
            selector: row => row.data.name,
            sortable: true,
        },
        {
            name: 'Country Code',
            selector: row => row.data.countryCode,
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