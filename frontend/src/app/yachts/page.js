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
        repairTime: '',
        countryCode:'',
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
        description:''
    });

    const columns = [
        {
            name: 'Boat Registration',
            selector: row => row.countryCode,
            sortable: true,
        },
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
        // {
        //     name: 'Repair Time',
        //     selector: row => `${row.repairTime}h`,
        //     sortable: true,
        // },
        {
            name: 'Owner Contacts',
            selector: row => {
                // Support both old and new format
                if (row.ownerContacts) return row.ownerContacts;
                const owner = row.owner || '';
                const contacts = [];
                if (row.ownerEmail) contacts.push(`Email: ${row.ownerEmail}`);
                if (row.ownerPhone) contacts.push(`Phone: ${row.ownerPhone}`);
                if (row.ownerAddress) contacts.push(`Address: ${row.ownerAddress}`);
                return owner + (contacts.length > 0 ? ` (${contacts.join(', ')})` : '');
            },
            sortable: false,
        },
        {
            name: 'Engine Hours',
            selector: row => {
                // Support both old and new format
                if (row.engineHours) return row.engineHours;
                if (row.engines && row.engines.length > 0) {
                    return row.engines.map((e, i) => `Motor ${i + 1}: ${e.hours || 0}h`).join(', ');
                }
                return '-';
            },
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
            // if(formData.repairTime.trim() === ''){
            //     toast.error("Error: Repair Time is required");
            //     return;
            // }
            if(formData.countryCode.trim() === ''){
                toast.error("Error: Country code is required");
                return;
            }
            const response = await axios.post(`${URL}/yachts`, formData);
            if (response.data.code === 201) {
                setFormData({ 
                    name: '', 
                    model: '', 
                    repairTime: '', 
                    countryCode:'', 
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
                    description:''
                });
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
        // Initialize with default values if missing
        const initializedYacht = {
            ...yacht,
            owner: yacht.owner || '',
            ownerEmail: yacht.ownerEmail || '',
            ownerPhone: yacht.ownerPhone || '',
            ownerAddress: yacht.ownerAddress || '',
            engineCount: yacht.engineCount || (yacht.engines?.length ? String(yacht.engines.length) : ''),
            engines: yacht.engines || [],
            hasGenerators: yacht.hasGenerators || '',
            generatorCount: yacht.generatorCount || (yacht.generators?.length ? String(yacht.generators.length) : ''),
            generators: yacht.generators || [],
            hasAirConditioners: yacht.hasAirConditioners || '',
            airConditionerCount: yacht.airConditionerCount || (yacht.airConditioners?.length ? String(yacht.airConditioners.length) : ''),
            airConditioners: yacht.airConditioners || [],
        };
        setEditingYacht(initializedYacht);
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

    const handleEngineCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const engines = Array.from({ length: numCount }, (_, i) => 
            formData.engines[i] || { model: '', hours: '' }
        );
        setFormData({ ...formData, engineCount: count, engines });
    };

    const handleEngineChange = (index, field, value) => {
        const engines = [...formData.engines];
        engines[index] = { ...engines[index], [field]: value };
        setFormData({ ...formData, engines });
    };

    const handleGeneratorCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const generators = Array.from({ length: numCount }, (_, i) => 
            formData.generators[i] || { model: '', hours: '' }
        );
        setFormData({ ...formData, generatorCount: count, generators });
    };

    const handleGeneratorChange = (index, field, value) => {
        const generators = [...formData.generators];
        generators[index] = { ...generators[index], [field]: value };
        setFormData({ ...formData, generators });
    };

    const handleAirConditionerCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const airConditioners = Array.from({ length: numCount }, (_, i) => 
            formData.airConditioners[i] || { model: '', hours: '' }
        );
        setFormData({ ...formData, airConditionerCount: count, airConditioners });
    };

    const handleAirConditionerChange = (index, field, value) => {
        const airConditioners = [...formData.airConditioners];
        airConditioners[index] = { ...airConditioners[index], [field]: value };
        setFormData({ ...formData, airConditioners });
    };

    // Edit handlers
    const handleEditEngineCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const engines = Array.from({ length: numCount }, (_, i) => 
            editingYacht?.engines?.[i] || { model: '', hours: '' }
        );
        setEditingYacht({ ...editingYacht, engineCount: count, engines });
    };

    const handleEditEngineChange = (index, field, value) => {
        const engines = [...(editingYacht?.engines || [])];
        engines[index] = { ...engines[index], [field]: value };
        setEditingYacht({ ...editingYacht, engines });
    };

    const handleEditGeneratorCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const generators = Array.from({ length: numCount }, (_, i) => 
            editingYacht?.generators?.[i] || { model: '', hours: '' }
        );
        setEditingYacht({ ...editingYacht, generatorCount: count, generators });
    };

    const handleEditGeneratorChange = (index, field, value) => {
        const generators = [...(editingYacht?.generators || [])];
        generators[index] = { ...generators[index], [field]: value };
        setEditingYacht({ ...editingYacht, generators });
    };

    const handleEditAirConditionerCountChange = (count) => {
        const numCount = parseInt(count) || 0;
        const airConditioners = Array.from({ length: numCount }, (_, i) => 
            editingYacht?.airConditioners?.[i] || { model: '', hours: '' }
        );
        setEditingYacht({ ...editingYacht, airConditionerCount: count, airConditioners });
    };

    const handleEditAirConditionerChange = (index, field, value) => {
        const airConditioners = [...(editingYacht?.airConditioners || [])];
        airConditioners[index] = { ...airConditioners[index], [field]: value };
        setEditingYacht({ ...editingYacht, airConditioners });
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
                <Modal isOpen={modalIsOpen} onClose={() => {
                    setModalIsOpen(false);
                    setFormData({ 
                        name: '', 
                        model: '', 
                        repairTime: '', 
                        countryCode:'', 
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
                        description:''
                    });
                }} title="Add New Yacht">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Yacht Name"
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
                            label="Boat Registration"
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            required
                        />
                        
                        {/* Owner Contacts Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Owner Contacts</h3>
                            <Input
                                label="Owner"
                                name="owner"
                                value={formData.owner}
                                onChange={handleChange}
                            />
                            <div className="space-y-2">
                                <h4 className="text-md font-medium">Contact(s) details</h4>
                                <Input
                                    label="Email"
                                    name="ownerEmail"
                                    type="email"
                                    value={formData.ownerEmail}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Phone"
                                    name="ownerPhone"
                                    type="tel"
                                    value={formData.ownerPhone}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Address"
                                    name="ownerAddress"
                                    value={formData.ownerAddress}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Engine Hours Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Engine Hours (Motors)</h3>
                            <Select
                                label="Number of Motors"
                                value={formData.engineCount}
                                onChange={handleEngineCountChange}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="1">1</Option>
                                <Option className="text-black" value="2">2</Option>
                                <Option className="text-black" value="3">3</Option>
                                <Option className="text-black" value="4">4</Option>
                                <Option className="text-black" value="5">5</Option>
                            </Select>
                            {formData.engineCount && parseInt(formData.engineCount) > 0 && (
                                <div className="space-y-4 pl-4 border-l-2">
                                    {formData.engines.map((engine, index) => (
                                        <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium">Motor {index + 1}</h4>
                                            <Input
                                                label="Engine Model"
                                                value={engine.model || ''}
                                                onChange={(e) => handleEngineChange(index, 'model', e.target.value)}
                                            />
                                            <Input
                                                label="Hours / Run time / Mileage (Hours)"
                                                type="number"
                                                value={engine.hours || ''}
                                                onChange={(e) => handleEngineChange(index, 'hours', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Generators Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Generators</h3>
                            <Select
                                label="Generator(s)"
                                value={formData.hasGenerators}
                                onChange={(value) => {
                                    setFormData({ 
                                        ...formData, 
                                        hasGenerators: value,
                                        generatorCount: value === 'Yes' ? formData.generatorCount : '',
                                        generators: value === 'Yes' ? formData.generators : []
                                    });
                                }}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="Yes">Yes</Option>
                                <Option className="text-black" value="No">No</Option>
                            </Select>
                            {formData.hasGenerators === 'Yes' && (
                                <>
                                    <Select
                                        label="Number of Generators"
                                        value={formData.generatorCount}
                                        onChange={handleGeneratorCountChange}
                                        className="text-black border-gray-300 rounded-xs"
                                        labelProps={{ className: 'text-black' }}
                                    >
                                        <Option className="text-black" value="">Select...</Option>
                                        <Option className="text-black" value="1">1</Option>
                                        <Option className="text-black" value="2">2</Option>
                                        <Option className="text-black" value="3">3</Option>
                                        <Option className="text-black" value="4">4</Option>
                                        <Option className="text-black" value="5">5</Option>
                                    </Select>
                                    {formData.generatorCount && parseInt(formData.generatorCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {formData.generators.map((generator, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium">Generator {index + 1}</h4>
                                                    <Input
                                                        label="Generator Model"
                                                        value={generator.model || ''}
                                                        onChange={(e) => handleGeneratorChange(index, 'model', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Hours / Run time / Mileage (Hours)"
                                                        type="number"
                                                        value={generator.hours || ''}
                                                        onChange={(e) => handleGeneratorChange(index, 'hours', e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Air Conditioners Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Air Conditioners</h3>
                            <Select
                                label="Air Conditioner(s)"
                                value={formData.hasAirConditioners}
                                onChange={(value) => {
                                    setFormData({ 
                                        ...formData, 
                                        hasAirConditioners: value,
                                        airConditionerCount: value === 'Yes' ? formData.airConditionerCount : '',
                                        airConditioners: value === 'Yes' ? formData.airConditioners : []
                                    });
                                }}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="Yes">Yes</Option>
                                <Option className="text-black" value="No">No</Option>
                            </Select>
                            {formData.hasAirConditioners === 'Yes' && (
                                <>
                                    <Select
                                        label="Number of Air Conditioners"
                                        value={formData.airConditionerCount}
                                        onChange={handleAirConditionerCountChange}
                                        className="text-black border-gray-300 rounded-xs"
                                        labelProps={{ className: 'text-black' }}
                                    >
                                        <Option className="text-black" value="">Select...</Option>
                                        <Option className="text-black" value="1">1</Option>
                                        <Option className="text-black" value="2">2</Option>
                                        <Option className="text-black" value="3">3</Option>
                                        <Option className="text-black" value="4">4</Option>
                                        <Option className="text-black" value="5">5</Option>
                                    </Select>
                                    {formData.airConditionerCount && parseInt(formData.airConditionerCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {formData.airConditioners.map((ac, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium">Air Conditioner {index + 1}</h4>
                                                    <Input
                                                        label="Air Conditioner Model"
                                                        value={ac.model || ''}
                                                        onChange={(e) => handleAirConditionerChange(index, 'model', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Hours / Run time / Mileage (Hours)"
                                                        type="number"
                                                        value={ac.hours || ''}
                                                        onChange={(e) => handleAirConditionerChange(index, 'hours', e.target.value)}
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
                            value={formData.description}
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
                            label="Yacht Name"
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
                            label="Boat Registration"
                            name="countryCode"
                            value={editingYacht?.countryCode || ''}
                            onChange={handleEditChange}
                            required
                        />
                        
                        {/* Owner Contacts Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Owner Contacts</h3>
                            <Input
                                label="Owner"
                                name="owner"
                                value={editingYacht?.owner || ''}
                                onChange={handleEditChange}
                            />
                            <div className="space-y-2">
                                <h4 className="text-md font-medium">Contact(s) details</h4>
                                <Input
                                    label="Email"
                                    name="ownerEmail"
                                    type="email"
                                    value={editingYacht?.ownerEmail || ''}
                                    onChange={handleEditChange}
                                />
                                <Input
                                    label="Phone"
                                    name="ownerPhone"
                                    type="tel"
                                    value={editingYacht?.ownerPhone || ''}
                                    onChange={handleEditChange}
                                />
                                <Input
                                    label="Address"
                                    name="ownerAddress"
                                    value={editingYacht?.ownerAddress || ''}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>

                        {/* Engine Hours Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Engine Hours (Motors)</h3>
                            <Select
                                label="Number of Motors"
                                value={editingYacht?.engineCount || ''}
                                onChange={handleEditEngineCountChange}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="1">1</Option>
                                <Option className="text-black" value="2">2</Option>
                                <Option className="text-black" value="3">3</Option>
                                <Option className="text-black" value="4">4</Option>
                                <Option className="text-black" value="5">5</Option>
                            </Select>
                            {editingYacht?.engineCount && parseInt(editingYacht.engineCount) > 0 && (
                                <div className="space-y-4 pl-4 border-l-2">
                                    {(editingYacht.engines || []).map((engine, index) => (
                                        <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium">Motor {index + 1}</h4>
                                            <Input
                                                label="Engine Model"
                                                value={engine.model || ''}
                                                onChange={(e) => handleEditEngineChange(index, 'model', e.target.value)}
                                            />
                                            <Input
                                                label="Hours / Run time / Mileage (Hours)"
                                                type="number"
                                                value={engine.hours || ''}
                                                onChange={(e) => handleEditEngineChange(index, 'hours', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Generators Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Generators</h3>
                            <Select
                                label="Generator(s)"
                                value={editingYacht?.hasGenerators || ''}
                                onChange={(value) => {
                                    setEditingYacht({ 
                                        ...editingYacht, 
                                        hasGenerators: value,
                                        generatorCount: value === 'Yes' ? (editingYacht?.generatorCount || '') : '',
                                        generators: value === 'Yes' ? (editingYacht?.generators || []) : []
                                    });
                                }}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="Yes">Yes</Option>
                                <Option className="text-black" value="No">No</Option>
                            </Select>
                            {editingYacht?.hasGenerators === 'Yes' && (
                                <>
                                    <Select
                                        label="Number of Generators"
                                        value={editingYacht?.generatorCount || ''}
                                        onChange={handleEditGeneratorCountChange}
                                        className="text-black border-gray-300 rounded-xs"
                                        labelProps={{ className: 'text-black' }}
                                    >
                                        <Option className="text-black" value="">Select...</Option>
                                        <Option className="text-black" value="1">1</Option>
                                        <Option className="text-black" value="2">2</Option>
                                        <Option className="text-black" value="3">3</Option>
                                        <Option className="text-black" value="4">4</Option>
                                        <Option className="text-black" value="5">5</Option>
                                    </Select>
                                    {editingYacht?.generatorCount && parseInt(editingYacht.generatorCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {(editingYacht.generators || []).map((generator, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium">Generator {index + 1}</h4>
                                                    <Input
                                                        label="Generator Model"
                                                        value={generator.model || ''}
                                                        onChange={(e) => handleEditGeneratorChange(index, 'model', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Hours / Run time / Mileage (Hours)"
                                                        type="number"
                                                        value={generator.hours || ''}
                                                        onChange={(e) => handleEditGeneratorChange(index, 'hours', e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Air Conditioners Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Air Conditioners</h3>
                            <Select
                                label="Air Conditioner(s)"
                                value={editingYacht?.hasAirConditioners || ''}
                                onChange={(value) => {
                                    setEditingYacht({ 
                                        ...editingYacht, 
                                        hasAirConditioners: value,
                                        airConditionerCount: value === 'Yes' ? (editingYacht?.airConditionerCount || '') : '',
                                        airConditioners: value === 'Yes' ? (editingYacht?.airConditioners || []) : []
                                    });
                                }}
                                className="text-black border-gray-300 rounded-xs"
                                labelProps={{ className: 'text-black' }}
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="Yes">Yes</Option>
                                <Option className="text-black" value="No">No</Option>
                            </Select>
                            {editingYacht?.hasAirConditioners === 'Yes' && (
                                <>
                                    <Select
                                        label="Number of Air Conditioners"
                                        value={editingYacht?.airConditionerCount || ''}
                                        onChange={handleEditAirConditionerCountChange}
                                        className="text-black border-gray-300 rounded-xs"
                                        labelProps={{ className: 'text-black' }}
                                    >
                                        <Option className="text-black" value="">Select...</Option>
                                        <Option className="text-black" value="1">1</Option>
                                        <Option className="text-black" value="2">2</Option>
                                        <Option className="text-black" value="3">3</Option>
                                        <Option className="text-black" value="4">4</Option>
                                        <Option className="text-black" value="5">5</Option>
                                    </Select>
                                    {editingYacht?.airConditionerCount && parseInt(editingYacht.airConditionerCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {(editingYacht.airConditioners || []).map((ac, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium">Air Conditioner {index + 1}</h4>
                                                    <Input
                                                        label="Air Conditioner Model"
                                                        value={ac.model || ''}
                                                        onChange={(e) => handleEditAirConditionerChange(index, 'model', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Hours / Run time / Mileage (Hours)"
                                                        type="number"
                                                        value={ac.hours || ''}
                                                        onChange={(e) => handleEditAirConditionerChange(index, 'hours', e.target.value)}
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
                            value={editingYacht?.description || ''}
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