"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import axios from 'axios';

const OrdersHistoryPage = () => {
    const router = useRouter();
    const [ordersHistory, setOrdersHistory] = useState([]);
    const [loading, setLoading] = useState(false);

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
            setOrdersHistory(res.data.data);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

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
                    <Button color="blue" onClick={() => router.push('/orders')}>Back</Button>
                    <div className="flex justify-center items-center">
                        <DataTable
                            columns={columns}
                            data={ordersHistory}
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
