"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { statusStyles } from '@/utils/statusStyles';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useAppSelector } from '@/lib/hooks';
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
    const [users, setUsers] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [yachts, setYachts] = useState([]);
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

    const [formData, setFormData] = useState({
        customerFullName: '',
        yachtName: '',
        yachtModel: '',
        comment: '',
        countryCode: '',
        services: {},
        parts: [],
        status: 'created'
    });

    const [createServiceFormData, setCreateServiceFormData] = useState({
        serviceName: '',
        priceInEuroWithoutVAT: '',
        unitsOfMeasurement: '',
    });

    const [createPartFormData, setCreatePartFormData] = useState({
        name: '',
        quantity: '',
        inventory: '',
        comment: '',
        countryCode: '',
        pricePerUnit: '',
        serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' }
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
        services: {},
        parts: [],
        status: 'created'
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
        fullName: ''
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
                    onClick={() => openCreateOrderModal(row)}
                    className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
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
            await axios.post(`${URL}/warehouse/create`, createPartFormData);

            getWareHouse()
                .then((res) => setParts(res));

            setCreatePartFormData({
                name: '',
                quantity: '',
                inventory: '',
                comment: '',
                countryCode: '',
                serviceCategory: [{ serviceName: '', priceInEuroWithoutVAT: '' }],
                pricePerUnit: ''
            });
            
            setCreatePartModalIsOpen(false); 

        } catch (error) {
            console.error(error);
        }
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingCreateOffer(true);
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

            console.log('Form Data:', formData);
            console.log('Offer Data being sent:', offerData);

            if (editMode) {
                console.log('Sending PUT request with data:', JSON.stringify(offerData));
                await axios.put(`${URL}/offer/${editId}`, offerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                console.log('Sending POST request with data:', JSON.stringify(offerData));
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
                    services: {},
                    parts: [],
                    status: 'created'
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
        } catch (error) {
            console.error('Error creating offer:', error);
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
        setEditFormData({
            customerFullName: row.customerFullName,
            yachtName: row.yachtName,
            yachtModel: row.yachtModel,
            comment: row.comment || '',
            countryCode: row.countryCode,
            services: row.services || {},
            parts: row.parts,
            status: row.status
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
        setModalIsOpen(true);
    };

    const closeCreateModal = () => {
        setModalIsOpen(false);
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

    const openCreatePartModal = () => {
        setCreatePartModalIsOpen(true);
    };

    const closeCreatePartModal = () => {
        setCreatePartModalIsOpen(false);
        setCreatePartFormData({
            name: '',
            quantity: '',
            inventory: '',
            comment: '',
            countryCode: '',
            serviceCategory: [{ serviceName: '', priceInEuroWithoutVAT: '' }]
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value, name) => {
        console.log('Select Change:', { name, value });
        setFormData({ ...formData, [name]: value });
    };

    const handlePartChange = (e) => {
        const { name, value } = e.target; 
        setCreatePartFormData({ ...createPartFormData, [name]: value });
    };

    const handleSelectChangePart = (value, name) => {
        if(name === 'unitsOfMeasurement' && !value){
            setCreatePartFormData({ ...createPartFormData, [name]: '1' });
        } else {
            setCreatePartFormData({ ...createPartFormData, [name]: value });
        }
    };

    const createOrder = async () => {
        if (!selectedRow) {
            console.error("Ошибка: Не выбрана строка с данными заказа!");
            return;
        }

        const { id, customerId } = selectedRow;

        if (!id || !customerId) {
            console.error("Ошибка: Недостаточно данных для создания заказа!");
            return;
        }

        if (!createOrderFormData.length) {
            console.error("Ошибка: Не выбраны пользователи для заказа!");
            return;
        }

        try {
            const response = await axios.post(`${URL}/orders/create`, {
                userId: createOrderFormData,
                offerId: id,
                customerId,
            });

            console.log("Заказ успешно создан:", response.data);
            closeCreateOrderModal();
            router.push('/orders');
        } catch (error) {
            console.error("Ошибка при создании заказа:", error.response ? error.response.data : error.message);
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
            link.href = url;
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

    const partOptions = parts.map((part) => ({
        value: part.id,
        label: part.name,
        quantity: '1',
        pricePerUnit: part.pricePerUnit,
    }));

    const closeEditModal = () => {
        setEditModalIsOpen(false);
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

    const handleYachtSelect = (selectedYacht) => {
        if (selectedYacht) {
            setFormData({
                ...formData,
                yachtName: selectedYacht.name,
                yachtModel: selectedYacht.model,
                countryCode: selectedYacht.countryCode || '',
                yachtId: selectedYacht.id
            });
        } else {
            setFormData({
                ...formData,
                yachtName: '',
                yachtModel: '',
                countryCode: '',
                yachtId: ''
            });
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([getData(), getDataCatagory(), getWareHouse(), getUsers(), getWorkers(), getYachts()])
            .then(([res1, res2, res3, res4, res5, res6]) => {
                setData(res1 || []);
                setCatagoryData(res2 || []);
                setParts(res3 || []);
                setUsers(res4 || []);
                setWorkers(res5 || []);
                setYachts(res6 || []);
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
            fullName: ''
        });
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCreateCustomerFormData({ ...createCustomerFormData, [name]: value });
    };

    const createCustomer = async (e) => {
        e.preventDefault();
        setCreateCustomerLoading(true);
        try {
            await axios.post(`${URL}/auth/register/client`, createCustomerFormData);
            
            // Refresh users list after creating customer
            const updatedUsers = await getUsers();
            setUsers(updatedUsers || []);
            
            // Update user options
            if (updatedUsers && updatedUsers.length > 0) {
                const options = updatedUsers.map(user => ({ value: user.id, label: user.fullName }));
                setUserOptions(options);
            }
            
            closeCreateCustomerModal();
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Error creating customer. Please try again.');
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
                                <Button onClick={openCreateModal} color="blue" className="w-full sm:w-auto">
                                    Create
                                </Button>
                                <Button onClick={handleHistoryClick} color="green" className="w-full sm:w-auto">
                                History
                            </Button>
                            <Button onClick={handleConfirmedOffersClick} color="orange" className="w-full sm:w-auto">
                                Confirmed Offers
                            </Button>
                            <Button color="purple" className="w-full sm:w-auto" onClick={exportToExcel}>
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
                                        <th>Yacht Name</th>
                                        <th>Yacht Model</th>
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
                                            <td>{row.yachtName}</td>
                                            <td>{row.yachtModel}</td>
                                            <td>{row.countryCode}</td>
                                            <td>{row.status}</td>
                                            <td>{row.services && Object.keys(row.services).length > 0 ? `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€` : 'N/A'}</td>
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
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}
                <CreateOfferModal
                    isOpen={modalIsOpen}
                    onClose={closeCreateModal}
                    onSubmit={handleSubmit}
                    formData={formData}
                    handleChange={handleChange}
                    handleSelectChange={handleSelectChange}
                    userOptions={userOptions}
                    catagoryData={catagoryData}
                    partOptions={partOptions}
                    openCreateServiceModal={openCreateServiceModal}
                    openCreatePartModal={openCreatePartModal}
                    openCreateCustomerModal={openCreateCustomerModal}
                    loading={loadingCreateOffer}
                    yachts={yachts}
                    handleYachtSelect={handleYachtSelect}
                />
                <EditOfferModal
                    isOpen={editModalIsOpen}
                    onClose={closeEditModal}
                    onSubmit={handleEditSubmit}
                    formData={editFormData}
                    handleChange={handleEditChange}
                    handleSelectChange={handleEditSelectChange}
                    userOptions={userOptions}
                    catagoryData={catagoryData}
                    partOptions={partOptions}
                    openCreateServiceModal={openCreateServiceModal}
                    openCreatePartModal={openCreatePartModal}
                    openCreateCustomerModal={openCreateCustomerModal}
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
                <Modal isOpen={createPartModalIsOpen} onClose={closeCreatePartModal} title="Create Part">  
                    <form onSubmit={createPart} className="space-y-4 overflow-y-auto h-full" style={{ height: '400px', overflowY: 'auto' }}>
                        <Input
                            label="Name"
                            name="name"
                            value={createPartFormData.name}
                            onChange={handlePartChange}
                            required
                        />
                        <Input
                            label="Quantity"
                            name="quantity"
                            value={createPartFormData.quantity}
                            onChange={handlePartChange}
                            required
                        />  
                        <Input
                            label="Price Per Unit"
                            name="pricePerUnit"
                            value={createPartFormData.pricePerUnit}
                            onChange={handlePartChange}
                            required
                        /> 
                        <Input
                            label="Comment"
                            name="comment"
                            value={createPartFormData.comment}
                            onChange={handlePartChange}
                            required
                        /> 
                        <Input
                            label="Boat Registration"
                            name="countryCode"
                            value={createPartFormData.countryCode}
                            onChange={handlePartChange}
                            required
                        />
                        <Select
                            label="Service Category"
                            value={createPartFormData.serviceCategory}
                            onChange={(value) => handleSelectChangePart(value, 'serviceCategory')}
                            required
                            className="text-black" 
                            labelProps={{ className: "text-black" }}
                        >
                            {catagoryData.map((category) => (
                                <Option key={category.id} value={category} className="text-black">
                                    {`${category.serviceName} - ${category.priceInEuroWithoutVAT}€`}
                                </Option>
                            ))}
                        </Select>
                        <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeCreatePartModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                <span>Create</span>
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
                <Modal isOpen={createCustomerModalIsOpen} onClose={closeCreateCustomerModal} title="Create Customer">
                    <form onSubmit={createCustomer} className="space-y-4">
                        <Input
                            label="Email"
                            name="email"
                            value={createCustomerFormData.email}
                            onChange={handleCustomerChange}
                            required
                        />
                        <Input
                            label="Full Name"
                            name="fullName"
                            value={createCustomerFormData.fullName}
                            onChange={handleCustomerChange}
                            required
                        />
                        <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeCreateCustomerModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                <span>Create</span>
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </>
    );
};

export default OfferPage;