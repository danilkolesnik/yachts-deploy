"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { statusStyles } from '@/utils/statusStyles';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
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
import * as XLSX from 'xlsx';

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
    
    // New states for part creation
    const [createPartForOffer, setCreatePartForOffer] = useState(false);
    const [partForOfferQuantity, setPartForOfferQuantity] = useState(1);
    const [partWarehouseQuantity, setPartWarehouseQuantity] = useState(0);
    const [isCreatingPartForCurrentOffer, setIsCreatingPartForCurrentOffer] = useState(false);

    // State for manual/help
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');

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

    // Customer creation modal state
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

    // Manual/Help content in English
    const helpSections = {
        overview: {
            title: "Offer Management System User Manual",
            content: [
                "Welcome to the Offer Management System! This manual will help you effectively use all system features.",
                "The system is designed for creating and managing yacht service offers, including parts inventory, services, and customer management.",
                "Use the 'Help' button in the top right corner for quick access to this manual at any time."
            ]
        },
        navigation: {
            title: "Table Navigation Guide",
            content: [
                "• **ID** - Offer number, click to view details",
                "• **Date** - Offer creation date",
                "• **Customer** - Customer name",
                "• **Yachts** - Yacht name and model",
                "• **Boat Registration** - Boat registration number",
                "• **Status** - Current offer status (color-coded)",
                "• **Service Category** - Services included in the offer",
                "• **Parts** - Parts included in the offer",
                "• **Actions** - Edit/Delete (admin only)",
                "• **Work Order** - Create work order from offer",
                "• **Export PDF** - Export offer as PDF",
                "• **Send Email** - Send offer via email"
            ]
        },
        statuses: {
            title: "Offer Statuses Explained",
            content: [
                "**created** 🟡 - Offer created but not sent to customer",
                "**sent** 🔵 - Offer sent to customer via email",
                "**confirmed** 🟢 - Customer confirmed the offer",
                "**rejected** 🔴 - Customer rejected the offer",
                "**in_progress** 🟠 - Work on the offer has started",
                "**completed** ✅ - All work completed"
            ]
        },
        filters: {
            title: "Filtering and Search",
            content: [
                "**Search by** - Select search criteria (Yacht Name or Customer)",
                "**Search...** - Enter text to search",
                "**Date** - Select date to filter by creation date",
                "Filters are applied automatically when values change"
            ]
        },
        buttons: {
            title: "Main Control Buttons",
            content: [
                "**Create** - Create new offer",
                "**History** - View offer history",
                "**Confirmed Offers** - View confirmed offers",
                "**Export to Excel** - Export data to Excel",
                "**Work Order** (in table) - Create work order from offer",
                "**Export PDF** (in table) - Generate PDF document",
                "**Send Email** (in table) - Send offer to customer"
            ]
        },
        creatingOffer: {
            title: "Creating an Offer - Step-by-Step Guide",
            content: [
                "1. **Select Customer** - from existing or create new",
                "2. **Select Yacht** - yachts are filtered by selected customer",
                "3. **Add Services** - choose from list or create new",
                "4. **Add Parts** - three options:",
                "   • Select from existing warehouse inventory",
                "   • Create new part for this offer (specify quantity for warehouse and offer)",
                "   • Add part to warehouse without linking to offer",
                "5. **Add Comment** - additional information",
                "6. **Click Create** - to save the offer"
            ]
        },
        partsManagement: {
            title: "Parts Management - Important Information",
            content: [
                "**Official Warehouse** - Parts with documents, warranty",
                "**Unofficial Warehouse** - Parts without documents, used",
                "**When creating part for offer:**",
                "• Specify total quantity of received parts",
                "• Specify how many are needed for this offer",
                "• Remaining quantity stays in warehouse",
                "**Example:** Received 10 parts, need 3 for offer → 3 in offer, 7 in warehouse"
            ]
        },
        emailSending: {
            title: "Sending Offer via Email",
            content: [
                "1. Click **Send Email** in the desired offer row",
                "2. Enter recipient's email address",
                "3. Click **Send**",
                "System will generate PDF and send it as attachment",
                "Email tracking available in offer history"
            ]
        },
        workOrders: {
            title: "Creating Work Orders",
            content: [
                "Work orders can only be created from **confirmed** offers",
                "To create work order:",
                "1. Find confirmed offer in table",
                "2. Click **Work Order** button",
                "3. Assign employees to the order",
                "4. Click **Create**",
                "Work order will be created and you'll be redirected to orders page"
            ]
        }
    };

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
            name: 'Yachts',
            selector: row => {
                if (Array.isArray(row.yachts) && row.yachts.length > 0) {
                    return row.yachts.map(yacht => `${yacht.name} - ${yacht.model}`).join(', ');
                } else if (row.yachtName) {
                    return `${row.yachtName} - ${row.yachtModel}`;
                }
                return 'N/A';
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
                return 'N/A';
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
                    onClick={() => row.status !== 'confirmed' && openCreateOrderModal(row)}
                    disabled={row.status === 'confirmed'}
                    className={`px-2 py-2 text-white rounded transition-all duration-200 ${
                        row.status === 'confirmed' 
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
                    onClick={() => handleExportPdf(row.id)}
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

    // Functions remain the same as before...
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
        try {
            await axios.post(`${URL}/priceList/create`, createServiceFormData);
            getDataCatagory()
                .then((res) => {
                    setCatagoryData(res);
                });
        } catch (error) {
            console.error(error);
        }
    };

    const createPart = async (e) => {
        e.preventDefault();
        try {
            let totalQuantity = 0;
            if (createPartForOffer) {
                totalQuantity = parseInt(partWarehouseQuantity || 0) + parseInt(partForOfferQuantity || 1);
            } else {
                totalQuantity = parseInt(createPartFormData.quantity || 0);
            }

            const partData = {
                name: createPartFormData.name,
                quantity: totalQuantity,
                warehouse: createPartFormData.warehouse,
                comment: createPartFormData.comment,
                countryCode: createPartFormData.countryCode || '',
                pricePerUnit: createPartFormData.pricePerUnit
            };

            const response = await axios.post(`${URL}/warehouse/create`, partData);
            const createdPart = response.data.data;

            if (createPartForOffer && isCreatingPartForCurrentOffer) {
                const partForOffer = {
                    value: createdPart.id,
                    label: createdPart.name,
                    pricePerUnit: createdPart.pricePerUnit,
                    quantity: partForOfferQuantity || 1,
                    unofficially: createPartFormData.warehouse === 'unofficial'
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
                pricePerUnit: ''
            });
            setPartWarehouseQuantity(0);
            setPartForOfferQuantity(1);
            setCreatePartForOffer(false);
            setIsCreatingPartForCurrentOffer(false);
            setCreatePartModalIsOpen(false);

        } catch (error) {
            console.error('Error creating part:', error);
            toast.error("Error creating part");
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingCreateOffer(true);

        switch (true) {
            case !Array.isArray(formData.yachts) || formData.yachts.length === 0:
                toast.error("Error: At least one yacht is required");
                return;
            case !Array.isArray(formData.services) || formData.services.length === 0:
                toast.error("Error: At least one service is required");
                return;
            case formData.parts.length === 0:
                toast.error("Error: Parts are required");
                return;
        }
        try {
            const token = localStorage.getItem('token');
            const offerData = { 
                ...formData, 
                userId: id,
                customerId: id,
                services: formData.services || {},
                parts: formData.parts || [],
                price: 0,
                description: formData.comment || ''
            };

            if (editMode) {
                await axios.put(`${URL}/offer/${editId}`, offerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                await axios.post(`${URL}/offer`, offerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
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
            setLoadingCreateOffer(false);
            toast.success("Offer created successfully");
        } catch (error) {
            console.error('Error creating offer:', error);
            toast.error("Error creating offer");
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

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/offer/delete/${id}`);
            getData()
                .then((res) => {
                    setData(res);
                });
        } catch (error) {
            console.error(error);
        }
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
            pricePerUnit: ''
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

    const handleHistoryClick = () => {
        router.push('/offersHistory');
    };

    const handleExportPdf = async (offerId) => {
        setPdfExportLoading(prev => ({ ...prev, [offerId]: true }));
        try {
            const response = await axios.get(`${URL}/offer/${offerId}/export-pdf`, {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = `${url}?${new Date().getTime()}`;
            link.setAttribute('download', `offer-${offerId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setPdfExportLoading(prev => ({ ...prev, [offerId]: false }));
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

    const exportToExcel = () => {
        const exportData = filteredData.map(row => ({
            ID: row.id,
            Date: new Date(row.createdAt).toLocaleString(),
            Customer: row.customerFullName || '',
            'Yachts': Array.isArray(row.yachts) && row.yachts.length > 0 
                ? row.yachts.map(yacht => `${yacht.name} - ${yacht.model}`).join(', ')
                : (row.yachtName ? `${row.yachtName} - ${row.yachtModel}` : 'N/A'),
            'Boat Registration': Array.isArray(row.yachts) && row.yachts.length > 0 
                ? row.yachts.map(yacht => yacht.countryCode).join(', ')
                : (row.countryCode || 'N/A'),
            Status: row.status,
            'Service Category': Array.isArray(row.services) && row.services.length > 0 
                ? row.services.map(service => `${service.serviceName}, ${service.priceInEuroWithoutVAT}€`).join('; ')
                : (row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : 'N/A'),
            Parts: Array.isArray(row.parts) ? row.parts.map(part => part.label || part.name).join(', ') : 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Offers');
        XLSX.writeFile(workbook, 'offers_export.xlsx');
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
                                <Button 
                                    onClick={handleHistoryClick} 
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
                                                    : (row.yachtName ? `${row.yachtName} - ${row.yachtModel}` : 'N/A')
                                                }
                                            </td>
                                            <td>
                                                {Array.isArray(row.yachts) && row.yachts.length > 0 
                                                    ? row.yachts.map(yacht => yacht.countryCode).join(', ')
                                                    : (row.countryCode || 'N/A')
                                                }
                                            </td>
                                            <td>{row.status}</td>
                                            <td>
                                                {Array.isArray(row.services) && row.services.length > 0 
                                                    ? row.services.map(service => `${service.serviceName}, ${service.priceInEuroWithoutVAT}€`).join('; ')
                                                    : (row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : 'N/A')
                                                }
                                            </td>
                                            <td>{Array.isArray(row.parts) ? row.parts.map(part => part.label || part.name).join(', ') : 'N/A'}</td>
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
                    title="System Help & User Manual"
                    size="xl"
                >
                    <div className="max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Navigation Sidebar */}
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
                        
                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {helpSections[activeHelpSection].title}
                                </h2>
                                
                                <div className="space-y-3 text-gray-600">
                                    {helpSections[activeHelpSection].content.map((item, index) => {
                                        // Check if item contains bold text (marked with **)
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
                                        
                                        // Regular bullet points
                                        if (item.startsWith('•')) {
                                            return (
                                                <div key={index} className="flex items-start">
                                                    <span className="mr-2 text-gray-400">•</span>
                                                    <span className="text-sm leading-relaxed">{item.substring(1)}</span>
                                                </div>
                                            );
                                        }
                                        
                                        // Regular paragraphs
                                        return (
                                            <p key={index} className="text-sm leading-relaxed">
                                                {item}
                                            </p>
                                        );
                                    })}
                                </div>
                                
                                {/* Quick Tips Section */}
                                {activeHelpSection === 'overview' && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                                            <h3 className="font-semibold text-blue-700">Quick Tips</h3>
                                        </div>
                                        <ul className="space-y-2 text-sm text-blue-600">
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Click on any offer ID to view detailed information</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use filters to quickly find specific offers</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Export data regularly for backup purposes</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Update offer status as work progresses</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Need more help? Contact system administrator
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="text"
                                    color="gray"
                                    onClick={() => setHelpModalOpen(false)}
                                    className="text-sm"
                                >
                                    Close
                                </Button>
                                <Button
                                    color="blue"
                                    onClick={() => {
                                        // Print functionality
                                        const printContent = `
                                            <html>
                                                <head>
                                                    <title>Offer System Manual - ${helpSections[activeHelpSection].title}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                                        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                                                        h2 { color: #555; margin-top: 20px; }
                                                        p { line-height: 1.6; }
                                                        ul { margin-left: 20px; }
                                                        li { margin-bottom: 5px; }
                                                        .tip { background: #f0f8ff; padding: 10px; border-left: 4px solid #007bff; margin: 15px 0; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <h1>${helpSections[activeHelpSection].title}</h1>
                                                    ${helpSections[activeHelpSection].content.map(item => 
                                                        item.startsWith('•') 
                                                            ? `<p>${item}</p>`
                                                            : `<p>${item}</p>`
                                                    ).join('')}
                                                    ${activeHelpSection === 'overview' ? `
                                                        <div class="tip">
                                                            <h3>Quick Tips</h3>
                                                            <ul>
                                                                <li>Click on any offer ID to view detailed information</li>
                                                                <li>Use filters to quickly find specific offers</li>
                                                                <li>Export data regularly for backup purposes</li>
                                                                <li>Update offer status as work progresses</li>
                                                            </ul>
                                                        </div>
                                                    ` : ''}
                                                </body>
                                            </html>
                                        `;
                                        
                                        const printWindow = window.open('', '_blank');
                                        printWindow.document.write(printContent);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }}
                                    className="text-sm"
                                >
                                    Print This Section
                                </Button>
                            </div>
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
                            onChange={handleSelectChange}
                            required
                        />
                        <Input
                            label="Price in Euro Without VAT"
                            name="priceInEuroWithoutVAT"
                            value={createServiceFormData.priceInEuroWithoutVAT}
                            onChange={handleSelectChange}
                            required
                        />
                        <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeCreateServiceModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                <span>Create</span>
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
                            <Option value="official">Official Warehouse</Option>
                            <Option value="unofficial">Unofficial Warehouse</Option>
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
                            <Button variant="text" color="red" onClick={closeCreatePartModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                {createPartForOffer ? "Create & Add to Offer" : "Add to Warehouse"}
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