"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statusStyles } from '@/utils/statusStyles';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { useAppSelector } from '@/lib/hooks';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import Link from 'next/link';
import * as XLSX from 'xlsx';

const ConfirmedOffersPage = () => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    const [filters, setFilters] = useState({
        searchCriteria: 'id',
        searchValue: '',
        date: ''
    });

    const columns = [
        {
            name: 'ID',
            selector: row => (
                <Link href={`/offers/${row.id}`} className="text-black">
                    <div className="text-blue-500 hover:underline">{row.id}</div>
                </Link>
            ),
            sortable: true,
        },
        {
            name: 'Date',
            selector: row => new Date(row.createdAt).toLocaleString(),
            sortable: true,
        },
        {
            name: 'Customer',
            selector: row => row.customerFullName || '',
            sortable: true,
        },
        {
            name: 'Yacht Name',
            selector: row => row.yachtName,
            sortable: true,
        },
        {
            name: 'Yacht Model',
            selector: row => row.yachtModel,
            sortable: true,
        },
        {
            name: 'Boat Registration',
            selector: row => row.countryCode,
            sortable: true,
        },
        { 
            name: 'Status', 
            selector: row => row.status, 
            sortable: true, 
            cell: row => (
                <span style={{
                    ...statusStyles[row.status],
                    padding: '5px 10px',
                    borderRadius: '5px'
                }}>
                    {row.status} 
                </span>
            ) 
        },
        {
            name: 'Service Category',
            selector: row => row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : 'N/A',
            sortable: true,
        },
        {
            name: 'Parts',
            selector: row => Array.isArray(row.parts) 
                ? row.parts.map(part => part.label).join(', ') 
                : 'N/A',
            sortable: true,
        },
        ...(role !== 'user' ? [{
            name: '',
            cell: row => (
                <button
                    onClick={() => handleExportPdf(row.id)}
                    className="px-2 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                    Export PDF
                </button>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
    ];

    const getData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${URL}/offer/canceled`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }   
            });
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const handleBackClick = () => {
        router.push('/offers');
    };

    const handleExportPdf = async (offerId) => {
        try {
            const response = await axios.get(`${URL}/offer/${offerId}/export-pdf`, {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `offer-${offerId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const filteredData = (data || []).filter(offer => {
        const searchValue = filters.searchValue.toLowerCase();
        const offerDate = new Date(offer.createdAt);
        const filterDate = filters.date ? new Date(filters.date) : null;

        const matchesSearch = () => {
            switch(filters.searchCriteria) {
                case 'yachtName':
                    return offer.yachtName?.toLowerCase().includes(searchValue);
                case 'customer':
                    return offer.customerFullName?.toLowerCase().includes(searchValue);
                default:
                    return true;
            }
        };

        return (
            (filters.searchValue ? matchesSearch() : true) &&
            (filterDate ? offerDate.toDateString() === filterDate.toDateString() : true)
        );
    });

    // --- SheetJS Export Function ---
    const exportToExcel = () => {
        const exportData = filteredData.map(row => ({
            ID: row.id,
            Date: new Date(row.createdAt).toLocaleString(),
            Customer: row.customerFullName || '',
            'Yacht Name': row.yachtName,
            'Yacht Model': row.yachtModel,
            'Boat Registration': row.countryCode,
            Status: row.status,
            'Service Category': row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : 'N/A',
            Parts: Array.isArray(row.parts) ? row.parts.map(part => part.label || part.name).join(', ') : 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Offers');
        XLSX.writeFile(workbook, 'offers_export.xlsx');
    };

    useEffect(() => {
        setLoading(true);
        getData()
            .then((res) => {
                setData(res || []);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('role');
            setRole(storedRole);
        }
    }, []);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                        <div className="relative flex flex-col md:flex-row justify-between gap-4 mb-4 p-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 w-full md:w-auto">
                                    <Select
                                        label="Search by"
                                        value={filters.searchCriteria}
                                        onChange={(value) => setFilters({ ...filters, searchCriteria: value })}
                                        className="text-black border-gray-300 rounded-xs w-full md:w-36"
                                        labelProps={{ className: 'text-black' }}
                                        containerProps={{ className: 'min-w-[120px] w-full md:w-auto' }}
                                    >
                                        <Option className="text-black" value="id">Yacht Name</Option>
                                        <Option className="text-black" value="customer">Customer</Option>
                                    </Select>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.searchValue}
                                        onChange={(e) => setFilters({ ...filters, searchValue: e.target.value })}
                                        className="border p-2 text-black rounded w-full md:w-48 h-10"
                                    />
                                </div>
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                    className="border p-2 text-black rounded h-10 w-full md:w-auto"
                                    lang="en"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto justify-end">
                                {role !== 'user' && (
                                    <>
                                        <Button onClick={handleBackClick} color="gray" className="w-full sm:w-auto">
                                            Back
                                        </Button>
                                        <Button color="purple" className="w-full sm:w-auto" onClick={exportToExcel}>
                                            Export to Excel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={columns}
                                data={filteredData}
                                pagination
                                highlightOnHover
                                pointerOnHover
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ConfirmedOffersPage;