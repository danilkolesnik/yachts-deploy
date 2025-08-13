"use client"
import React, { useEffect, useState, useRef } from 'react';
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
import * as XLSX from 'xlsx';

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
        serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' },
        pricePerUnit: ''
    });
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const router = useRouter();
    const tableRef = useRef(null);

    const columns = [
        {
            name: 'Boat Registration',
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
            name: 'Comment',
            selector: row => row.comment,
            sortable: true,
        },
        {
            name: 'Price',
            selector: row => row.pricePerUnit,
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
            console.log(res.data);
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
                await axios.post(`${URL}/warehouse/create`, {
                    ...formData,
                    unofficially: true
                });
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
            serviceCategory: row.serviceCategory,
            pricePerUnit: row.pricePerUnit
        });
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/warehouse/delete/${id}`);
            getData().then((res) => {
                setData(res);
                setFilteredData(res);
            })
        } catch (error) {
            console.log(error);
        }
    };

    const openModal = () => {
        setFormData({
            name: '',
            quantity: '',
            inventory: '',
            comment: '',
            countryCode: '',
            serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' },
            pricePerUnit: ''
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

    // --- SheetJS Export Function ---
    const exportToExcel = () => {
        const exportData = filteredData.map(row => ({
            'Boat Registration': row.countryCode || '',
            Name: row.name || '',
            Quantity: row.quantity || '',
            Comment: row.comment || '',
            Price: `${row.pricePerUnit || ''}€`,
            'Service Category': row.serviceCategory?.serviceName || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Warehouse');
        XLSX.writeFile(workbook, 'warehouse_export.xlsx');
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
    }, [search, data])

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
                        <div className="w-full md:w-auto">
                            <SearchInput search={search} setSearch={setSearch} filteredData={filteredData} onSearchSelect={handleSearchSelect} />
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <Button onClick={openModal} color="#D33" className="w-full md:w-auto">
                                Create
                            </Button>
                            <Button color="purple" className="w-full md:w-auto" onClick={exportToExcel}>
                                Export to Excel
                            </Button>
                            <Button onClick={handleHistoryClick} color="green" className="w-full md:w-auto">
                                View History
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table ref={tableRef} style={{ display: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Boat Registration</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Comment</th>
                                    <th>Price</th>
                                    <th>Service Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.countryCode || ''}</td>
                                        <td>{row.name || ''}</td>
                                        <td>{row.quantity || ''}</td>
                                        <td>{row.comment || ''}</td>
                                        <td>{`${row.pricePerUnit || ''}€`}</td>
                                        <td>{row.serviceCategory?.serviceName || ''}</td>
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
                        label="Comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Boat Registration"
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Price"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
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
                    <div className="flex justify-end gap-2">
                        <Button variant="text" color="red" onClick={closeModal} className="w-full md:w-auto">
                            <span>Cancel</span>
                        </Button>
                        <Button color="green" type="submit" className="w-full md:w-auto">
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