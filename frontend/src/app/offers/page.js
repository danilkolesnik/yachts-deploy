"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { statusStyles } from '@/utils/statusStyles';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon, InformationCircleIcon, DocumentArrowDownIcon, EnvelopeIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'react-toastify';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import Header from '@/component/header';
import ReactSelect from 'react-select';
import Link from 'next/link';
import CreateOfferModal from '@/component/modal/CreateOfferModal';
import EditOfferModal from '@/component/modal/EditOfferModal';
import ExcelJS from 'exceljs';
import { ClipLoader } from 'react-spinners';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const OfferPage = () => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [catagoryData, setCatagoryData] = useState([]);
    const [parts, setParts] = useState([]);
    const [partsUnofficially, setPartsUnofficially] = useState([]);
    const [users, setUsers] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [yachts, setYachts] = useState([]);
    const [filteredYachts, setFilteredYachts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [createOrderModalIsOpen, setCreateOrderModalIsOpen] = useState(false);
    const [createServiceModalIsOpen, setCreateServiceModalIsOpen] = useState(false);
    const [createPartModalIsOpen, setCreatePartModalIsOpen] = useState(false);
    const [role, setRole] = useState(null);
    const [pdfExportLoading, setPdfExportLoading] = useState({});
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [emailSendingLoading, setEmailSendingLoading] = useState({});
    const [loadingCreateOffer, setLoadingCreateOffer] = useState(false);
    const [loadingCreateService, setLoadingCreateService] = useState(false);
    const [loadingCreatePart, setLoadingCreatePart] = useState(false);
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    // New states for part creation
    const [createPartForOffer, setCreatePartForOffer] = useState(false);
    const [partForOfferQuantity, setPartForOfferQuantity] = useState(1);
    const [partWarehouseQuantity, setPartWarehouseQuantity] = useState(0);
    const [isCreatingPartForCurrentOffer, setIsCreatingPartForCurrentOffer] = useState(false);

    // State for manual/help
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');

    // History modal states
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        date: '',
        year: '',
        month: '',
        boatName: '',
        ownerName: ''
    });
    const [filteredHistoryData, setFilteredHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState([]);

    const [formData, setFormData] = useState({
        customerFullName: '',
        yachtName: '',
        yachtModel: '',
        comment: '',
        countryCode: '',
        yachts: [],
        services: [],
        parts: [],
        status: 'created',
        language: 'en'
    });

    const [createServiceFormData, setCreateServiceFormData] = useState({
        serviceName: '',
        priceInEuroWithoutVAT: '',
        unitsOfMeasurement: '',
    });

    const [createPartFormData, setCreatePartFormData] = useState({
        name: '',
        quantity: '',
        warehouse: 'official',
        comment: '',
        countryCode: '',
        pricePerUnit: '',
        serviceCategoryId: '',
    });

    const id = useAppSelector(state => state.userData?.id);
    
    const [createOrderFormData, setCreateOrderFormData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [userOptions, setUserOptions] = useState([]);
    const [workerOptions, setWorkerOptions] = useState([]);
    const [editModalIsOpen, setEditModalIsOpen] = useState(false);

    const [editFormData, setEditFormData] = useState({
        customerFullName: '',
        yachtName: '',
        yachtModel: '',
        comment: '',
        countryCode: '',
        yachts: [],
        services: [],
        parts: [],
        status: 'created',
        language: 'en'
    });

    const [filters, setFilters] = useState({
        searchCriteria: 'id',
        searchValue: '',
        date: ''
    });

    const tableRef = useRef(null);

    const [createCustomerModalIsOpen, setCreateCustomerModalIsOpen] = useState(false);
    const [createCustomerLoading, setCreateCustomerLoading] = useState(false);
    const [createCustomerFormData, setCreateCustomerFormData] = useState({
        email: '',
        fullName: '',
        address: '',
        yachtName: '',
        yachtModel: '',
        location: '',
        countryCode: '',
        repairTime: '',
        owner: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerAddress: '',
        engineCount: '',
        engines: [],
        hasGenerators: '',
        generatorCount: '',
        generators: [],
        hasAirConditioners: '',
        airConditionerCount: '',
        airConditioners: [],
        description: ''
    });

    // Help/Manual content in English
    const helpSections = {
        overview: {
            title: "Offers Management - User Manual",
            content: [
                "Welcome to the Offers Management System. Create and manage offers for yacht services and parts.",
                "Each offer links a customer, yacht(s), services, and parts. Use filters to find offers by date, customer, or yacht name.",
                "Use the Help button anytime to open this manual."
            ]
        },
        creating: {
            title: "Creating an Offer",
            content: [
                "**Required:** At least one yacht must be selected.",
                "**Step-by-Step:**",
                "• Select customer (full name) to load their yachts",
                "• Select one or more yachts",
                "• Add services from the price list (optional)",
                "• Add parts from official or unofficial warehouse (optional)",
                "• Add comment if needed, then click Create",
                "",
                "You can create new services or parts from the modal via the links."
            ]
        },
        table: {
            title: "Understanding the Offers Table",
            content: [
                "**ID** - Click to open offer details",
                "**Date** - When the offer was created",
                "**Customer** - Customer full name",
                "**Yachts** - Yacht name and model",
                "**Boat Registration** - Country/registration code",
                "**Status** - created, confirmed, finished, etc.",
                "**Service Category** - Services in the offer",
                "**Parts** - Parts in the offer",
                "**Actions** - Edit, Delete, Work Order, Export PDF, Send Email"
            ]
        },
        history: {
            title: "History and Confirmed Offers",
            content: [
                "**History** - Shows finished and confirmed offers. Filter by date, year, month, boat name, or owner. Export PDF or send email from the table.",
                "**Confirmed Offers** - Opens the list of confirmed offers.",
                "**Export to Excel** - Downloads the current filtered list of offers."
            ]
        }
    };

    // History table columns
    const historyColumns = [
        {
            name: 'ID',
            selector: row => `#${row.id}`,
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
            selector: row => {
                if (Array.isArray(row.yachts) && row.yachts.length > 0) {
                    return row.yachts.map(yacht => yacht.name).join(', ');
                } else if (row.yachtName) {
                    return row.yachtName;
                }
                return '';
            },
            sortable: true,
        },
        {
            name: 'Owner Name',
            selector: row => {
                if (Array.isArray(row.yachts) && row.yachts.length > 0) {
                    const owners = row.yachts.map(yacht => yacht.userName).filter(Boolean);
                    return owners.length > 0 ? owners.join(', ') : row.customerFullName || '';
                }
                return row.customerFullName || '';
            },
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
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2 ml-[60px]">
                    <button
                        onClick={() => handleHistoryExportPdf(row)}
                        disabled={pdfExportLoading[row.id]}
                        className={`px-3 py-1 text-white rounded flex items-center justify-center min-w-[60px] ${
                            pdfExportLoading[row.id] 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-500 hover:bg-green-700'
                        }`}
                    >
                        {pdfExportLoading[row.id] ? '...' : 'PDF'}
                    </button>
                    <button
                        onClick={() => handleHistorySendEmail(row.id)}
                        disabled={emailSendingLoading[row.id]}
                        className={`px-3 py-1 text-white rounded flex items-center justify-center min-w-[60px] ${
                            emailSendingLoading[row.id] 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-orange-500 hover:bg-orange-700'
                        }`}
                    >
                        {emailSendingLoading[row.id] ? '...' : 'Email'}
                    </button>
                    <button
                        onClick={() => handlePrintOffer(row)}
                        className="px-3 py-1 text-white rounded bg-blue-500 hover:bg-blue-700 flex items-center justify-center min-w-[60px]"
                    >
                        Print
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        },
    ];

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
            name: 'Yachts',
            selector: row => {
                if (Array.isArray(row.yachts) && row.yachts.length > 0) {
                    return row.yachts.map(yacht => `${yacht.name} - ${yacht.model}`).join(', ');
                } else if (row.yachtName) {
                    return `${row.yachtName} - ${row.yachtModel}`;
                }
                return '';
            },
            sortable: true,
        },
        {
            name: 'Boat Registration',
            selector: row => {
                if (Array.isArray(row.yachts) && row.yachts.length > 0) {
                    return row.yachts.map(yacht => yacht.countryCode).join(', ');
                } else if (row.countryCode) {
                    return row.countryCode;
                }
                return '';
            },
            sortable: true,
        },
        { name: 'Status', selector: row => row.status, sortable: true, cell: row => (
            <span style={{
                ...statusStyles[row.status],
                padding: '5px 10px',
                borderRadius: '5px'
            }}>
                {row.status} 
            </span>
        ) },
        {
            name: 'Service Category',
            selector: row => {
                if (Array.isArray(row.services) && row.services.length > 0) {
                    return row.services.map(service => service.label ?? service.serviceName ?? '').filter(Boolean).join('; ');
                } else if (row.services && Object.keys(row.services).length > 0) {
                    return row.services.label ?? row.services.serviceName ?? '';
                }
                return '';
            },
            sortable: true,
        },
        {
            name: 'Parts',
            selector: row => Array.isArray(row.parts) 
                ? row.parts.map(part => part.label).join(', ') 
                : '',
            sortable: true,
        },
        ...(role !== 'user' ? [{
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(row)}
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
        ...(role !== 'user' ? [{
            name: '',
            cell: row => (
                <button
                    onClick={() => row.status !== 'confirmed' || row.status !== 'finished' && openCreateOrderModal(row)}
                    disabled={row.status === 'confirmed'}
                    className={`px-2 py-2 text-white rounded transition-all duration-200 ${
                        row.status === 'confirmed' || row.status === 'finished'
                            ? 'bg-[#dd3333] opacity-50 cursor-not-allowed' 
                            : 'bg-[#dd3333] hover:bg-[#c42d2d] cursor-pointer'
                    }`}
                >
                    Work Order
                </button>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        }] : []),
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

    // Functions for history modal
    const openHistoryModal = async () => {
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${URL}/offer`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }   
            });
            const finishedOffers = (res.data.data || []).filter(offer => offer.status === 'finished' || offer.status === 'confirmed');
            setHistoryData(finishedOffers);
            setFilteredHistoryData(finishedOffers);
        } catch (error) {
            console.error('Error loading history:', error);
            toast.error("Error loading history data");
        } finally {
            setHistoryLoading(false);
        }
    };

    const closeHistoryModal = () => {
        setHistoryModalOpen(false);
        setHistoryFilters({
            date: '',
            year: '',
            month: '',
            boatName: '',
            ownerName: ''
        });
        setFilteredHistoryData([]);
    };

    const handleHistoryFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...historyFilters, [name]: value };
        setHistoryFilters(newFilters);
        
        // Apply filters
        applyHistoryFilters(newFilters);
    };

    const applyHistoryFilters = (filters) => {
        let filtered = historyData;

        if (filters.date) {
            const filterDate = new Date(filters.date);
            filtered = filtered.filter(offer => {
                const offerDate = new Date(offer.createdAt);
                return offerDate.toDateString() === filterDate.toDateString();
            });
        }

        if (filters.year) {
            filtered = filtered.filter(offer => {
                const offerYear = new Date(offer.createdAt).getFullYear().toString();
                return offerYear === filters.year;
            });
        }

        if (filters.month) {
            filtered = filtered.filter(offer => {
                const offerMonth = (new Date(offer.createdAt).getMonth() + 1).toString();
                return offerMonth === filters.month;
            });
        }

        if (filters.boatName) {
            const searchTerm = filters.boatName.toLowerCase();
            filtered = filtered.filter(offer => {
                if (Array.isArray(offer.yachts) && offer.yachts.length > 0) {
                    return offer.yachts.some(yacht => 
                        yacht.name.toLowerCase().includes(searchTerm)
                    );
                } else if (offer.yachtName) {
                    return offer.yachtName.toLowerCase().includes(searchTerm);
                }
                return false;
            });
        }

        if (filters.ownerName) {
            const searchTerm = filters.ownerName.toLowerCase();
            filtered = filtered.filter(offer => {
                // Search in customer name
                if (offer.customerFullName && offer.customerFullName.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in yacht owners
                if (Array.isArray(offer.yachts)) {
                    return offer.yachts.some(yacht => 
                        yacht.userName && yacht.userName.toLowerCase().includes(searchTerm)
                    );
                }
                return false;
            });
        }

        setFilteredHistoryData(filtered);
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
            ? row.parts.map(p => [p.label || p.name || '', String(p.quantity ?? 1), String(p.pricePerUnit ?? '0') + ' €'])
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

    const handleHistoryExportPdf = (row) => {
        setPdfExportLoading(prev => ({ ...prev, [row.id]: true }));
        try {
            generateOfferPdf(row);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error("Error exporting PDF");
        } finally {
            setPdfExportLoading(prev => ({ ...prev, [row.id]: false }));
        }
    };

    const handleHistorySendEmail = async (offerId) => {
        setSelectedOfferId(offerId);
        setEmailModalOpen(true);
    };

    const handlePrintOffer = (row) => {
        // Create a print-friendly version of the offer
        const printContent = `
            <html>
                <head>
                    <title>Offer #${row.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .section { margin-bottom: 30px; }
                        .status { 
                            display: inline-block; 
                            padding: 5px 10px; 
                            border-radius: 5px; 
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <h1>Offer Details</h1>
                    
                    <div class="section">
                        <h2>Basic Information</h2>
                        <p><strong>Offer ID:</strong> ${row.id}</p>
                        <p><strong>Date:</strong> ${new Date(row.createdAt).toLocaleString()}</p>
                        <p><strong>Customer:</strong> ${row.customerFullName || ''}</p>
                        <p><strong>Status:</strong> <span class="status" style="${statusStyles[row.status]?.backgroundColor ? `background-color: ${statusStyles[row.status].backgroundColor}; color: ${statusStyles[row.status].color}` : ''}">${row.status}</span></p>
                    </div>

                    <div class="section">
                        <h2>Yacht Information</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Yacht Name</th>
                                    <th>Model</th>
                                    <th>Boat Registration</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(row.yachts) && row.yachts.length > 0 ? 
                                    row.yachts.map(yacht => `
                                        <tr>
                                            <td>${yacht.name || ''}</td>
                                            <td>${yacht.model || ''}</td>
                                            <td>${yacht.countryCode || ''}</td>
                                        </tr>
                                    `).join('') : `
                                    <tr>
                                        <td>${row.yachtName || ''}</td>
                                        <td>${row.yachtModel || ''}</td>
                                        <td>${row.countryCode || ''}</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h2>Services</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Service Name</th>
                                    <th>Price (€)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(row.services) && row.services.length > 0 ? 
                                    row.services.map(service => `
                                        <tr>
                                            <td>${service.serviceName || service.label || ''}</td>
                                            <td>${service.priceInEuroWithoutVAT || '0'} €</td>
                                        </tr>
                                    `).join('') : `
                                    <tr>
                                        <td>${row.services?.serviceName || ''}</td>
                                        <td>${row.services?.priceInEuroWithoutVAT || '0'} €</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h2>Parts</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Part Name</th>
                                    <th>Quantity</th>
                                    <th>Price per Unit (€)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(row.parts) && row.parts.length > 0 ? 
                                    row.parts.map(part => `
                                        <tr>
                                            <td>${part.label || part.name || ''}</td>
                                            <td>${part.quantity || 1}</td>
                                            <td>${part.pricePerUnit || '0'} €</td>
                                        </tr>
                                    `).join('') : `
                                    <tr>
                                        <td colspan="3">No parts</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    ${row.comment ? `
                    <div class="section">
                        <h2>Comments</h2>
                        <p>${row.comment}</p>
                    </div>
                    ` : ''}

                    <div class="section">
                        <p><strong>Printed on:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Months for dropdown
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    // Generate years (last 10 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => ({
        value: (currentYear - i).toString(),
        label: (currentYear - i).toString()
    }));

    // Functions for Select dropdowns in history modal
    const handleHistorySelectChange = (value, name) => {
        const newFilters = { ...historyFilters, [name]: value };
        setHistoryFilters(newFilters);
        applyHistoryFilters(newFilters);
    };

    const getServerMessage = (payload, fallback) => {
        const message = payload?.message;
        if (Array.isArray(message)) {
            return message.join(', ');
        }
        if (typeof message === 'string' && message.trim() !== '') {
            return message;
        }
        return fallback;
    };

    const hasServerBusinessError = (response, fallbackMessage) => {
        const responseCode = response?.data?.code;
        if (typeof responseCode === 'number' && responseCode >= 400) {
            toast.error(getServerMessage(response?.data, fallbackMessage));
            return true;
        }
        return false;
    };

    const showServerError = (error, fallbackMessage) => {
        if (error?.response?.status === 400) {
            toast.error(getServerMessage(error.response.data, fallbackMessage));
            return;
        }
        if (error?.response?.data?.code === 400) {
            toast.error(getServerMessage(error.response.data, fallbackMessage));
            return;
        }
        toast.error(getServerMessage(error?.response?.data, error?.message || fallbackMessage));
    };

    // Rest of your existing functions remain the same...
    const getData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${URL}/offer`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }   
            });
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getDataCatagory = async () => {
        try {
            const res = await axios.get(`${URL}/priceList`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getWareHouse = async () => {
        try {
            const res = await axios.get(`${URL}/warehouse/in-stock`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getWareHouseUnofficially = async () => {
        try {
            const res = await axios.get(`${URL}/warehouse/in-stock-unofficially`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getUsers = async () => {
        try {
            const res = await axios.get(`${URL}/users/role/user`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getWorkers = async () => {
        try {
            const res = await axios.get(`${URL}/users/role/worker`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const getYachts = async () => {
        try {
            const res = await axios.get(`${URL}/yachts`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        }
    };

    const createService = async (e) => {
        e.preventDefault();
        setLoadingCreateService(true);
        try {
            const response = await axios.post(`${URL}/priceList/create`, createServiceFormData);
            if (hasServerBusinessError(response, "Error creating service")) {
                return;
            }
            const updatedCategories = await getDataCatagory();
            setCatagoryData(updatedCategories || []);
            setCreateServiceFormData({
                serviceName: '',
                priceInEuroWithoutVAT: '',
                unitsOfMeasurement: '',
            });
            setCreateServiceModalIsOpen(false);
            toast.success("Service created successfully");
        } catch (error) {
            console.error(error);
            showServerError(error, "Error creating service");
        } finally {
            setLoadingCreateService(false);
        }
    };

    const createPart = async (e) => {
        e.preventDefault();
        // Commented out: serviceCategory is no longer used for part creation
        // const selectedServiceCategory = catagoryData.find(
        //     (category) => String(category.id) === String(createPartFormData.serviceCategoryId)
        // );

        // if (!selectedServiceCategory) {
        //     toast.error("Error: Service category is required");
        //     return;
        // }

        let totalQuantity = 0;
        if (createPartForOffer) {
            totalQuantity = parseInt(partWarehouseQuantity || 0) + parseInt(partForOfferQuantity || 1);
        } else {
            totalQuantity = parseInt(createPartFormData.quantity || 0);
        }

        if (Number.isNaN(totalQuantity) || totalQuantity <= 0) {
            toast.error("Error: Quantity must be greater than 0");
            return;
        }

        setLoadingCreatePart(true);
        try {
            const isUnofficialWarehouse = createPartFormData.warehouse === 'unofficial';

            const partData = {
                name: createPartFormData.name,
                quantity: totalQuantity,
                warehouse: createPartFormData.warehouse,
                comment: createPartFormData.comment,
                countryCode: createPartFormData.countryCode || '',
                pricePerUnit: createPartFormData.pricePerUnit,
                unofficially: isUnofficialWarehouse
            };

            const response = await axios.post(`${URL}/warehouse/create`, partData);
            if (hasServerBusinessError(response, "Error creating part")) {
                return;
            }
            const createdPart = response.data.data;

            if (createPartForOffer && isCreatingPartForCurrentOffer) {
                const partForOffer = {
                    value: createdPart.id,
                    label: createdPart.name,
                    pricePerUnit: createdPart.pricePerUnit,
                    quantity: partForOfferQuantity || 1,
                    unofficially: isUnofficialWarehouse
                };

                setFormData(prev => ({
                    ...prev,
                    parts: [...prev.parts, partForOffer]
                }));
                
                toast.success(`Part created and ${partForOfferQuantity} unit(s) added to offer`);
            } else {
                toast.success("Part added to warehouse");
            }

            const warehouseResponse = await getWareHouse();
            const warehouseUnofficialResponse = await getWareHouseUnofficially();
            setParts(warehouseResponse || []);
            setPartsUnofficially(warehouseUnofficialResponse || []);

            setCreatePartFormData({
                name: '',
                quantity: '',
                warehouse: 'official',
                comment: '',
                countryCode: '',
                pricePerUnit: '',
                serviceCategoryId: '',
            });
            setPartWarehouseQuantity(0);
            setPartForOfferQuantity(1);
            setCreatePartForOffer(false);
            setIsCreatingPartForCurrentOffer(false);
            setCreatePartModalIsOpen(false);

        } catch (error) {
            console.error('Error creating part:', error);
            showServerError(error, "Error creating part");
        } finally {
            setLoadingCreatePart(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingCreateOffer(true);

        const normalizedServices = Array.isArray(formData.services)
            ? formData.services.map(service => service?.value ?? service).filter(Boolean)
            : [];

        const normalizedParts = Array.isArray(formData.parts) ? formData.parts : [];

        switch (true) {
            case !Array.isArray(formData.yachts) || formData.yachts.length === 0:
                toast.error("Error: At least one yacht is required");
                setLoadingCreateOffer(false);
                return;
            // case normalizedServices.length === 0:
            //     toast.error("Error: At least one service is required");
            //     setLoadingCreateOffer(false);
            //     return;
            // case normalizedParts.length === 0:
            //     toast.error("Error: Parts are required");
            //     setLoadingCreateOffer(false);
            //     return;
        }
        try {
            const token = localStorage.getItem('token');
            const offerData = { 
                ...formData, 
                userId: id,
                customerId: id,
                services: normalizedServices,
                parts: normalizedParts,
                price: 0,
                description: formData.comment || ''
            };

            if (editMode) {
                const response = await axios.put(`${URL}/offer/${editId}`, offerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (hasServerBusinessError(response, "Error updating offer")) {
                    return;
                }
            } else {
                const response = await axios.post(`${URL}/offer`, offerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (hasServerBusinessError(response, "Error creating offer")) {
                    return;
                }
                setFormData({
                    customerFullName: '',
                    yachtName: '',
                    yachtModel: '',
                    comment: '',
                    countryCode: '',
                    yachts: [],
                    services: [],
                    parts: [],
                    status: 'created',
                    language: 'en'
                });
            }
            getData()
                .then((res) => {
                    setData(res);
                });

            setModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
            toast.success(editMode ? "Offer updated successfully" : "Offer created successfully");
        } catch (error) {
            console.error('Error creating offer:', error);
            showServerError(error, "Error creating offer");
        } finally {
            setLoadingCreateOffer(false);
        }
    };

    const handleEdit = (row) => {
        setSelectedRow({
            id: row.id,
            customerFullName: row.customerFullName,
            yachtName: row.yachtName,
            yachtModel: row.yachtModel,
            countryCode: row.countryCode,
            status: row.status,
            services: row.services,
            parts: row.parts,
        });
        
        const selectedCustomer = users.find(user => user.fullName === row.customerFullName);
        if (selectedCustomer) {
            const customerYachts = yachts.filter(yacht => 
                yacht.userId === selectedCustomer.id || yacht.userName === selectedCustomer.fullName
            );
            setFilteredYachts(customerYachts);
        } else {
            setFilteredYachts([]);
        }
        
        setEditFormData({
            customerFullName: row.customerFullName,
            yachtName: row.yachtName,
            yachtModel: row.yachtModel,
            comment: row.comment || '',
            countryCode: row.countryCode,
            yachts: Array.isArray(row.yachts) ? row.yachts : (row.yachtName ? [{ 
                id: '', 
                name: row.yachtName, 
                model: row.yachtModel, 
                countryCode: row.countryCode,
                userId: '',
                userName: ''
            }] : []),
            services: Array.isArray(row.services) ? row.services : (row.services ? [row.services] : []),
            parts: row.parts,
            status: row.status,
            language: row.language || 'en'
        });
        setEditMode(true);
        setEditId(row.id);
        setEditModalIsOpen(true);
    };

    const handleDelete = (id) => {
        setOfferToDelete(id);
        setDeleteConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!offerToDelete) return;
        
        setDeleting(true);
        try {
            await axios.post(`${URL}/offer/delete/${offerToDelete}`);
            getData()
                .then((res) => {
                    setData(res);
                });
            toast.success("Offer deleted successfully");
            setDeleteConfirmModalOpen(false);
            setOfferToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Error deleting offer");
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmModalOpen(false);
        setOfferToDelete(null);
    };

    const openCreateModal = () => {
        setEditMode(false);
        setEditId(null);
        setFilteredYachts([]);
        setModalIsOpen(true);
    };

    const closeCreateModal = () => {
        setModalIsOpen(false);
        setFilteredYachts([]);
    };

    const openCreateOrderModal = (row) => {
        setSelectedRow(row);
        setCreateOrderFormData([]);
        setCreateOrderModalIsOpen(true);
    };

    const closeCreateOrderModal = () => {
        setCreateOrderModalIsOpen(false);
    };

    const openCreateServiceModal = () => {
        setCreateServiceModalIsOpen(true);
    };

    const closeCreateServiceModal = () => {
        setCreateServiceModalIsOpen(false);
    };

    const openCreatePartModal = (forOffer = false) => {
        setIsCreatingPartForCurrentOffer(forOffer);
        setCreatePartForOffer(forOffer);
        setCreatePartModalIsOpen(true);
    };

    const closeCreatePartModal = () => {
        setCreatePartModalIsOpen(false);
        setCreatePartFormData({
            name: '',
            quantity: '',
            warehouse: 'official',
            comment: '',
            countryCode: '',
            pricePerUnit: '',
            serviceCategoryId: '',
        });
        setPartWarehouseQuantity(0);
        setPartForOfferQuantity(1);
        setCreatePartForOffer(false);
        setIsCreatingPartForCurrentOffer(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'customerFullName') {
            const selectedCustomer = users.find(user => user.fullName === value);
            if (selectedCustomer) {
                const customerYachts = yachts.filter(yacht => 
                    yacht.userId === selectedCustomer.id || yacht.userName === selectedCustomer.fullName
                );
                setFilteredYachts(customerYachts);
            } else {
                setFilteredYachts([]);
            }
        }
        
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value, name) => {
        setFormData({ ...formData, [name]: value });
    };

    const handlePartChange = (e) => {
        const { name, value } = e.target; 
        setCreatePartFormData({ ...createPartFormData, [name]: value });
    };

    const handleSelectChangePart = (value, name) => {
        setCreatePartFormData({ ...createPartFormData, [name]: value });
    };

    const createOrder = async () => {
        if (!selectedRow) {
            toast.error("Error: No row selected for order!");
            return;
        }

        const { id, customerId } = selectedRow;

        if (!id || !customerId) {
            toast.error("Error: Not enough data to create an order!");
            return;
        }

        if (!createOrderFormData.length) {
            toast.error("Error: No users selected for order!");
            return;
        }

        try {
            const response = await axios.post(`${URL}/orders/create`, {
                userId: createOrderFormData,
                offerId: id,
                customerId,
            });
            toast.success("Order created successfully");
            closeCreateOrderModal();
            router.push('/orders');
        } catch (error) {
            toast.error("Error creating order");
        }
    };

    const handleExportPdf = (row) => {
        setPdfExportLoading(prev => ({ ...prev, [row.id]: true }));
        try {
            generateOfferPdf(row);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error("Error exporting PDF");
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

    const handleConfirmedOffersClick = () => {
        router.push('/offers/confirmed');
    };

    const combinedParts = [...parts, ...partsUnofficially].map(part => ({
        value: part.id,
        label: part.name,
        pricePerUnit: part.pricePerUnit,
        quantity: '1',
        unofficially: part.unofficially || false
    }));

    const serviceCategoryOptions = catagoryData.map((category) => ({
        value: String(category.id),
        label: `${category.serviceName} - ${category.priceInEuroWithoutVAT}€`,
    }));

    const closeEditModal = () => {
        setEditModalIsOpen(false);
        setFilteredYachts([]);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const offerData = { ...editFormData, userId: id };
            await axios.put(`${URL}/offer/${editId}`, offerData);
            getData()
                .then((res) => {
                    setData(res);
                });

            setEditModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'customerFullName') {
            const selectedCustomer = users.find(user => user.fullName === value);
            if (selectedCustomer) {
                const customerYachts = yachts.filter(yacht => 
                    yacht.userId === selectedCustomer.id || yacht.userName === selectedCustomer.fullName
                );
                setFilteredYachts(customerYachts);
            } else {
                setFilteredYachts([]);
            }
        }
        
        if (name in editFormData) {
            setEditFormData({ ...editFormData, [name]: value });
        }
    };

    const handleEditSelectChange = (value, name) => {
        setEditFormData({ ...editFormData, [name]: value });
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
            'Yachts': Array.isArray(row.yachts) && row.yachts.length > 0 
                ? row.yachts.map(yacht => `${yacht.name} - ${yacht.model}`).join(', ')
                : (row.yachtName ? `${row.yachtName} - ${row.yachtModel}` : ''),
            'Boat Registration': Array.isArray(row.yachts) && row.yachts.length > 0 
                ? row.yachts.map(yacht => yacht.countryCode).join(', ')
                : (row.countryCode || ''),
            Status: row.status,
            'Service Category': Array.isArray(row.services) && row.services.length > 0 
                ? row.services.map(service => `${service.serviceName}, ${service.priceInEuroWithoutVAT}€`).join('; ')
                : (row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : ''),
            Parts: Array.isArray(row.parts) ? row.parts.map(part => part.label || part.name).join(', ') : ''
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

    const handleYachtSelect = (selectedYachts) => {
        if (selectedYachts && Array.isArray(selectedYachts)) {
            setFormData({
                ...formData,
                yachts: selectedYachts.map(yacht => ({
                    id: yacht.id,
                    name: yacht.name,
                    model: yacht.model,
                    countryCode: yacht.countryCode || '',
                    userId: yacht.userId || '',
                    userName: yacht.userName || ''
                }))
            });
        } else {
            setFormData({
                ...formData,
                yachts: []
            });
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([getData(), getDataCatagory(), getWareHouse(), getUsers(), getWorkers(), getYachts(), getWareHouseUnofficially()])
            .then(([res1, res2, res3, res4, res5, res6, res7]) => {
                setData(res1 || []);
                setCatagoryData(res2 || []);
                setParts(res3 || []);
                setUsers(res4 || []);
                setWorkers(res5 || []);
                setYachts(res6 || []);
                setPartsUnofficially(res7 || []);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (workers.length > 0) {
            const options = workers.map(worker => ({ value: worker.id, label: worker.fullName }));
            setWorkerOptions(options);
        }
    }, [workers]);

    useEffect(() => {
        if (users.length > 0) {
            const options = users.map(user => ({ value: user.id, label: user.fullName }));
            setUserOptions(options);
        }
    }, [users]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('role');
            setRole(storedRole);
        }
    }, []);

    const openCreateCustomerModal = () => {
        setCreateCustomerModalIsOpen(true);
    };

    const closeCreateCustomerModal = () => {
        setCreateCustomerModalIsOpen(false);
        setCreateCustomerFormData({
            email: '',
            fullName: '',
            address: '',
            yachtName: '',
            yachtModel: '',
            location: '',
            countryCode: '',
            repairTime: '',
            owner: '',
            ownerEmail: '',
            ownerPhone: '',
            ownerAddress: '',
            engineCount: '',
            engines: [],
            hasGenerators: '',
            generatorCount: '',
            generators: [],
            hasAirConditioners: '',
            airConditionerCount: '',
            airConditioners: [],
            description: ''
        });
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCreateCustomerFormData({ ...createCustomerFormData, [name]: value });
    };

    const handleCustomerEngineCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const engines = Array.from({ length: numCount }, (_, i) => 
            createCustomerFormData.engines[i] || { model: '', hours: '' }
        );
        setCreateCustomerFormData({ ...createCustomerFormData, engineCount: count, engines });
    };

    const handleCustomerEngineChange = (index, field, value) => {
        const engines = [...createCustomerFormData.engines];
        engines[index] = { ...engines[index], [field]: value };
        setCreateCustomerFormData({ ...createCustomerFormData, engines });
    };

    const handleCustomerGeneratorCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const generators = Array.from({ length: numCount }, (_, i) => 
            createCustomerFormData.generators[i] || { model: '', hours: '' }
        );
        setCreateCustomerFormData({ ...createCustomerFormData, generatorCount: count, generators });
    };

    const handleCustomerGeneratorChange = (index, field, value) => {
        const generators = [...createCustomerFormData.generators];
        generators[index] = { ...generators[index], [field]: value };
        setCreateCustomerFormData({ ...createCustomerFormData, generators });
    };

    const handleCustomerAirConditionerCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const airConditioners = Array.from({ length: numCount }, (_, i) => 
            createCustomerFormData.airConditioners[i] || { model: '', hours: '' }
        );
        setCreateCustomerFormData({ ...createCustomerFormData, airConditionerCount: count, airConditioners });
    };

    const handleCustomerAirConditionerChange = (index, field, value) => {
        const airConditioners = [...createCustomerFormData.airConditioners];
        airConditioners[index] = { ...airConditioners[index], [field]: value };
        setCreateCustomerFormData({ ...createCustomerFormData, airConditioners });
    };

    const createCustomer = async (e) => {
        e.preventDefault();
        setCreateCustomerLoading(true);
        try {
            const customerData = {
                email: createCustomerFormData.email,
                fullName: createCustomerFormData.fullName
            };
            
            const customerResponse = await axios.post(`${URL}/auth/register/client`, customerData);
            
            if (customerResponse.data.code === 201) {
                const customer = customerResponse.data.data;
                
                const yachtData = {
                    name: createCustomerFormData.yachtName,
                    model: createCustomerFormData.yachtModel,
                    countryCode: createCustomerFormData.countryCode,
                    repairTime: createCustomerFormData.repairTime || '',
                    owner: createCustomerFormData.owner || '',
                    ownerEmail: createCustomerFormData.ownerEmail || '',
                    ownerPhone: createCustomerFormData.ownerPhone || '',
                    ownerAddress: createCustomerFormData.ownerAddress || '',
                    engineCount: createCustomerFormData.engineCount || '',
                    engines: createCustomerFormData.engines || [],
                    hasGenerators: createCustomerFormData.hasGenerators || '',
                    generatorCount: createCustomerFormData.generatorCount || '',
                    generators: createCustomerFormData.generators || [],
                    hasAirConditioners: createCustomerFormData.hasAirConditioners || '',
                    airConditionerCount: createCustomerFormData.airConditionerCount || '',
                    airConditioners: createCustomerFormData.airConditioners || [],
                    description: createCustomerFormData.description || '',
                    userId: customer.id,
                    userName: customer.fullName
                };
                
                await axios.post(`${URL}/yachts`, yachtData);
                
                const [updatedUsers, updatedYachts] = await Promise.all([
                    getUsers(),
                    getYachts()
                ]);
                
                setUsers(updatedUsers || []);
                setYachts(updatedYachts || []);
                
                if (updatedUsers && updatedUsers.length > 0) {
                    const options = updatedUsers.map(user => ({ value: user.id, label: user.fullName }));
                    setUserOptions(options);
                }
                
                closeCreateCustomerModal();
                toast.success("Customer and yacht created successfully!");
            } else {
                throw new Error(customerResponse.data.message || 'Failed to create customer');
            }
        } catch (error) {
            console.error('Error creating customer and yacht:', error);
            toast.error("Error creating customer and yacht. Please try again.");
        } finally {
            setCreateCustomerLoading(false);
        }
    };

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
                        <div className="relative flex flex-col lg:flex-row justify-between gap-4 mb-4 p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <div className="w-full sm:w-auto">
                                        <Select
                                            label="Search by"
                                            value={filters.searchCriteria}
                                            onChange={(value) => setFilters({ ...filters, searchCriteria: value })}
                                            className="text-gray-700 border-gray-300 rounded-md w-full"
                                            labelProps={{ className: 'text-gray-700 text-sm font-medium' }}
                                            containerProps={{ className: 'min-w-[140px] w-full sm:w-auto' }}
                                        >
                                            <Option className="text-gray-700" value="id">Yacht Name</Option>
                                            <Option className="text-gray-700" value="customer">Customer</Option>
                                        </Select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.searchValue}
                                        onChange={(e) => setFilters({ ...filters, searchValue: e.target.value })}
                                        className="border border-gray-300 px-3 py-2 text-gray-700 rounded-md w-full sm:w-56 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                    className="border border-gray-300 px-3 py-2 text-gray-700 rounded-md h-10 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    lang="en"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto justify-end">
                                {/* Help Button */}
                                {role !== 'user' && (
                                    <Button 
                                        onClick={() => setHelpModalOpen(true)}
                                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <QuestionMarkCircleIcon className="w-5 h-5" />
                                        <span>Help</span>
                                    </Button>
                                )}
                                
                                {role !== 'user' && (
                                <>
                                <Button 
                                    onClick={openCreateModal} 
                                    className="w-full sm:w-auto bg-[#dd3333] hover:bg-[#c42d2d] text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
                                >
                                    Create
                                </Button>
                                {/* Modified History Button */}
                                <Button 
                                    onClick={openHistoryModal} 
                                    className="bg-[white] w-full sm:w-auto border-2 border-[#dd3333] text-[#000] font-medium px-4 py-2 rounded-md transition-colors duration-200"
                                >
                                    History
                                </Button>
                                <Button 
                                    onClick={handleConfirmedOffersClick} 
                                    className="w-full sm:w-auto bg-[#3e4a66] hover:bg-[#2d3748] text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
                                >
                                    Confirmed Offers
                                </Button>
                                <Button 
                                    className="w-full sm:w-auto bg-[#282828] hover:bg-[#1a1a1a] text-white font-medium px-4 py-2 rounded-md transition-colors duration-200" 
                                    onClick={exportToExcel}
                                >
                                    Export to Excel
                                </Button>
                                </>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table ref={tableRef} style={{ display: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Yachts</th>
                                        <th>Boat Registration</th>
                                        <th>Status</th>
                                        <th>Service Category</th>
                                        <th>Parts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.id}</td>
                                            <td>{new Date(row.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</td>
                                            <td>{row.customerFullName || ''}</td>
                                            <td>
                                                {Array.isArray(row.yachts) && row.yachts.length > 0 
                                                    ? row.yachts.map(yacht => `${yacht.name} - ${yacht.model}`).join(', ')
                                                    : (row.yachtName ? `${row.yachtName} - ${row.yachtModel}` : '')
                                                }
                                            </td>
                                            <td>
                                                {Array.isArray(row.yachts) && row.yachts.length > 0 
                                                    ? row.yachts.map(yacht => yacht.countryCode).join(', ')
                                                    : (row.countryCode || '')
                                                }
                                            </td>
                                            <td>{row.status}</td>
                                            <td>
                                                {Array.isArray(row.services) && row.services.length > 0 
                                                    ? row.services.map(service => `${service.serviceName}, ${service.priceInEuroWithoutVAT}€`).join('; ')
                                                    : (row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : '')
                                                }
                                            </td>
                                            <td>{Array.isArray(row.parts) ? row.parts.map(part => part.label || part.name).join(', ') : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <DataTable
                                columns={columns}
                                data={filteredData}
                                pagination
                                highlightOnHover
                                pointerOnHover
                                onRowClicked={(row) => router.push(`/offers/${row.id}`)}
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}
                {/* Help/Manual Modal */}
                <Modal 
                    isOpen={helpModalOpen} 
                    onClose={() => setHelpModalOpen(false)} 
                    title="Offers Management Help & User Manual"
                    size="xl"
                >
                    <div className="max-h-[70vh] overflow-hidden flex flex-col">
                        <div className="border-b pb-4 mb-4">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {Object.keys(helpSections).map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setActiveHelpSection(section)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                                            activeHelpSection === section
                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {helpSections[section].title.split(' ').slice(0, 3).join(' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {helpSections[activeHelpSection].title}
                                </h2>
                                <div className="space-y-3 text-gray-600">
                                    {helpSections[activeHelpSection].content.map((item, index) => {
                                        if (item.includes('**')) {
                                            const parts = item.split(/(\*\*.*?\*\*)/g);
                                            return (
                                                <p key={index} className="text-sm leading-relaxed">
                                                    {parts.map((part, i) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return (
                                                                <span key={i} className="font-semibold text-gray-800">
                                                                    {part.slice(2, -2)}
                                                                </span>
                                                            );
                                                        }
                                                        return part;
                                                    })}
                                                </p>
                                            );
                                        }
                                        if (item.startsWith('•')) {
                                            return (
                                                <div key={index} className="flex items-start">
                                                    <span className="mr-2 text-gray-400">•</span>
                                                    <span className="text-sm leading-relaxed">{item.substring(1)}</span>
                                                </div>
                                            );
                                        }
                                        if (item === '') {
                                            return <div key={index} className="h-3" />;
                                        }
                                        return (
                                            <p key={index} className="text-sm leading-relaxed">
                                                {item}
                                            </p>
                                        );
                                    })}
                                </div>
                                {activeHelpSection === 'overview' && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold text-blue-700 mb-2">Quick Start</h3>
                                        <ul className="space-y-2 text-sm text-blue-600">
                                            <li>Use <strong>Search</strong> and <strong>Date</strong> to filter offers</li>
                                            <li>Click <strong>Create</strong> to add a new offer</li>
                                            <li>Use <strong>History</strong> for finished/confirmed offers</li>
                                            <li>Use <strong>Export to Excel</strong> to download the list</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <Button variant="text" color="gray" onClick={() => setHelpModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>
                <Modal 
                    isOpen={historyModalOpen} 
                    onClose={closeHistoryModal} 
                    title="Offer History"
                    size="xl"
                >
                    <div className="space-y-6 h-full" style={{ height: '400px', overflowY: 'auto' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg w-full">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={historyFilters.date}
                                    onChange={handleHistoryFilterChange}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <Select
                                    value={historyFilters.year}
                                    onChange={(value) => handleHistorySelectChange(value, 'year')}
                                    className="border-gray-300 rounded-md text-black"
                                    labelProps={{ className: 'hidden' }}
                                >
                                    <Option value="">All Years</Option>
                                    {years.map(year => (
                                        <Option key={year.value} value={year.value}>
                                            {year.label}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Month
                                </label>
                                <Select
                                    value={historyFilters.month}
                                    onChange={(value) => handleHistorySelectChange(value, 'month')}
                                    className="border-gray-300 rounded-md [&>div]:text-black"
                                    labelProps={{ className: 'hidden' }}
                                >
                                    <Option value="">All Months</Option>
                                    {months.map(month => (
                                        <Option key={month.value} value={month.value}>
                                            {month.label}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Boat Name
                                </label>
                                <input
                                    type="text"
                                    name="boatName"
                                    value={historyFilters.boatName}
                                    onChange={handleHistoryFilterChange}
                                    placeholder="Search by boat name..."
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Owner Name
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={historyFilters.ownerName}
                                    onChange={handleHistoryFilterChange}
                                    placeholder="Search by owner name..."
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        {/* Results Count */}
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Found {filteredHistoryData.length} offer(s)
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="text"
                                    color="gray"
                                    size="sm"
                                    onClick={() => {
                                        setHistoryFilters({
                                            date: '',
                                            year: '',
                                            month: '',
                                            boatName: '',
                                            ownerName: ''
                                        });
                                        setFilteredHistoryData(historyData);
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                        
                        {/* History Table */}
                        {historyLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader loading={historyLoading} />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={historyColumns}
                                    data={filteredHistoryData}
                                    pagination
                                    paginationPerPage={10}
                                    paginationRowsPerPageOptions={[10, 25, 50]}
                                    highlightOnHover
                                    pointerOnHover
                                    className="min-w-full border-collapse"
                                    responsive
                                    noDataComponent={
                                        <div className="text-center py-12 text-gray-500">
                                            No offers found matching your criteria
                                        </div>
                                    }
                                />
                            </div>
                        )}
                        
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                variant="text"
                                color="red"
                                onClick={closeHistoryModal}
                                className="mr-2"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* The rest of your modals remain unchanged */}
                <CreateOfferModal
                    isOpen={modalIsOpen}
                    onClose={closeCreateModal}
                    onSubmit={handleSubmit}
                    formData={formData}
                    handleChange={handleChange}
                    handleSelectChange={handleSelectChange}
                    userOptions={userOptions}
                    catagoryData={catagoryData}
                    partOptions={combinedParts}
                    openCreateServiceModal={openCreateServiceModal}
                    openCreatePartModal={() => openCreatePartModal(true)}
                    openCreateCustomerModal={openCreateCustomerModal}
                    loading={loadingCreateOffer}
                    yachts={formData.customerFullName ? filteredYachts : []}
                    handleYachtSelect={handleYachtSelect}
                />
                
                {/* Other modals remain the same as before... */}
                <EditOfferModal
                    isOpen={editModalIsOpen}
                    onClose={closeEditModal}
                    onSubmit={handleEditSubmit}
                    formData={editFormData}
                    handleChange={handleEditChange}
                    handleSelectChange={handleEditSelectChange}
                    userOptions={userOptions}
                    catagoryData={catagoryData}
                    partOptions={combinedParts}
                    openCreateServiceModal={openCreateServiceModal}
                    openCreatePartModal={openCreatePartModal}
                    openCreateCustomerModal={openCreateCustomerModal}
                    yachts={editFormData.customerFullName ? filteredYachts : []}
                    handleYachtSelect={handleYachtSelect}
                />
                <Modal isOpen={createOrderModalIsOpen} onClose={closeCreateOrderModal} title="Create Order">
                    <div className="space-y-4">
                        <ReactSelect
                            options={workerOptions}
                            onChange={selectedOptions => setCreateOrderFormData(selectedOptions || [])}
                            placeholder="Assign Employees..."
                            isClearable
                            isSearchable
                            isMulti
                            className="mb-4"
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                            }}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="text" color="red" onClick={closeCreateOrderModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={createOrder}>
                                <span>Create</span>
                            </Button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={createServiceModalIsOpen} onClose={closeCreateServiceModal} title="Create Service">
                    <form onSubmit={createService} className="space-y-4">
                        <Input
                            label="Service Name"
                            name="serviceName"
                            value={createServiceFormData.serviceName}
                            onChange={(e) => setCreateServiceFormData({...createServiceFormData, serviceName: e.target.value})}
                            required
                        />
                        <Input
                            label="Price in Euro Without VAT"
                            name="priceInEuroWithoutVAT"
                            value={createServiceFormData.priceInEuroWithoutVAT}
                            onChange={(e) => setCreateServiceFormData({...createServiceFormData, priceInEuroWithoutVAT: e.target.value})}
                            required
                        />
                        <Select
                            label="Units of Measurement"
                            value={createServiceFormData.unitsOfMeasurement}
                            onChange={(value) => setCreateServiceFormData({ ...createServiceFormData, unitsOfMeasurement: value })}
                            className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                            labelProps={{ className: 'text-black' }}
                            required
                        >
                            <Option className="text-black" value="">Select...</Option>
                            <Option className="text-black" value="pcs.">pcs. (pieces)</Option>
                            <Option className="text-black" value="hrs.">hrs. (hours)</Option>
                        </Select>
                        <div className="flex justify-end">
                            <Button type="button" variant="text" color="red" onClick={closeCreateServiceModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit" disabled={loadingCreateService}>
                                {loadingCreateService ? <ClipLoader size={13} color={"#123abc"} /> : <span>Create</span>}
                            </Button>
                        </div>
                    </form>
                </Modal>
                <Modal 
                    isOpen={createPartModalIsOpen} 
                    onClose={closeCreatePartModal} 
                    title={createPartForOffer ? "Create Part for Offer" : "Add Part to Warehouse"}
                >  
                    <form onSubmit={createPart} className="space-y-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                        <Input
                            label="Part Name"
                            name="name"
                            value={createPartFormData.name}
                            onChange={handlePartChange}
                            required
                        />
                        
                        <Select
                            label="Warehouse"
                            name="warehouse"
                            value={createPartFormData.warehouse}
                            onChange={(value) => handleSelectChangePart(value, 'warehouse')}
                            required
                            className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                            labelProps={{ className: 'text-black' }}
                        >
                            <Option value="official" className="text-black">Official Warehouse</Option>
                            <Option value="unofficial" className="text-black">Unofficial Warehouse</Option>
                        </Select>
                        
                        {createPartForOffer && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Quantity for Warehouse"
                                        name="warehouseQuantity"
                                        type="number"
                                        min="1"
                                        value={partWarehouseQuantity}
                                        onChange={(e) => setPartWarehouseQuantity(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Quantity for This Offer"
                                        name="offerQuantity"
                                        type="number"
                                        min="1"
                                        value={partForOfferQuantity}
                                        onChange={(e) => setPartForOfferQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Total created: {parseInt(partWarehouseQuantity || 0) + parseInt(partForOfferQuantity || 1)} units
                                </p>
                            </>
                        )}
                        
                        {!createPartForOffer && (
                            <Input
                                label="Quantity for Warehouse"
                                name="quantity"
                                type="number"
                                min="1"
                                value={createPartFormData.quantity}
                                onChange={handlePartChange}
                                required
                            />
                        )}
                        
                        <Input
                            label="Price Per Unit (€)"
                            name="pricePerUnit"
                            type="number"
                            step="0.01"
                            value={createPartFormData.pricePerUnit}
                            onChange={handlePartChange}
                            required
                        />
                        
                        <Input
                            label="Comment"
                            name="comment"
                            value={createPartFormData.comment}
                            onChange={handlePartChange}
                        />
                        
                        <div className="flex justify-end">
                            <Button type="button" variant="text" color="red" onClick={closeCreatePartModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit" disabled={loadingCreatePart}>
                                {loadingCreatePart ? <ClipLoader size={13} color={"#123abc"} /> : (createPartForOffer ? "Create & Add to Offer" : "Add to Warehouse")}
                            </Button>
                        </div>
                    </form>
                </Modal>
                <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Send Email">
                    <div className="space-y-4">
                        <Input
                            label="Email Address"
                            name="emailAddress"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            required
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="text" color="red" onClick={() => setEmailModalOpen(false)} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={handleEmailSubmit}>
                                <span>Send</span>
                            </Button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete offer <strong>#{offerToDelete}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                                variant="text" 
                                color="gray" 
                                onClick={cancelDelete}
                                disabled={deleting}
                                className="mr-2"
                            >
                                <span>No, Cancel</span>
                            </Button>
                            <Button 
                                color="red" 
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <div className="flex items-center gap-2">
                                        <ClipLoader size={13} color={"#ffffff"} />
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    <span>Yes, Delete</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={createCustomerModalIsOpen} onClose={closeCreateCustomerModal} title="Create Customer & Yacht">
                    <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                        <form onSubmit={createCustomer} className="space-y-4">
                            <div className="border-b pb-2 mb-4">
                                <h3 className="text-lg font-semibold text-black">Customer Information</h3>
                            </div>
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={createCustomerFormData.email}
                                onChange={handleCustomerChange}
                                required
                            />
                            <Input
                                label="Customer Name"
                                name="fullName"
                                value={createCustomerFormData.fullName}
                                onChange={handleCustomerChange}
                                required
                            />
                            <Input
                                label="Address"
                                name="address"
                                value={createCustomerFormData.address}
                                onChange={handleCustomerChange}
                            />
                            
                            <div className="border-b pb-2 mb-4 mt-6">
                                <h3 className="text-lg font-semibold text-black">Yacht Information</h3>
                            </div>
                            <Input
                                label="Yacht Name"
                                name="yachtName"
                                value={createCustomerFormData.yachtName}
                                onChange={handleCustomerChange}
                                required
                            />
                            <Input
                                label="Model"
                                name="yachtModel"
                                value={createCustomerFormData.yachtModel}
                                onChange={handleCustomerChange}
                                required
                            />
                            <Input
                                label="Boat Registration"
                                name="countryCode"
                                value={createCustomerFormData.countryCode}
                                onChange={handleCustomerChange}
                                required
                            />
                            
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-semibold text-black">Owner Contacts</h3>
                                <Input
                                    label="Owner"
                                    name="owner"
                                    value={createCustomerFormData.owner}
                                    onChange={handleCustomerChange}
                                />
                                <div className="space-y-2">
                                    <h4 className="text-md font-medium text-black">Contact(s) details</h4>
                                    <Input
                                        label="Email"
                                        name="ownerEmail"
                                        type="email"
                                        value={createCustomerFormData.ownerEmail}
                                        onChange={handleCustomerChange}
                                    />
                                    <Input
                                        label="Phone"
                                        name="ownerPhone"
                                        type="tel"
                                        value={createCustomerFormData.ownerPhone}
                                        onChange={handleCustomerChange}
                                    />
                                    <Input
                                        label="Address"
                                        name="ownerAddress"
                                        value={createCustomerFormData.ownerAddress}
                                        onChange={handleCustomerChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-semibold text-black">Engine Hours (Motors)</h3>
                                <Select
                                    label="Number of Motors"
                                    value={createCustomerFormData.engineCount}
                                    onChange={handleCustomerEngineCountChange}
                                    className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                    labelProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">Select...</Option>
                                    <Option className="text-black" value="1">1</Option>
                                    <Option className="text-black" value="2">2</Option>
                                    <Option className="text-black" value="3">3</Option>
                                    <Option className="text-black" value="4">4</Option>
                                    <Option className="text-black" value="5">5</Option>
                                </Select>
                                {createCustomerFormData.engineCount && parseInt(createCustomerFormData.engineCount) > 0 && (
                                    <div className="space-y-4 pl-4 border-l-2">
                                        {createCustomerFormData.engines.map((engine, index) => (
                                            <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                <h4 className="font-medium text-black">Motor {index + 1}</h4>
                                                <Input
                                                    label="Engine Model"
                                                    value={engine.model || ''}
                                                    onChange={(e) => handleCustomerEngineChange(index, 'model', e.target.value)}
                                                />
                                                <Input
                                                    label="Hours / Run time / Mileage (Hours)"
                                                    type="number"
                                                    value={engine.hours || ''}
                                                    onChange={(e) => handleCustomerEngineChange(index, 'hours', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-semibold text-black">Generators</h3>
                                <Select
                                    label="Generator(s)"
                                    value={createCustomerFormData.hasGenerators}
                                    onChange={(value) => {
                                        setCreateCustomerFormData({ 
                                            ...createCustomerFormData, 
                                            hasGenerators: value,
                                            generatorCount: value === 'Yes' ? createCustomerFormData.generatorCount : '',
                                            generators: value === 'Yes' ? createCustomerFormData.generators : []
                                        });
                                    }}
                                    className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                    labelProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">Select...</Option>
                                    <Option className="text-black" value="Yes">Yes</Option>
                                    <Option className="text-black" value="No">No</Option>
                                </Select>
                                {createCustomerFormData.hasGenerators === 'Yes' && (
                                    <>
                                        <Select
                                            label="Number of Generators"
                                            value={createCustomerFormData.generatorCount}
                                            onChange={handleCustomerGeneratorCountChange}
                                            className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                            labelProps={{ className: 'text-black' }}
                                        >
                                            <Option className="text-black" value="">Select...</Option>
                                            <Option className="text-black" value="1">1</Option>
                                            <Option className="text-black" value="2">2</Option>
                                            <Option className="text-black" value="3">3</Option>
                                            <Option className="text-black" value="4">4</Option>
                                            <Option className="text-black" value="5">5</Option>
                                        </Select>
                                        {createCustomerFormData.generatorCount && parseInt(createCustomerFormData.generatorCount) > 0 && (
                                            <div className="space-y-4 pl-4 border-l-2">
                                                {createCustomerFormData.generators.map((generator, index) => (
                                                    <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                        <h4 className="font-medium text-black">Generator {index + 1}</h4>
                                                        <Input
                                                            label="Generator Model"
                                                            value={generator.model || ''}
                                                            onChange={(e) => handleCustomerGeneratorChange(index, 'model', e.target.value)}
                                                        />
                                                        <Input
                                                            label="Hours / Run time / Mileage (Hours)"
                                                            type="number"
                                                            value={generator.hours || ''}
                                                            onChange={(e) => handleCustomerGeneratorChange(index, 'hours', e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-semibold text-black">Air Conditioners</h3>
                                <Select
                                    label="Air Conditioner(s)"
                                    value={createCustomerFormData.hasAirConditioners}
                                    onChange={(value) => {
                                        setCreateCustomerFormData({ 
                                            ...createCustomerFormData, 
                                            hasAirConditioners: value,
                                            airConditionerCount: value === 'Yes' ? createCustomerFormData.airConditionerCount : '',
                                            airConditioners: value === 'Yes' ? createCustomerFormData.airConditioners : []
                                        });
                                    }}
                                    className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                    labelProps={{ className: 'text-black' }}
                                >
                                    <Option className="text-black" value="">Select...</Option>
                                    <Option className="text-black" value="Yes">Yes</Option>
                                    <Option className="text-black" value="No">No</Option>
                                </Select>
                                {createCustomerFormData.hasAirConditioners === 'Yes' && (
                                    <>
                                        <Select
                                            label="Number of Air Conditioners"
                                            value={createCustomerFormData.airConditionerCount}
                                            onChange={handleCustomerAirConditionerCountChange}
                                            className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                            labelProps={{ className: 'text-black' }}
                                        >
                                            <Option className="text-black" value="">Select...</Option>
                                            <Option className="text-black" value="1">1</Option>
                                            <Option className="text-black" value="2">2</Option>
                                            <Option className="text-black" value="3">3</Option>
                                            <Option className="text-black" value="4">4</Option>
                                            <Option className="text-black" value="5">5</Option>
                                        </Select>
                                        {createCustomerFormData.airConditionerCount && parseInt(createCustomerFormData.airConditionerCount) > 0 && (
                                            <div className="space-y-4 pl-4 border-l-2">
                                                {createCustomerFormData.airConditioners.map((ac, index) => (
                                                    <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                        <h4 className="font-medium text-black">Air Conditioner {index + 1}</h4>
                                                        <Input
                                                            label="Air Conditioner Model"
                                                            value={ac.model || ''}
                                                            onChange={(e) => handleCustomerAirConditionerChange(index, 'model', e.target.value)}
                                                        />
                                                        <Input
                                                            label="Hours / Run time / Mileage (Hours)"
                                                            type="number"
                                                            value={ac.hours || ''}
                                                            onChange={(e) => handleCustomerAirConditionerChange(index, 'hours', e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <Input
                                label="Description"
                                name="description"
                                value={createCustomerFormData.description}
                                onChange={handleCustomerChange}
                            />
                            <div className="flex justify-end">
                                <Button variant="text" color="red" onClick={closeCreateCustomerModal} className="mr-1">
                                    <span>Cancel</span>
                                </Button>
                                <Button color="green" type="submit" disabled={createCustomerLoading}>
                                    {createCustomerLoading ? 'Creating...' : 'Create Customer & Yacht'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default OfferPage;