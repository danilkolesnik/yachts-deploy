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
import Header from '@/component/header';
import SearchInput from '@/component/search';
import { useRouter } from 'next/navigation';

const WarehousePage = () => {
    const [data, setData] = useState([]);
    const [catagoryData, setCatagoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        inventory: '',
        comment: '',
        countryCode: '',
        serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' }
    });
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const router = useRouter();

    const columns = [
        {
            name: 'Country Code',
            selector: row => row.countryCode,
            sortable: true,
        },
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Quantity',
            selector: row => row.quantity,
            sortable: true,
        },
        {
            name: 'Inventory',
            selector: row => row.inventory,
            sortable: true,
        },
        {
            name: 'Comment',
            selector: row => row.comment,
            sortable: true,
        },
        {
            name: 'Service Category',
            selector: row => row.serviceCategory.serviceName,
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
    ];

    const getData = async () => {
        try {
            const res = await axios.get('/api/warehouse');
            return res.data;
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const getDataCatagory = async () => {
        try {
            const res = await axios.get(`${URL}/priceList`);
            return res.data.data;
        } catch (error) {
            console.log(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await axios.put(`${URL}/warehouse/${editId}`, formData);
            } else {
                await axios.post(`${URL}/warehouse/create`, formData);
            }
            getData().then((res) => {
                setData(res);
                setFilteredData(res);
            })
            setModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
        } catch (error) {
            console.log(error);
        }
    };

    const handleEdit = (row) => {
        setFormData({
            name: row.name,
            quantity: row.quantity,
            inventory: row.inventory,
            comment: row.comment,
            countryCode: row.countryCode,
            serviceCategory: row.serviceCategory
        });
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/warehouse/delete/${id}`);
            getData();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        Promise.all([getData(), getDataCatagory()])
            .then(([res1, res2]) => {
                setData(res1);
                setFilteredData(res1);
                setCatagoryData(res2);
            });
    }, []);

    useEffect(() => {
        const result = data.filter(item => 
            (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
            (item.countryCode && item.countryCode.toLowerCase().includes(search.toLowerCase())) ||
            (item.serviceCategory.serviceName && item.serviceCategory.serviceName.toLowerCase().includes(search.toLowerCase()))
        );
        setFilteredData(result);
    }, [search, data]);

    const openModal = () => {
        setFormData({
            name: '',
            quantity: '',
            inventory: '',
            comment: '',
            countryCode: '',
            serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' }
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value) => {
        setFormData({ ...formData, serviceCategory: value });
    };

    const handleSearchSelect = (item) => {
        setSearch(item.name);
        setFilteredData([item]);
    };

    const handleHistoryClick = () => {
        router.push('/warehouseHistory');
    };

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
                        <SearchInput search={search} setSearch={setSearch} filteredData={filteredData} onSearchSelect={handleSearchSelect} />
                        <div className="flex space-x-4">
                            <Button onClick={openModal} color="blue">
                                Create
                            </Button>
                            <Button onClick={handleHistoryClick} color="green">
                                View History
                            </Button>
                        </div>
                    </div>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        highlightOnHover
                        pointerOnHover
                        className="min-w-full border-collapse"
                    />
                </div>
            )}
            <Modal isOpen={modalIsOpen} onClose={closeModal} title={editMode ? "Edit" : "Create"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Inventory"
                        name="inventory"
                        value={formData.inventory}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Country Code"
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                        required
                    />
                    <Select
                        label="Service Category"
                        value={formData.serviceCategory}
                        onChange={handleSelectChange}
                        required
                        className="text-black"
                        labelProps={{ className: "text-black" }}
                    >
                        {catagoryData.map((category) => (
                            <Option key={category.id} value={category} className="text-black">
                                {category.serviceName}
                            </Option>
                        ))}
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
        </div>
        </>
    );
};

export default WarehousePage;