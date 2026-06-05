"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statusStyles } from '@/utils/statusStyles';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { downloadOfferPdf } from '@/utils/exportOfferPdf';
import { downloadInvoicePdfByOffer, sendInvoiceEmailByOffer } from '@/utils/exportInvoicePdf';
import { getCustomerEmailForOffer } from '@/utils/customerEmail';
import { sendOfferEmail } from '@/utils/sendOfferEmail';
import SendEmailModal from '@/ui/SendEmailModal';

const ConfirmedOffersPage = () => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [pdfExportLoading, setPdfExportLoading] = useState({});
    const [invoicePdfLoading, setInvoicePdfLoading] = useState({});
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailKind, setEmailKind] = useState('offer');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState({ name: '', email: '' });
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [emailSendingLoading, setEmailSendingLoading] = useState({});
    const session = useAppSelector((s) => s.userData?.session);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const reduxRole = useAppSelector((s) => s.userData?.role);

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
        ...(role !== 'user' ? [{
            name: '',
            cell: row => (
                <button
                    onClick={() => handleExportInvoicePdf(row)}
                    disabled={invoicePdfLoading[row.id]}
                    className={`px-2 py-2 text-white rounded ${
                        invoicePdfLoading[row.id]
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-800'
                    }`}
                >
                    {invoicePdfLoading[row.id] ? 'Generating...' : 'Invoice PDF'}
                </button>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
        ...(role !== 'user' ? [{
            name: '',
            cell: row => (
                <button
                    onClick={() => handleSendInvoiceEmail(row.id)}
                    disabled={emailSendingLoading[row.id]}
                    className={`px-2 py-2 text-white rounded ${
                        emailSendingLoading[row.id]
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-500 hover:bg-indigo-700'
                    }`}
                >
                    {emailSendingLoading[row.id] ? 'Sending...' : 'Send Invoice'}
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

    const handleExportPdf = async (row) => {
        setPdfExportLoading(prev => ({ ...prev, [row.id]: true }));
        try {
            await downloadOfferPdf(row.id);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please try again.');
        } finally {
            setPdfExportLoading(prev => ({ ...prev, [row.id]: false }));
        }
    };

    const handleExportInvoicePdf = async (row) => {
        setInvoicePdfLoading(prev => ({ ...prev, [row.id]: true }));
        try {
            await downloadInvoicePdfByOffer(row.id);
        } catch (error) {
            console.error('Error exporting invoice PDF:', error);
            alert('Error exporting invoice PDF. Please try again.');
        } finally {
            setInvoicePdfLoading(prev => ({ ...prev, [row.id]: false }));
        }
    };

    const openEmailModalForOffer = (offerId, kind) => {
        const offer = (data || []).find((row) => row.id === offerId);
        setEmailRecipient({
            name: offer?.customerFullName || '',
            email: getCustomerEmailForOffer(offer),
        });
        setEmailKind(kind);
        setSelectedOfferId(offerId);
        setEmailModalOpen(true);
    };

    const handleSendEmail = async (offerId) => {
        openEmailModalForOffer(offerId, 'offer');
    };

    const handleSendInvoiceEmail = (offerId) => {
        openEmailModalForOffer(offerId, 'invoice');
    };

    const handleEmailSubmit = async (payload) => {
        setEmailLoading(true);
        setEmailSendingLoading(prev => ({ ...prev, [selectedOfferId]: true }));
        try {
            const response = emailKind === 'invoice'
                ? await sendInvoiceEmailByOffer(selectedOfferId, payload)
                : await sendOfferEmail(selectedOfferId, payload);
            
            if (response.code === 200) {
                alert(emailKind === 'invoice' ? 'Invoice email sent successfully!' : 'Email sent successfully!');
                setEmailModalOpen(false);
                setEmailRecipient({ name: '', email: '' });
                setSelectedOfferId(null);
            } else {
                alert('Error sending email: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert(error.response?.data?.message || 'Error sending email');
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

    useEffect(() => {
        if (session !== true) return;
        const effectiveRole = reduxRole || role || localStorage.getItem('role');
        if (effectiveRole === 'client') {
            router.replace('/client/orders');
            return;
        }
        if (!can(permissions, PermissionsList.OFFERS_READ)) {
            const landing =
                can(permissions, PermissionsList.ORDERS_READ) ? '/orders'
                : can(permissions, PermissionsList.USERS_READ) ? '/yachts'
                : '/login';
            router.replace(landing);
        }
    }, [session, reduxRole, role, permissions, router]);

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

            <SendEmailModal
                isOpen={emailModalOpen}
                onClose={() => {
                    setEmailModalOpen(false);
                    setEmailRecipient({ name: '', email: '' });
                    setSelectedOfferId(null);
                }}
                title={emailKind === 'invoice' ? 'Send Invoice Email' : 'Send Email'}
                customerName={emailRecipient.name}
                customerEmail={emailRecipient.email}
                loading={emailLoading}
                onSend={handleEmailSubmit}
            />
        </>
    );
};

export default ConfirmedOffersPage;