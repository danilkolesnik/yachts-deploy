"use client"
import React, { useState, useEffect } from 'react';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import Header from '@/component/header';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
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
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');

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

    // Manual/Help content in English
    const helpSections = {
        overview: {
            title: "Yacht Management System - User Manual",
            content: [
                "Welcome to the Yacht Management System! This comprehensive guide will help you manage all yacht-related information efficiently.",
                "The system allows you to create, edit, view, and delete yacht records with detailed technical specifications and owner information.",
                "Use the 'Help' button for quick access to this manual anytime."
            ]
        },
        navigation: {
            title: "Understanding the Yacht Table",
            content: [
                "**Boat Registration** - Official registration number/code of the yacht",
                "**Date** - Date when the yacht record was created",
                "**Name** - Yacht's given name",
                "**Model** - Yacht model/manufacturer",
                "**Owner Contacts** - Owner name and contact details (email, phone, address)",
                "**Engine Hours** - Engine running hours for each motor",
                "**Actions** - Edit or delete yacht records"
            ]
        },
        creatingYacht: {
            title: "Creating a New Yacht Record - Step by Step",
            content: [
                "**Required Fields:**",
                "• Yacht Name - Unique identifier for the yacht",
                "• Model - Manufacturer and model information",
                "• Boat Registration - Official registration number",
                "",
                "**Owner Contacts Section (Optional):**",
                "• Owner - Name of the yacht owner",
                "• Email, Phone, Address - Contact details",
                "",
                "**Technical Specifications (Optional):**",
                "• Engine Hours - Add motors and their running hours",
                "• Generators - Specify if yacht has generators",
                "• Air Conditioners - Specify air conditioning units",
                "",
                "**Tips:** Fill as much information as possible for comprehensive records."
            ]
        },
        technicalSpecs: {
            title: "Technical Specifications Guide",
            content: [
                "**Engine Hours Section:**",
                "• Number of Motors - Select how many engines the yacht has",
                "• For each motor: specify model and running hours",
                "",
                "**Generators Section:**",
                "• First select if yacht has generators (Yes/No)",
                "• If Yes, specify number of generators",
                "• For each generator: model and running hours",
                "",
                "**Air Conditioners Section:**",
                "• Select if yacht has AC units (Yes/No)",
                "• If Yes, specify number of AC units",
                "• For each AC: model and running hours",
                "",
                "**Description:** Add any additional notes or special requirements"
            ]
        },
        searching: {
            title: "Searching and Filtering Yachts",
            content: [
                "**Search by:** Select search criteria:",
                "• Name - Search by yacht name",
                "• Model - Search by yacht model",
                "",
                "**Search box:** Enter text to filter yacht list",
                "",
                "**Real-time filtering:** Results update as you type",
                "",
                "**Tips:** Use registration numbers for precise searches"
            ]
        },
        editing: {
            title: "Editing Yacht Information",
            content: [
                "To edit a yacht record:",
                "1. Click the **Edit icon (pencil)** in the Actions column",
                "2. Modify any field in the edit form",
                "3. Click **Save** to update",
                "",
                "**Important:**",
                "• All changes are saved immediately",
                "• You can update technical specifications anytime",
                "• Owner information can be added or modified",
                "",
                "**Deleting:** Use the trash icon to remove yacht records permanently"
            ]
        },
        bestPractices: {
            title: "Best Practices & Tips",
            content: [
                "**Data Accuracy:**",
                "• Always verify boat registration numbers",
                "• Keep engine hours up to date",
                "• Include all owner contact information",
                "",
                "**Organization:**",
                "• Use consistent naming conventions",
                "• Update records after maintenance",
                "• Add detailed descriptions for special requirements",
                "",
                "**Security:**",
                "• Keep owner contact information confidential",
                "• Regular backups of yacht data",
                "• Limit editing permissions as needed"
            ]
        }
    };

    const columns = [
        {
            name: 'Boat Registration',
            selector: row => row.countryCode,
            sortable: true,
        },
        {
            name: "Date",
            selector: row => new Date(row.createdAt).toLocaleDateString(),
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
            name: 'Owner Contacts',
            selector: row => {
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
                        title="Edit yacht"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete yacht"
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
        if (window.confirm("Are you sure you want to delete this yacht? This action cannot be undone.")) {
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
                                {/* Help Button */}
                                <Button 
                                    onClick={() => setHelpModalOpen(true)}
                                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                                >
                                    <QuestionMarkCircleIcon className="w-5 h-5" />
                                    <span>Help</span>
                                </Button>
                                
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

                {/* Help/Manual Modal */}
                <Modal 
                    isOpen={helpModalOpen} 
                    onClose={() => setHelpModalOpen(false)} 
                    title="Yacht Management Help & User Manual"
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
                                                <span>Click <strong>Create</strong> to add a new yacht</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Use <strong>Search</strong> to quickly find yachts</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Click <strong>Edit</strong> (pencil icon) to update information</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-blue-500">•</span>
                                                <span>Complete all required fields marked with *</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Field Requirements for Creating Yacht */}
                                {activeHelpSection === 'creatingYacht' && (
                                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                        <p className="text-sm text-yellow-700">
                                            <span className="font-semibold">Note:</span> Only <strong>Yacht Name</strong>, <strong>Model</strong>, and <strong>Boat Registration</strong> are required fields. All other information is optional but recommended.
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
                                                    <title>Yacht Management Manual - ${helpSections[activeHelpSection].title}</title>
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
                                                                <li>Click <span class="highlight">Create</span> to add a new yacht</li>
                                                                <li>Use <span class="highlight">Search</span> to quickly find yachts</li>
                                                                <li>Click <span class="highlight">Edit</span> (pencil icon) to update information</li>
                                                                <li>Complete all required fields marked with *</li>
                                                            </ul>
                                                        </div>
                                                    ` : ''}
                                                    ${activeHelpSection === 'creatingYacht' ? `
                                                        <div class="note">
                                                            <p><strong>Note:</strong> Only <span class="highlight">Yacht Name</span>, <span class="highlight">Model</span>, and <span class="highlight">Boat Registration</span> are required fields. All other information is optional but recommended.</p>
                                                        </div>
                                                    ` : ''}
                                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                                        <p>Printed from Yacht Management System on ${new Date().toLocaleDateString()}</p>
                                                        <p>© ${new Date().getFullYear()} Yacht Management System. All rights reserved.</p>
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
                    <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                        <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Required Fields:</span> Yacht Name, Model, and Boat Registration
                            </p>
                        </div>
                        <Input
                            label="Yacht Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Model *"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Boat Registration *"
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            required
                        />
                        
                        {/* Owner Contacts Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Owner Contacts (Optional)</h3>
                            <Input
                                label="Owner"
                                name="owner"
                                value={formData.owner}
                                onChange={handleChange}
                            />
                            <div className="space-y-2">
                                <h4 className="text-md font-medium text-black">Contact(s) details</h4>
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
                            <h3 className="text-lg font-semibold text-black">Engine Hours (Motors) (Optional)</h3>
                            <Select
                                label="Number of Motors"
                                value={formData.engineCount}
                                onChange={handleEngineCountChange}
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
                            {formData.engineCount && parseInt(formData.engineCount) > 0 && (
                                <div className="space-y-4 pl-4 border-l-2">
                                    {formData.engines.map((engine, index) => (
                                        <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium text-black">Motor {index + 1}</h4>
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
                            <h3 className="text-lg font-semibold text-black">Generators (Optional)</h3>
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
                                className="text-black border-gray-300 rounded-xs [&>div]:text-black"
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
                                    {formData.generatorCount && parseInt(formData.generatorCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {formData.generators.map((generator, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium text-black">Generator {index + 1}</h4>
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
                            <h3 className="text-lg font-semibold text-black">Air Conditioners (Optional)</h3>
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
                                className="text-black border-gray-300 rounded-xs [&>div]:text-black"
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
                                    {formData.airConditionerCount && parseInt(formData.airConditionerCount) > 0 && (
                                        <div className="space-y-4 pl-4 border-l-2">
                                            {formData.airConditioners.map((ac, index) => (
                                                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded">
                                                    <h4 className="font-medium text-black">Air Conditioner {index + 1}</h4>
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
                            label="Description (Optional)"
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
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal isOpen={editModalIsOpen} onClose={() => setEditModalIsOpen(false)} title="Edit Yacht">
                    <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Required Fields:</span> Yacht Name, Model, and Boat Registration
                            </p>
                        </div>
                        <Input
                            label="Yacht Name *"
                            name="name"
                            value={editingYacht?.name || ''}
                            onChange={handleEditChange}
                            required
                        />
                        <Input
                            label="Model *"
                            name="model"
                            value={editingYacht?.model || ''}
                            onChange={handleEditChange}
                            required
                        />
                        <Input
                            label="Boat Registration *"
                            name="countryCode"
                            value={editingYacht?.countryCode || ''}
                            onChange={handleEditChange}
                            required
                        />
                        
                        {/* Owner Contacts Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-black">Owner Contacts (Optional)</h3>
                            <Input
                                label="Owner"
                                name="owner"
                                value={editingYacht?.owner || ''}
                                onChange={handleEditChange}
                            />
                            <div className="space-y-2">
                                <h4 className="text-md font-medium text-black">Contact(s) details</h4>
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
                            <h3 className="text-lg font-semibold text-black">Engine Hours (Motors) (Optional)</h3>
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
                                            <h4 className="font-medium text-black">Motor {index + 1}</h4>
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
                            <h3 className="text-lg font-semibold text-black">Generators (Optional)</h3>
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
                                                    <h4 className="font-medium text-black">Generator {index + 1}</h4>
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
                            <h3 className="text-lg font-semibold text-black">Air Conditioners (Optional)</h3>
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
                                                    <h4 className="font-medium text-black">Air Conditioner {index + 1}</h4>
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
                            label="Description (Optional)"
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
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default YachtsPage;