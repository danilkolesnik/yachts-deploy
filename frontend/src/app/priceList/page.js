"use client"
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import Header from '@/component/header';
import ReactSelect from 'react-select';
import ExcelJS from 'exceljs';
import { ClipLoader } from 'react-spinners';

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
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Manual/Help content in English
    const helpSections = {
        overview: {
            title: "Price List Management System - User Manual",
            content: [
                "Welcome to the Price List Management System! This system allows you to create and manage all service prices for your business.",
                "Maintain accurate and up-to-date pricing information for all services, including sub-services and measurement units.",
                "Use the 'Help' button for quick access to this manual at any time."
            ]
        },
        navigation: {
            title: "Understanding the Price List Table",
            content: [
                "**Service Name** - Main service or category name",
                "**Sub-services** - Detailed services within the main category",
                "**Price in EURO without VAT** - Price excluding VAT in Euros",
                "**Units of Measurement** - How the service is measured (pcs., hrs.)",
                "**Actions** - Edit or delete service records",
                "",
                "**Important:** Click on column headers to sort the table"
            ]
        },
        priceFormat: {
            title: "Price Formatting Guide",
            content: [
                "**Correct Price Format:** 00113,45€",
                "• Always use comma as decimal separator",
                "• Two decimal places are required",
                "• Leading zeros are added automatically",
                "",
                "**Examples:**",
                "• 100€ → 00100,00",
                "• 45.50€ → 00045,50",
                "• 1250.75€ → 01250,75",
                "",
                "**Auto-formatting:**",
                "• System automatically formats prices as you type",
                "• Focus on input to see 00000,00 format",
                "• Blur to see final formatted price (113,45)"
            ]
        },
        units: {
            title: "Units of Measurement Explained",
            content: [
                "**pcs. (pieces)** - Used for:",
                "• Countable items or services",
                "• One-time services",
                "• Fixed price items",
                "",
                "**hrs. (hours)** - Used for:",
                "• Time-based services",
                "• Labor or consulting services",
                "• Services charged per hour",
                "",
                "**Selecting the correct unit:**",
                "• Choose 'pcs.' for fixed-price services",
                "• Choose 'hrs.' for time-based services",
                "• This affects how offers calculate total costs"
            ]
        },
        subServices: {
            title: "Managing Sub-services",
            content: [
                "**Purpose of Sub-services:**",
                "• Break down complex services into components",
                "• Provide detailed pricing for different sizes/types",
                "• Offer customers more specific options",
                "",
                "**Creating Sub-services:**",
                "1. Click 'Add Sub-service' button",
                "2. Fill in:",
                "   • Name - Sub-service description",
                "   • Size - Yacht size or specific measurement",
                "   • Price - Cost for this specific sub-service",
                "3. Add multiple sub-services as needed",
                "",
                "**Usage:** Sub-services appear in offers for detailed breakdown"
            ]
        },
        searchExport: {
            title: "Searching and Exporting",
            content: [
                "**Search Function:**",
                "• Type in search box to find services",
                "• Dropdown shows matching services",
                "• Select service to filter table",
                "• Clear search to show all services",
                "",
                "**Export to Excel:**",
                "• Click 'Export to Excel' button",
                "• Downloads current filtered view",
                "• Includes all visible columns",
                "• Use for:",
                "   - Client presentations",
                "   - Internal reports",
                "   - Backup purposes",
                "",
                "**Tips:** Export regularly to maintain price history"
            ]
        },
        creatingEditing: {
            title: "Creating and Editing Services",
            content: [
                "**Required Fields:**",
                "• Service Name - Descriptive name of service",
                "• Price in Euro excl. VAT - Must use proper format",
                "• Units of Measurement - Select pcs. or hrs.",
                "",
                "**Creating New Service:**",
                "1. Click 'Create' button",
                "2. Fill required fields",
                "3. Add sub-services if needed",
                "4. Click 'Add' to save",
                "",
                "**Editing Existing Service:**",
                "1. Click pencil icon in Actions column",
                "2. Modify any field",
                "3. Update sub-services if needed",
                "4. Click 'Update' to save changes",
                "",
                "**Deleting:** Click trash icon to remove service permanently"
            ]
        },
        bestPractices: {
            title: "Best Practices for Price Management",
            content: [
                "**Naming Conventions:**",
                "• Use clear, descriptive service names",
                "• Be consistent in naming patterns",
                "• Include relevant details in names",
                "",
                "**Price Updates:**",
                "• Update prices regularly for accuracy",
                "• Document price change reasons",
                "• Consider seasonal price adjustments",
                "",
                "**Sub-service Strategy:**",
                "• Create sub-services for complex offerings",
                "• Keep sub-service names specific",
                "• Include size/type variations",
                "",
                "**Data Integrity:**",
                "• Regularly review and update all services",
                "• Remove outdated or discontinued services",
                "• Keep measurement units accurate",
                "",
                "**Communication:**",
                "• Notify relevant teams of price changes",
                "• Update offer templates when prices change",
                "• Document special pricing arrangements"
            ]
        }
    };

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
                return '';
            },
            sortable: false,
        },
        {
            name: 'Price in EURO without VAT',
            selector: row => `${row.priceInEuroWithoutVAT || ''}€`,
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
                        title="Edit service"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete service"
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

    const handleDelete = (id) => {
        setServiceToDelete(id);
        setDeleteConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        
        setDeleting(true);
        try {
            await axios.post(`${URL}/pricelist/delete/${serviceToDelete}`);
            getData();
            toast.success("Price list deleted successfully");
            setDeleteConfirmModalOpen(false);
            setServiceToDelete(null);
        } catch (error) {
            console.log(error);
            toast.error("Error deleting price list");
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmModalOpen(false);
        setServiceToDelete(null);
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

    const handlePriceChange = (e) => {
        let value = e.target.value;
        
        // Разрешаем только цифры и запятую/точку
        value = value.replace(/[^\d,.]/g, '');
        
        // Заменяем точку на запятую если пользователь ввел точку
        value = value.replace('.', ',');
        
        // Проверяем на лишние запятые
        const commaCount = value.split(',').length - 1;
        if (commaCount > 1) {
            // Оставляем только первую запятую
            const parts = value.split(',');
            value = parts[0] + ',' + parts.slice(1).join('');
        }
        
        setPriceInputValue(value);
        
        // Конвертируем в числовой формат для хранения
        const numericValue = parseFloat(value.replace(',', '.'));
        if (!isNaN(numericValue)) {
            setFormData({ ...formData, priceInEuroWithoutVAT: numericValue.toFixed(2) });
        } else {
            setFormData({ ...formData, priceInEuroWithoutVAT: '' });
        }
    };

    const handlePriceFocus = (e) => {
        const value = formData.priceInEuroWithoutVAT;
        if (!value || value === '0.00' || value === '') {
            setPriceInputValue('00000,00');
        } else {
            const num = parseFloat(value) || 0;
            const cents = Math.round(num * 100);
            const formatted = String(cents).padStart(7, '0');
            setPriceInputValue(formatted.slice(0, -2) + ',' + formatted.slice(-2));
        }
    };

    const handlePriceBlur = (e) => {
        const value = formData.priceInEuroWithoutVAT;
        if (value) {
            const num = parseFloat(value) || 0;
            const formatted = num.toFixed(2).replace('.', ',');
            setPriceInputValue(formatted);
            setFormData({ ...formData, priceInEuroWithoutVAT: num.toFixed(2) });
        } else {
            setPriceInputValue('');
        }
    };

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

    const exportToExcel = async () => {
        const exportData = filteredData.map(row => ({
            'Service Name': row.serviceName || '',
            'Sub-services': row.subServices && Array.isArray(row.subServices) && row.subServices.length > 0
                ? row.subServices.map(sub => `${sub.name} (${sub.size})`).join(', ')
                : '',
            'Price in EURO without VAT': `${row.priceInEuroWithoutVAT || ''}€`,
            'Units of Measurement': row.unitsOfMeasurement || ''
        }));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Price List');
        const headers = Object.keys(exportData[0] || {});
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'price_list_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
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
                                {/* Help Button */}
                                <Button 
                                    onClick={() => setHelpModalOpen(true)}
                                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                                >
                                    <QuestionMarkCircleIcon className="w-5 h-5" />
                                    <span>Help</span>
                                </Button>
                                
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
                                                    : ''
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

                {/* Help/Manual Modal */}
                <Modal 
                    isOpen={helpModalOpen} 
                    onClose={() => setHelpModalOpen(false)} 
                    title="Price List Management Help & User Manual"
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
                                            return <div key={index} className="h-3"></div>;
                                        }
                                        
                                        return (
                                            <p key={index} className="text-sm leading-relaxed">
                                                {item}
                                            </p>
                                        );
                                    })}
                                </div>
                                
                                {/* Quick Tips for Overview Section */}
                                {activeHelpSection === 'overview' && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold text-blue-700 mb-2">Quick Start Guide</h3>
                                        <ul className="space-y-2 text-sm text-blue-600">
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use <strong>Search</strong> to quickly find services</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Click <strong>Create</strong> to add new services</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Follow <strong>price formatting</strong> rules carefully</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use <strong>sub-services</strong> for detailed pricing</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Price Format Examples */}
                                {activeHelpSection === 'priceFormat' && (
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <h3 className="font-semibold text-yellow-700 mb-2">Price Format Examples</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                                <span className="text-sm">What you want to enter:</span>
                                                <span className="font-semibold">100€</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                                <span className="text-sm">How to type it:</span>
                                                <span className="font-semibold">00100,00</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                                <span className="text-sm">What appears in table:</span>
                                                <span className="font-semibold">100,00€</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-yellow-600 mt-2">
                                            Note: The system automatically handles formatting. Just type numbers!
                                        </p>
                                    </div>
                                )}
                                
                                {/* Units of Measurement Info */}
                                {activeHelpSection === 'units' && (
                                    <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                                        <p className="text-sm text-purple-700">
                                            <span className="font-semibold">Important:</span> The unit of measurement affects how offers calculate totals. Choose carefully!
                                        </p>
                                    </div>
                                )}
                                
                                {/* Export Tips */}
                                {activeHelpSection === 'searchExport' && (
                                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                                        <p className="text-sm text-green-700">
                                            <span className="font-semibold">Tip:</span> Export your price list before making major changes to maintain a version history.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                For additional support, contact system administrator
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
                                        const printContent = `
                                            <html>
                                                <head>
                                                    <title>Price List Management Manual - ${helpSections[activeHelpSection].title}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                                                        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                                                        h2 { color: #555; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                                                        h3 { color: #666; margin-top: 15px; }
                                                        p { line-height: 1.6; margin: 10px 0; }
                                                        ul { margin-left: 20px; }
                                                        li { margin-bottom: 5px; line-height: 1.5; }
                                                        .tip { background: #f0f8ff; padding: 10px; border-left: 4px solid #007bff; margin: 15px 0; }
                                                        .note { background: #fff8e1; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                                                        .highlight { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-weight: bold; }
                                                        .example { background: #f9f9f9; padding: 10px; border-left: 4px solid #6f42c1; margin: 15px 0; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <h1>${helpSections[activeHelpSection].title}</h1>
                                                    ${helpSections[activeHelpSection].content.map(item => {
                                                        if (item.includes('**')) {
                                                            const htmlItem = item.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');
                                                            return item.startsWith('•') ? `<p>${htmlItem}</p>` : `<p>${htmlItem}</p>`;
                                                        }
                                                        return item.startsWith('•') ? `<p>${item}</p>` : `<p>${item}</p>`;
                                                    }).join('')}
                                                    ${activeHelpSection === 'overview' ? `
                                                        <div class="tip">
                                                            <h3>Quick Start Guide</h3>
                                                            <ul>
                                                                <li>Use <span class="highlight">Search</span> to quickly find services</li>
                                                                <li>Click <span class="highlight">Create</span> to add new services</li>
                                                                <li>Follow <span class="highlight">price formatting</span> rules carefully</li>
                                                                <li>Use <span class="highlight">sub-services</span> for detailed pricing</li>
                                                            </ul>
                                                        </div>
                                                    ` : ''}
                                                    ${activeHelpSection === 'priceFormat' ? `
                                                        <div class="example">
                                                            <h3>Price Format Examples</h3>
                                                            <div style="margin: 10px 0;">
                                                                <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border: 1px solid #ddd; margin: 5px 0;">
                                                                    <span>What you want to enter:</span>
                                                                    <span style="font-weight: bold;">100€</span>
                                                                </div>
                                                                <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border: 1px solid #ddd; margin: 5px 0;">
                                                                    <span>How to type it:</span>
                                                                    <span style="font-weight: bold;">00100,00</span>
                                                                </div>
                                                                <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border: 1px solid #ddd; margin: 5px 0;">
                                                                    <span>What appears in table:</span>
                                                                    <span style="font-weight: bold;">100,00€</span>
                                                                </div>
                                                            </div>
                                                            <p style="font-size: 12px; color: #666; margin-top: 5px;">
                                                                Note: The system automatically handles formatting. Just type numbers!
                                                            </p>
                                                        </div>
                                                    ` : ''}
                                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                                        <p>Printed from Price List Management System on ${new Date().toLocaleDateString()}</p>
                                                        <p>© ${new Date().getFullYear()} Price List Management System. All rights reserved.</p>
                                                    </div>
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

                {/* Create/Edit Modal */}
                <Modal isOpen={modalIsOpen} onClose={closeModal} title={editMode ? "Edit Service" : "Create New Service"}>
                    <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Required Fields:</span> All fields must be completed
                                </p>
                            </div>
                            
                            <Input
                                label="Service Name *"
                                name="serviceName"
                                value={formData.serviceName}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Engine Maintenance, Hull Cleaning"
                            />
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Price in Euro excl. VAT *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="priceInEuroWithoutVAT"
                                        value={priceInputValue}
                                        onChange={handlePriceChange}
                                        onFocus={handlePriceFocus}
                                        onBlur={handlePriceBlur}
                                        placeholder="00000,00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                                        required
                                    />
                                    <div className="absolute right-3 top-2.5 text-gray-500">€</div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Format: 00113,45 (comma as decimal separator)
                                </p>
                            </div>

                            <Select
                                label="Units of Measurement *"
                                value={formData.unitsOfMeasurement}
                                onChange={(value) => setFormData({ ...formData, unitsOfMeasurement: value })}
                                className="text-black border-gray-300 rounded-xs [&>div]:text-black"
                                labelProps={{ className: 'text-black' }}
                                required
                            >
                                <Option className="text-black" value="">Select...</Option>
                                <Option className="text-black" value="pcs.">pcs. (pieces)</Option>
                                <Option className="text-black" value="hrs.">hrs. (hours)</Option>
                            </Select>

                            {/* Sub-services Section */}
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-black">Sub-services (Optional)</h3>
                                        <p className="text-sm text-gray-500">Add detailed service components</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddSubService}
                                        size="sm"
                                        className="bg-blue-500 text-white hover:bg-blue-600"
                                    >
                                        Add Sub-service
                                    </Button>
                                </div>
                                {formData.subServices && formData.subServices.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.subServices.map((subService, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded space-y-2 border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-medium text-black">Sub-service {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRemoveSubService(index)}
                                                        size="sm"
                                                        className="bg-red-500 text-white hover:bg-red-600"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <Input
                                                    label="Sub-service Name"
                                                    value={subService.name || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'name', e.target.value)}
                                                    placeholder="e.g., Cleaning, Polishing"
                                                />
                                                <Input
                                                    label="Size (e.g., yacht size)"
                                                    value={subService.size || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'size', e.target.value)}
                                                    placeholder="e.g., 10m, 15m, 20m"
                                                />
                                                <Input
                                                    label="Price"
                                                    type="text"
                                                    value={subService.price || ''}
                                                    onChange={(e) => handleSubServiceChange(index, 'price', e.target.value)}
                                                    placeholder="Additional price for this size"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formData.subServices.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded">
                                        No sub-services added. Click &quot;Add Sub-service&quot; to create detailed service components.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="text" color="red" onClick={closeModal} className="w-full md:w-auto">
                                    <span>Cancel</span>
                                </Button>
                                <Button color="green" type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                                    <span>{editMode ? 'Update Service' : 'Create Service'}</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                    <div className="space-y-4">
                        {serviceToDelete && (() => {
                            const service = data.find(s => s.id === serviceToDelete);
                            return (
                                <p className="text-gray-700">
                                    Are you sure you want to delete service <strong>"{service?.serviceName || `#${serviceToDelete}`}"</strong>? This action cannot be undone.
                                </p>
                            );
                        })()}
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
            </div>
        </>
    );
};

export default PriceListPage;