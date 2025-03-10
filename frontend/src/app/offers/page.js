"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useAppSelector } from '@/lib/hooks';
import Header from '@/component/header';
import { useRouter } from 'next/navigation';
import ReactSelect from 'react-select';
import Link from 'next/link';


const OfferPage = () => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [catagoryData, setCatagoryData] = useState([]);
    const [parts, setParts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [createOrderModalIsOpen, setCreateOrderModalIsOpen] = useState(false);
    const [createServiceModalIsOpen, setCreateServiceModalIsOpen] = useState(false);
    const [createPartModalIsOpen, setCreatePartModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        customerFullName: '',
        yachtName: '',
        yachtModel: '',
        comment: '',
        countryCode: '',
        services: [],
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
        serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' }
    });

    const id = useAppSelector(state => state.userData?.id);
    

    const [createOrderFormData, setCreateOrderFormData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [userOptions, setUserOptions] = useState([]);

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
            name: 'Country Code',
            selector: row => row.countryCode,
            sortable: true,
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
        },
        {
            name: 'Service Category',
            selector: row => `${row.services.serviceName}, ${row.services.priceInEuroWithoutVAT}€`,
            sortable: true,
        },
        {
            name: 'Parts',
            selector: row => Array.isArray(row.parts) 
                ? row.parts.map(part => part.label).join(', ') 
                : 'N/A',
            sortable: true,
        },
        {
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
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={() => openCreateOrderModal(row)}
                    className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                    Create Order
                </button>
            ),
            ignoreRowClick: true,
            button: true.toString(),
        },
    ];

    const getData = async () => {
        try {
            const res = await axios.get(`${URL}/offer`);
            return res.data.data;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
            const res = await axios.get('/api/warehouse');
            return res.data;
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
                .then((res) => {
                    setParts(res);
                });
            
        } catch (error) {
            console.error(error);
        }
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const offerData = { ...formData, userId: id };
            if (editMode) {
                await axios.put(`${URL}/offer/update/${editId}`, offerData);
            } else {
                await axios.post(`${URL}/offer/create`, offerData);
            }
            getData()
                .then((res) => {
                    setData(res);
                });

            setModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
        } catch (error) {
            console.error(error);
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
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
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

    const openModal = () => {
        setFormData({
            customerFullName: '',
            yachtName: '',
            yachtModel: '',
            comment: '',
            countryCode: '',
            services: [],
            parts: [],
            status: 'created'
        });
        setEditMode(false);
        setEditId(null);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setEditMode(false);
        setEditId(null);
    };

    const openCreateOrderModal = (row) => {
        setSelectedRow(row);
        setCreateOrderFormData([]);
        setCreateOrderModalIsOpen(true);
    };

    const closeCreateOrderModal = () => {
        setCreateOrderModalIsOpen(false);
    };

    const closeCreateServiceModal = () => {
        setCreateServiceModalIsOpen(false);
    };

    const closeCreatePartModal = () => {
        setCreatePartModalIsOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name in formData) {
            setFormData({ ...formData, [name]: value });
        } else if (name in createServiceFormData) {
            setCreateServiceFormData({ ...createServiceFormData, [name]: value });
        } else if (name in createPartFormData) {
            setCreatePartFormData({ ...createPartFormData, [name]: value });
        }
    };

    const handleSelectChange = (value, name) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleAssignedUsersChange = (selectedUsers) => {
        setCreateOrderFormData(selectedUsers);
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

    const openCreateServiceModal = () => {
        setCreateServiceModalIsOpen(true);
    };

    const openCreatePartModal = () => {
        setCreatePartModalIsOpen(true);
    };


    const handleHistoryClick = () => {
        router.push('/offersHistory');
    };

    useEffect(() => {
        Promise.all([getData(), getDataCatagory(), getWareHouse(), getUsers()])
            .then(([res1, res2, res3, res4]) => {
                setData(res1 || []);
                setCatagoryData(res2 || []);
                setParts(res3 || []);
                setUsers(res4 || []);
            });
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            const options = users.map(user => ({ value: user.id, label: user.fullName }));
            setUserOptions(options);
        }
    }, [users]);

    const handlePartsChange = (selectedOptions) => {
        setFormData({ ...formData, parts: selectedOptions });
    };

    const partOptions = parts.map((part) => ({
        value: part.id,
        label: part.name
    }));

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-100 p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                        <div className="relative flex justify-between mb-4 p-4">
                            <div className="flex space-x-4">
                                <Button onClick={openModal} color="blue">
                                    Create
                                </Button>
                                <Button onClick={handleHistoryClick} color="green">
                                    History
                                </Button>
                            </div>
                        </div>
                        <DataTable
                            columns={columns}
                            data={data}
                            pagination
                            highlightOnHover
                            pointerOnHover
                            className="min-w-full border-collapse"
                        />
                    </div>
                )}
                <Modal isOpen={modalIsOpen} onClose={closeModal} title={editMode ? "Edit" : "Create"}>
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto h-96">
                        <ReactSelect
                            options={userOptions}
                            onChange={selectedOption => setFormData({ ...formData, customerFullName: selectedOption ? selectedOption.label : '' })}
                            placeholder="Select a customer..."
                            isClearable
                            isSearchable
                            className="mb-4"
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                }),
                                singleValue: (provided) => ({
                                    ...provided,
                                    color: 'black',
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                            }}
                        />
                        <Input
                            label="Yacht Name"
                            name="yachtName"
                            value={formData.yachtName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Yacht Model"
                            name="yachtModel"
                            value={formData.yachtModel}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Comment"
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                        />
                        <Input
                            label="Country Code"
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            required
                        />
                        <Select
                            label="Services"
                            value={formData.services}
                            onChange={(value) => handleSelectChange(value, 'services')}
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
                        <Button onClick={openCreateServiceModal} color="blue">
                            Add Service
                        </Button>
                        <div className="mb-4">
                            <label htmlFor="parts-select" className="block text-sm font-medium text-gray-700">
                                Select Parts
                            </label>
                            <ReactSelect
                                id="parts-select"
                                isMulti
                                options={partOptions}
                                value={formData.parts}
                                onChange={handlePartsChange}
                                placeholder="Select parts..."
                                className="mt-1"
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
                        </div>
                        <Button onClick={openCreatePartModal} color="blue">
                            Add Part
                        </Button>

                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(value) => handleSelectChange(value, 'status')}
                            required
                            className="text-black"
                            labelProps={{ className: "text-black" }}
                        >
                            <Option value="created" className="text-black">Created</Option>
                            <Option value="sent" className="text-black">Sent</Option>
                            <Option value="discussing" className="text-black">Discussing</Option>
                            <Option value="confirmed" className="text-black">Confirmed</Option>
                            <Option value="canceled" className="text-black">Canceled</Option>
                        </Select>
                        <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                <span>{editMode ? 'Update' : 'Add'}</span>
                            </Button>
                        </div>
                    </form>
                </Modal>
                <Modal isOpen={createOrderModalIsOpen} onClose={closeCreateOrderModal} title="Create Order">
                    <div className="space-y-4">
                        <ReactSelect
                            options={userOptions}
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
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Price in Euro Without VAT"
                            name="priceInEuroWithoutVAT"
                            value={createServiceFormData.priceInEuroWithoutVAT}
                            onChange={handleChange}
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
                    <form onSubmit={createPart} className="space-y-4">
                        <Input
                            label="Name"
                            name="name"
                            value={createPartFormData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Quantity"
                            name="quantity"
                            value={createPartFormData.quantity}
                            onChange={handleChange}
                            required
                        />  
                        <Input
                            label="Inventory"
                            name="inventory"
                            value={createPartFormData.inventory}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Comment"
                            name="comment"
                            value={createPartFormData.comment}
                            onChange={handleChange}
                        />
                        <Input
                            label="Country Code"
                            name="countryCode"
                            value={createPartFormData.countryCode}
                            onChange={handleChange}
                            required
                        />
                        <Select
                            label="Service Category"
                            value={createPartFormData.serviceCategory}
                            onChange={(value) => handleSelectChange(value, 'serviceCategory')}
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
            </div>
        </>
    );
};

export default OfferPage;