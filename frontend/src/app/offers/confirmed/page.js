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
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const ConfirmedOffersPage = () => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [pdfExportLoading, setPdfExportLoading] = useState({});
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [emailSendingLoading, setEmailSendingLoading] = useState({});

    const [filters, setFilters] = useState({
        searchCriteria: 'id',
        searchValue: '',
        date: ''
    });

    const columns = [
        {
            name: 'ID',
            selector: row => `#${row.id}`,
            cell: row => (
                <Link href={`/offers/${row.id}`} className="text-black">
                    <div className="text-blue-500 hover:underline">
                        #{row.id}
                    </div>
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
            selector: row => {
                if (Array.isArray(row.services) && row.services.length > 0) {
                    return row.services.map(service => service.label ?? service.serviceName ?? '').filter(Boolean).join('; ');
                } else if (row.services && Object.keys(row.services).length > 0) {
                    // Backward compatibility for single service object
                    return row.services.label ?? row.services.serviceName ?? 'N/A';
                }
                return 'N/A';
            },
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
                    onClick={() => handleExportPdf(row)}
                    disabled={pdfExportLoading[row.id]}
                    className={`px-2 py-2 text-white rounded ${
                        pdfExportLoading[row.id] 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-700'
                    }`}
                >
                    {pdfExportLoading[row.id] ? 'Generating...' : 'Export PDF'}
                </button>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
        ...(role !== 'user' ? [{
            name: '',
            cell: row => (
                <button
                    onClick={() => handleSendEmail(row.id)}
                    disabled={emailSendingLoading[row.id]}
                    className={`px-2 py-2 text-white rounded ${
                        emailSendingLoading[row.id] 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-700'
                    }`}
                >
                    {emailSendingLoading[row.id] ? 'Sending...' : 'Send Email'}
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

    const generateOfferPdf = (row) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 14;
        const margin = 14;
        const lineHeight = 7;

        doc.setFontSize(18);
        doc.text('Offer Details', margin, y);
        y += lineHeight + 4;

        doc.setFontSize(11);
        doc.text(`Offer ID: ${row.id}`, margin, y);
        y += lineHeight;
        doc.text(`Date: ${new Date(row.createdAt).toLocaleString()}`, margin, y);
        y += lineHeight;
        doc.text(`Customer: ${row.customerFullName || ''}`, margin, y);
        y += lineHeight;
        doc.text(`Status: ${row.status || ''}`, margin, y);
        y += lineHeight + 6;

        const yachtsData = Array.isArray(row.yachts) && row.yachts.length > 0
            ? row.yachts.map(yacht => [yacht.name || '', yacht.model || '', yacht.countryCode || ''])
            : [[row.yachtName || '', row.yachtModel || '', row.countryCode || '']];
        autoTable(doc, {
            startY: y,
            head: [['Yacht Name', 'Model', 'Boat Registration']],
            body: yachtsData,
            margin: { left: margin },
            theme: 'grid',
        });
        y = doc.lastAutoTable.finalY + 10;

        const servicesData = Array.isArray(row.services) && row.services.length > 0
            ? row.services.map(s => [s.serviceName || s.label || '', String(s.priceInEuroWithoutVAT ?? '0') + ' €'])
            : (row.services && typeof row.services === 'object' ? [[row.services.serviceName || row.services.label || '', String(row.services.priceInEuroWithoutVAT ?? '0') + ' €']] : []);
        if (servicesData.length > 0) {
            if (y > 250) { doc.addPage(); y = 14; }
            autoTable(doc, {
                startY: y,
                head: [['Service Name', 'Price (€)']],
                body: servicesData,
                margin: { left: margin },
                theme: 'grid',
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        const partsData = Array.isArray(row.parts) && row.parts.length > 0
            ? row.parts.map(p => [p.label || p.name || p.partName || '', String(p.quantity ?? 1), String(p.pricePerUnit ?? '0') + ' €'])
            : [];
        if (partsData.length > 0) {
            if (y > 240) { doc.addPage(); y = 14; }
            autoTable(doc, {
                startY: y,
                head: [['Part Name', 'Quantity', 'Price per Unit (€)']],
                body: partsData,
                margin: { left: margin },
                theme: 'grid',
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        if (row.comment && String(row.comment).trim()) {
            if (y > 260) { doc.addPage(); y = 14; }
            doc.setFontSize(12);
            doc.text('Comments', margin, y);
            y += lineHeight;
            doc.setFontSize(10);
            const commentLines = doc.splitTextToSize(row.comment, pageWidth - 2 * margin);
            doc.text(commentLines, margin, y);
        }

        doc.save(`offer-${row.id}.pdf`);
    };

    const handleExportPdf = (row) => {
        setPdfExportLoading(prev => ({ ...prev, [row.id]: true }));
        try {
            generateOfferPdf(row);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setPdfExportLoading(prev => ({ ...prev, [row.id]: false }));
        }
    };

    const handleSendEmail = async (offerId) => {
        setSelectedOfferId(offerId);
        setEmailModalOpen(true);
    };

    const handleEmailSubmit = async () => {
        if (!emailAddress.trim()) {
            alert('Please enter an email address');
            return;
        }

        setEmailLoading(true);
        setEmailSendingLoading(prev => ({ ...prev, [selectedOfferId]: true }));
        try {
            const response = await axios.post(`${URL}/offer/${selectedOfferId}/send-email`, 
                { email: emailAddress },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.code === 200) {
                alert('Email sent successfully!');
                setEmailModalOpen(false);
                setEmailAddress('');
                setSelectedOfferId(null);
            } else {
                alert('Error sending email: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error sending email');
        } finally {
            setEmailLoading(false);
            setEmailSendingLoading(prev => ({ ...prev, [selectedOfferId]: false }));
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

    const exportToExcel = async () => {
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
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Offers');
        const headers = Object.keys(exportData[0] || {});
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'offers_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
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
                                        <Button className="w-full sm:w-auto bg-[#282828] text-white" onClick={exportToExcel}>
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

            {/* Email Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Send Offer PDF to Email</h3>
                        <input
                            type="email"
                            placeholder="Enter email address"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="text" 
                                color="red" 
                                onClick={() => {
                                    setEmailModalOpen(false);
                                    setEmailAddress('');
                                    setSelectedOfferId(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                color="green" 
                                onClick={handleEmailSubmit}
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConfirmedOffersPage;