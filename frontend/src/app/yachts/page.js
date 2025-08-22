"use client"
import React, { useState, useEffect } from 'react';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import Header from '@/component/header';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify'; 
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import Loader from '@/ui/loader';

const YachtsPage = () => {
    const [yachts, setYachts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [editModalIsOpen, setEditModalIsOpen] = useState(false);
    const [editingYacht, setEditingYacht] = useState(null);
    const [filters, setFilters] = useState({
        searchCriteria: 'name',
        searchValue: '',
    });

    const [formData, setFormData] = useState({
        name: '',
        model: '',
        repairTime: ''
    });

    const columns = [
        {
            name: "Date",
            selector: row => row.createdAt,
            sortable: true,
        },
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Model',
            selector: row => row.model,
            sortable: true,
        },
        {
            name: 'Repair Time',
            selector: row => `${row.repairTime}h`,
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
            button: true,
        },
    ];

    useEffect(() => {
        fetchYachts();
    }, []);

    const fetchYachts = async () => {
        try {
            const response = await axios.get(`${URL}/yachts`);
            if (response.data.code === 200) {
                setYachts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching yachts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(formData.name.trim() === ''){
                toast.error("Error: Name is required");
                return;
            }
            if(formData.model.trim() === ''){
                toast.error("Error: Model is required");
                return;
            }
            if(formData.repairTime.trim() === ''){
                toast.error("Error: Repair Time is required");
                return;
            }
            const response = await axios.post(`${URL}/yachts`, formData);
            if (response.data.code === 201) {
                setFormData({ name: '', model: '', repairTime: '' });
                setModalIsOpen(false);
                fetchYachts();
                toast.success("Yacht created successfully",{
                    position: "bottom-right",
                    zIndex: 1000,     
                });
            }
        } catch (error) {
            console.error('Error creating yacht:', error);
            toast.error("Error creating yacht",{
                position: "bottom-right",
                zIndex: 1000,     
            });
        }
    };

    const handleEdit = (yacht) => {
        setEditingYacht(yacht);
        setEditModalIsOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${URL}/yachts/${editingYacht.id}`, editingYacht);
            if (response.data.code === 200) {
                setEditingYacht(null);
                setEditModalIsOpen(false);
                fetchYachts();
                toast.success("Yacht updated successfully",{
                    position: "bottom-right",
                    zIndex: 1000,     
                });
            }
        } catch (error) {
            console.error('Error updating yacht:', error);
            toast.error("Error updating yacht",{
                position: "bottom-right",
                zIndex: 1000,     
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`${URL}/yachts/${id}`);
            if (response.data.code === 200) {
                fetchYachts();
                toast.success("Yacht deleted successfully");
            }
        } catch (error) {
            console.error('Error deleting yacht:', error);
            toast.error("Error deleting yacht");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingYacht({ ...editingYacht, [name]: value });
    };

    const filteredData = yachts.filter(yacht => {
        const searchValue = filters.searchValue.toLowerCase();
        switch(filters.searchCriteria) {
            case 'name':
                return yacht.name?.toLowerCase().includes(searchValue);
            case 'model':
                return yacht.model?.toLowerCase().includes(searchValue);
            default:
                return true;
        }
    });

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
                                        <Option className="text-black" value="name">Name</Option>
                                        <Option className="text-black" value="model">Model</Option>
                                    </Select>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.searchValue}
                                        onChange={(e) => setFilters({ ...filters, searchValue: e.target.value })}
                                        className="border p-2 text-black rounded w-full md:w-48 h-10"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto justify-end">
                                <Button onClick={() => setModalIsOpen(true)} className="w-full sm:w-auto bg-[#dd3333] text-white">
                                    Create
                                </Button>
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

                {/* Create Modal */}
                <Modal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)} title="Add New Yacht">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <Input
                            label="Model"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                        />
                        <Input
                            label="Repair Time"
                            name="repairTime"
                            value={formData.repairTime}
                            onChange={handleChange}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="text" color="red" onClick={() => setModalIsOpen(false)} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button className="w-full sm:w-auto bg-[#dd3333] text-white" type="submit">
                                <span>Create</span>
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Modal */}
                <Modal isOpen={editModalIsOpen} onClose={() => setEditModalIsOpen(false)} title="Edit Yacht">
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <Input
                            label="Name"
                            name="name"
                            value={editingYacht?.name || ''}
                            onChange={handleEditChange}
                        />
                        <Input
                            label="Model"
                            name="model"
                            value={editingYacht?.model || ''}
                            onChange={handleEditChange}
                        />
                        <Input
                            label="Repair Time"
                            name="repairTime"
                            value={editingYacht?.repairTime || ''}
                            onChange={handleEditChange}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="text" color="red" onClick={() => setEditModalIsOpen(false)} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" type="submit">
                                <span>Save</span>
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </>
    );
};

export default YachtsPage; 