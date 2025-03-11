"use client"
import React, { useEffect, useState } from 'react';
import { URL } from '@/utils/constants';
import Header from '@/component/header';
import axios from 'axios';
import DataTable from 'react-data-table-component';


const OffersHistoryPage = () => {
    const [offerHistory, setOfferHistory] = useState([]);

    const getOfferHistory = async () => {
        try {
            const res = await axios.get(`${URL}/offer/history`);
            setOfferHistory(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const fetchAndSortHistory = async () => {
            await getOfferHistory();
            setOfferHistory(prevHistory => prevHistory.sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate)));
        };
        fetchAndSortHistory();
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
                    user: entry.user.fullName,
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
            selector: row => row.offerId,
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
        },
        {
            name: 'New ',
            selector: row => row.newValue,
        },
    ];

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-100 p-8 font-sans text-black">
                <h2 className="text-xl font-bold mb-4">Offer History</h2>
                <DataTable
                    columns={columns}
                    data={flattenedData}
                    pagination
                    highlightOnHover
                    striped
                />
            </div>
        </>
    );
};

export default OffersHistoryPage;
