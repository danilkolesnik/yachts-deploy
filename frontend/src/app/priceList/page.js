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
import { toast } from 'react-toastify';
import Header from '@/component/header';
import ReactSelect from 'react-select';
import * as XLSX from 'xlsx';

const PriceListPage = () => {
    const tableRef = useRef(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        serviceName: '',
        priceInEuroWithoutVAT: '',
        unitsOfMeasurement: '',
        subServices: [],
    });
    const [filteredData, setFilteredData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [priceInputValue, setPriceInputValue] = useState('');

    const columns = [
        {
            name: 'Service Name',
            selector: row => row.serviceName,
            sortable: true,
        },
        {
            name: 'Sub-services',
            selector: row => {
                if (row.subServices && Array.isArray(row.subServices) && row.subServices.length > 0) {
                    return row.subServices.map(sub => `${sub.name} (${sub.size})`).join(', ');
                }
                return 'N/A';
            },
            sortable: false,
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
            switch (true) {
                case formData.serviceName.trim() === '':
                    toast.error("Error: Service name is required");
                    return;
                case formData.priceInEuroWithoutVAT.trim() === '':
                    toast.error("Error: Price in EURO without VAT is required");
                    return;
                case formData.unitsOfMeasurement.trim() === '':
                    toast.error("Error: Units of measurement is required");
                    return;
            }
            if (editMode) {
                const res = await axios.put(`${URL}/pricelist/${editId}`, formData);
                if(res.data.code === 200){
                    toast.success("Price list updated successfully");
                }else{
                    toast.error("Error: Price list not updated");
                }
            } else {
                const res = await axios.post(`${URL}/pricelist/create`, formData);
                if(res.data.code === 201){
                    toast.success("Price list created successfully");
                }else{
                    toast.error("Error: Price list not created");
                }
            }
            getData();
            setModalIsOpen(false);
            setEditMode(false);
            setEditId(null);
        } catch (error) {
            console.log(error);
            toast.error("Error updating price list");
        }
    };

    const handleEdit = (row) => {
        setFormData({
            serviceName: row.serviceName,
            priceInEuroWithoutVAT: row.priceInEuroWithoutVAT || '',
            unitsOfMeasurement: row.unitsOfMeasurement || '',
            subServices: row.subServices || [],
        });
        // Set price input value for display
        if (row.priceInEuroWithoutVAT) {
            const num = parseFloat(row.priceInEuroWithoutVAT) || 0;
            setPriceInputValue(num.toFixed(2).replace('.', ','));
        } else {
            setPriceInputValue('');
        }
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.post(`${URL}/pricelist/delete/${id}`);
            getData();
            toast.success("Price list deleted successfully");
        } catch (error) {
            console.log(error);
            toast.error("Error deleting price list");
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const serviceOptions = data.map(service => ({
        value: service.id,
        label: service.serviceName,
    }));

    const handleServiceChange = (selectedOption) => {
        setSelectedService(selectedOption);
        if (selectedOption) {
            setFilteredData(data.filter(service => service.serviceName === selectedOption.label));
        } else {
            setFilteredData(data);
        }
    };

    const handleInputChange = (value) => {
        setInputValue(value);
    };

    const openModal = () => {
        setFormData({
            serviceName: '',
            priceInEuroWithoutVAT: '',
            unitsOfMeasurement: '',
            subServices: [],
        });
        setPriceInputValue('');
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

    // Format price input

    const handlePriceChange = (e) => {
        let value = e.target.value;
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        
        if (!digits) {
            setPriceInputValue('');
            setFormData({ ...formData, priceInEuroWithoutVAT: '' });
            return;
        }
        
        // Format as 00113,45 while typing
        const formatted = digits.padStart(7, '0');
        const displayValue = formatted.slice(0, -2) + ',' + formatted.slice(-2);
        setPriceInputValue(displayValue);
        
        // Store actual value (divide by 100)
        const actualValue = (parseInt(digits, 10) / 100).toFixed(2);
        setFormData({ ...formData, priceInEuroWithoutVAT: actualValue });
    };

    const handlePriceFocus = (e) => {
        const value = formData.priceInEuroWithoutVAT;
        if (!value || value === '0.00' || value === '') {
            setPriceInputValue('00000,00');
        } else {
            // Convert to 00113,45 format
            const num = parseFloat(value) || 0;
            const cents = Math.round(num * 100);
            const formatted = String(cents).padStart(7, '0');
            setPriceInputValue(formatted.slice(0, -2) + ',' + formatted.slice(-2));
        }
    };

    const handlePriceBlur = (e) => {
        const value = formData.priceInEuroWithoutVAT;
        if (value) {
            // Format as 113,45 (remove leading zeros)
            const num = parseFloat(value) || 0;
            const formatted = num.toFixed(2).replace('.', ',');
            setPriceInputValue(formatted);
            setFormData({ ...formData, priceInEuroWithoutVAT: num.toFixed(2) });
        } else {
            setPriceInputValue('');
        }
    };

    // Sub-services handlers
    const handleAddSubService = () => {
        setFormData({
            ...formData,
            subServices: [...formData.subServices, { name: '', size: '', price: '' }]
        });
    };

    const handleRemoveSubService = (index) => {
        const newSubServices = formData.subServices.filter((_, i) => i !== index);
        setFormData({ ...formData, subServices: newSubServices });
    };

    const handleSubServiceChange = (index, field, value) => {
        const newSubServices = [...formData.subServices];
        newSubServices[index] = { ...newSubServices[index], [field]: value };
        setFormData({ ...formData, subServices: newSubServices });
    };

    // --- SheetJS Export Function ---
    const exportToExcel = () => {
        const exportData = filteredData.map(row => ({
            'Service Name': row.serviceName || '',
            'Sub-services': row.subServices && Array.isArray(row.subServices) && row.subServices.length > 0
                ? row.subServices.map(sub => `${sub.name} (${sub.size})`).join(', ')
                : 'N/A',
            'Price in EURO without VAT': `${row.priceInEuroWithoutVAT || ''}€`,
            'Units of Measurement': row.unitsOfMeasurement || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Price List');
        XLSX.writeFile(workbook, 'price_list_export.xlsx');
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
                            <div className="w-full md:w-auto">
                                <ReactSelect
                                    options={serviceOptions}
                                    value={selectedService}
                                    onChange={handleServiceChange}
                                    onInputChange={handleInputChange}
                                    inputValue={inputValue}
                                    placeholder="Search for a service..."
                                    isClearable
                                    isSearchable
                                    menuIsOpen={inputValue.length > 0}
                                    className="w-full md:w-80"
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            color: 'black',
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
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <Button className="w-full sm:w-auto bg-[#282828] text-white" onClick={exportToExcel}>
                                    Export to Excel
                                </Button>
                                <Button onClick={openModal} className="w-full sm:w-auto bg-[#dd3333] text-white">
                                    Create
                                </Button>     
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table ref={tableRef} style={{ display: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Service Name</th>
                                        <th>Sub-services</th>
                                        <th>Price in EURO without VAT</th>
                                        <th>Units of Measurement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.serviceName || ''}</td>
                                            <td>
                                                {row.subServices && Array.isArray(row.subServices) && row.subServices.length > 0
                                                    ? row.subServices.map(sub => `${sub.name} (${sub.size})`).join(', ')
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>{`${row.priceInEuroWithoutVAT || ''}€`}</td>
                                            <td>{row.unitsOfMeasurement || ''}</td>
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
                    <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Service Name"
                                name="serviceName"
                                value={formData.serviceName}
                                onChange={handleChange}
                                required
                            />
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Price in Euro excl. VAT
                                </label>
                                <input
                                    type="text"
                                    name="priceInEuroWithoutVAT"
                                    value={priceInputValue || (formData.priceInEuroWithoutVAT ? parseFloat(formData.priceInEuroWithoutVAT).toFixed(2).replace('.', ',') : '')}
                                    onChange={handlePriceChange}
                                    onFocus={handlePriceFocus}
                                    onBlur={handlePriceBlur}
                                    placeholder="00000,00€"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring text-black placeholder-gray-400"
                                    required
                                />
                            </div>

                            <Select
                                label="Units of Measurement"
                                value={formData.unitsOfMeasurement}
                                onChange={(value) => setFormData({ ...formData, unitsOfMeasurement: value })}
                                className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                labelProps={{ className: 'text-black' }}
                                required
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="pcs.">pcs.</Option>
                                <Option className="text-black" value="hrs.">hrs.</Option>
                            </Select>

                            {/* Sub-services Section */}
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-black">Sub-services</h3>
                                    <Button
                                        type="button"
                                        onClick={handleAddSubService}
                                        size="sm"
                                        className="bg-blue-500 text-white"
                                    >
                                        Add Sub-service
                                    </Button>
                                </div>
                                {formData.subServices && formData.subServices.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.subServices.map((subService, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded space-y-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-medium text-black">Sub-service {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRemoveSubService(index)}
                                                        size="sm"
                                                        className="bg-red-500 text-white"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <Input
                                                    label="Sub-service Name"
                                                    value={subService.name || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'name', e.target.value)}
                                                />
                                                <Input
                                                    label="Size (e.g., yacht size)"
                                                    value={subService.size || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'size', e.target.value)}
                                                />
                                                <Input
                                                    label="Price"
                                                    type="text"
                                                    value={subService.price || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'price', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="text" color="red" onClick={closeModal} className="w-full md:w-auto">
                                    <span>Cancel</span>
                                </Button>
                                <Button color="green" type="submit" className="w-full md:w-auto">
                                    <span>{editMode ? 'Update' : 'Add'}</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default PriceListPage;