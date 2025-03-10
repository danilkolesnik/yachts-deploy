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

const PriceListPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        serviceName: '',
        priceInEuroWithoutVAT: '',
        unitsOfMeasurement: '',
    });
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const columns = [
        {
            name: 'Service Name',
            selector: row => row.serviceName,
            sortable: true,
        },
        {
            name: 'Price in EURO without VAT',
            selector: row => row.priceInEuroWithoutVAT,
            sortable: true,
        },
        {
            name: 'Units of Measurement',
            selector: row => row.unitsOfMeasurement,
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
            button: "true",
        },
    ];

    const getData = async () => {
        try {
            const res = await axios.get(`${URL}/pricelist`);
            console.log(res.data);
            
            setData(res.data.data);
            setFilteredData(res.data.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await axios.put(`${URL}/pricelist/${editId}`, formData);
            } else {
                await axios.post(`${URL}/pricelist/create`, formData);
            }
            getData();
            setModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
        } catch (error) {
            console.log(error);
        }
    };

    const handleEdit = (row) => {
        setFormData({
            serviceName: row.serviceName,
            priceInEuroWithoutVAT: row.priceInEuroWithoutVAT,
            unitsOfMeasurement: row.unitsOfMeasurement,
        });
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/pricelist/delete/${id}`);
            getData();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        const result = data.filter(item => 
            item.serviceName.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredData(result);
    }, [search, data]);

    const openModal = () => {
        setFormData({
            serviceName: '',
            priceInEuroWithoutVAT: '',
            unitsOfMeasurement: '',
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

    const handleSearchSelect = (item) => {
        setSearch(item.serviceName);
        setFilteredData([item]);
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
                        <SearchInput 
                            search={search} 
                            setSearch={setSearch} 
                            filteredData={filteredData} 
                            onSearchSelect={handleSearchSelect} 
                        />
                        <Button onClick={openModal} color="blue">
                            Create
                        </Button>     
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
                        label="Service Name"
                        name="serviceName"
                        value={formData.serviceName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Price in Euro Without VAT"
                        name="priceInEuroWithoutVAT"
                        value={formData.priceInEuroWithoutVAT}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Units of Measurement"
                        name="unitsOfMeasurement"
                        value={formData.unitsOfMeasurement}
                        onChange={handleChange}
                        required
                    />
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

export default PriceListPage;