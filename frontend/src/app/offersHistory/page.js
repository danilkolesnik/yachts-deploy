"use client"
import React, { useEffect, useState } from 'react';
import { Button } from "@material-tailwind/react";
import { useRouter } from 'next/navigation';
import { URL } from '@/utils/constants';
import Header from '@/component/header';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import { statusStyles } from '@/utils/statusStyles';


const OffersHistoryPage = () => {
    const [offerHistory, setOfferHistory] = useState([]);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const getOfferHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${URL}/offer`);
            setOfferHistory(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOfferHistory();
    }, []);

    const formatKey = (key) => {
        return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
    };

    const flattenOfferHistory = (offerHistory) => {
        return offerHistory.flatMap(entry => {
            return Object.entries(JSON.parse(entry.changeDescription))
                .filter(([key]) => key !== 'userId')
                .map(([key, value]) => ({
                    offerId: entry.offerId,
                    changeDate: entry.changeDate,
                    user: entry.user?.fullName || 'Unknown User',
                    changedField: formatKey(key),
                    oldValue: typeof value.oldValue === 'object' && value.oldValue !== null ?
                        ('name' in value.oldValue ? value.oldValue.name :
                        'serviceName' in value.oldValue ? value.oldValue.serviceName :
                        String(value.oldValue)) : String(value.oldValue),
                    newValue: typeof value.newValue === 'object' && value.newValue !== null ?
                        ('name' in value.newValue ? value.newValue.name :
                        'serviceName' in value.newValue ? value.newValue.serviceName :
                        String(value.newValue)) : String(value.newValue),
                }));
        });
    };

    const flattenedData = flattenOfferHistory(offerHistory);

    const columns = [
        {
            name: 'Date',
            selector: row => new Date(row.changeDate).toLocaleString(),
            sortable: true,
        },
        {
            name: 'Offer ID',
            selector: row => `#${row.offerId}`,
            cell: row => (
                <span className="text-blue-500 font-semibold">#{row.offerId}</span>
            ),
            sortable: true,
        },
        {
            name: 'User',
            selector: row => row.user,
            sortable: true,
        },
        {
            name: 'Changed Field',
            selector: row => row.changedField,
        },
        {
            name: 'Old',
            selector: row => row.oldValue,
            cell: row => {
                const isStatus = row.changedField === 'Status';
                if (isStatus && statusStyles[row.oldValue]) {
                    return (
                        <span style={{
                            ...statusStyles[row.oldValue],
                            padding: '5px 10px',
                            borderRadius: '5px',
                            display: 'inline-block'
                        }}>
                            {row.oldValue}
                        </span>
                    );
                }
                return <span className="text-black">{row.oldValue}</span>;
            },
        },
        {
            name: 'New',
            selector: row => row.newValue,
            cell: row => {
                const isStatus = row.changedField === 'Status';
                if (isStatus && statusStyles[row.newValue]) {
                    return (
                        <span style={{
                            ...statusStyles[row.newValue],
                            padding: '5px 10px',
                            borderRadius: '5px',
                            display: 'inline-block'
                        }}>
                            {row.newValue}
                        </span>
                    );
                }
                return <span className="text-black">{row.newValue}</span>;
            },
        },
    ];

    return (
        <>
          <Header />
            <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <Loader loading={loading} />
                </div>
            ) : (
            <div className="w-full space-y-6 bg-white rounded shadow-md p-4">
                <div className="flex justify-start mb-4">
                    <Button color="blue" onClick={() => router.push('/offers')} className="w-full md:w-auto">
                        Back
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={flattenedData}
                        pagination
                        highlightOnHover
                        striped
                        responsive
                        className="min-w-full border-collapse"
                    />
                </div>
            </div>
            )}
        </div>
        </>
    );
};

export default OffersHistoryPage;
