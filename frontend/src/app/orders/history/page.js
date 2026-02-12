"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import axios from 'axios';
import { statusStyles } from '@/utils/statusStyles';

const OrdersHistoryPage = () => {
    const router = useRouter();
    const [ordersHistory, setOrdersHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const columns = [
        {
            name: 'Order ID',   
            selector: row => row.orderId,
        },
        {
            name: 'Start Time',
            selector: row => {
                if (!row.startTime) return '-';
                try {
                    const [date, time] = row.startTime.split('T');
                    const [year, month, day] = date.split('-');
                    const [hours, minutes] = time.split(':');
                    return `${day}.${month}.${year} ${hours}:${minutes}`;
                } catch (error) {
                    return '-';
                }
            }
        },    
        {
            name:'Responsible',
            selector: row => row.worker ? row.worker.fullName : '-'
        }, 
        {
            name: 'Status',
            selector: row => row.order?.status || row.status,
            cell: row => {
                const status = row.order?.status || row.status;
                const style = statusStyles[status];
                return style ? (
                    <span style={{
                        ...style,
                        padding: '5px 10px',
                        borderRadius: '5px',
                        display: 'inline-block'
                    }}>
                        {status || '-'}
                    </span>
                ) : (
                    <span>{status || '-'}</span>
                );
            }
        },
       {
        name:'Total Time',
        selector: row => {
            if (!row.totalDuration) return '-';
            const totalSeconds = Math.floor(row.totalDuration / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
       }
        
    ]

    const getOrdersHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${URL}/orders/timers/all`);
            const timers = res.data.data || [];

            // Keep only records related to finished orders and collapse duplicates by orderId
            const finishedOrdersMap = new Map();
            timers.forEach((timerItem) => {
                if (timerItem.order?.status === 'finished' && !finishedOrdersMap.has(timerItem.orderId)) {
                    finishedOrdersMap.set(timerItem.orderId, timerItem);
                }
            });

            const finishedOrdersHistory = Array.from(finishedOrdersMap.values());

            setOrdersHistory(finishedOrdersHistory);
            setFilteredHistory(finishedOrdersHistory);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

    // Фильтрация по имени работника
    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        
        if (!searchValue.trim()) {
            setFilteredHistory(ordersHistory);
            return;
        }

        const filtered = ordersHistory.filter(item => {
            const workerName = item.worker?.fullName || '';
            return workerName.toLowerCase().includes(searchValue.toLowerCase());
        });
        
        setFilteredHistory(filtered);
    };

    useEffect(() => {
        getOrdersHistory();
    }, []);

    return(
    <>
        <Header />
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <Loader loading={loading} />
                </div>
            ) : (
                <div className="w-full space-y-6 bg-white rounded shadow-md p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <Button color="blue" onClick={() => router.push('/orders')}>Back</Button>
                        
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by worker name..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center items-center">
                        <DataTable
                            columns={columns}
                            data={filteredHistory}
                            className="min-w-full border-collapse"
                        />
                    </div>
                </div>
            )}

        </div>
    </>
  )
};

export default OrdersHistoryPage;
