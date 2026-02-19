"use client"
import React, { useEffect, useState, useRef } from 'react';
import { Button, Select, Option } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { PencilIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Header from '@/component/header';
import SearchInput from '@/component/search';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const WarehousePage = () => {
    const [data, setData] = useState([]);   
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        inventory: '',
        comment: '',
        countryCode: '',
        pricePerUnit: '',
        articleNumber: ''
    });
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [activeHelpSection, setActiveHelpSection] = useState('overview');
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [partToDelete, setPartToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();
    const tableRef = useRef(null);

    // Manual/Help content in English
    const helpSections = {
        overview: {
            title: "Warehouse Management System - User Manual",
            content: [
                "Welcome to the Warehouse Management System! This system manages unofficial warehouse inventory (parts without documents).",
                "Track inventory, prices, and service categories for all parts that don't have official documentation.",
                "Use the 'Help' button for quick access to this manual at any time."
            ]
        },
        navigation: {
            title: "Understanding the Warehouse Table",
            content: [
                "**Name** - Part or item name",
                "**Quantity** - Current stock quantity available",
                "**Comment** - Additional notes or specifications",
                "**Price** - Price per unit in Euros (€)",
                "**Actions** - Edit or delete warehouse records",
                "",
                "**Important:** This is the unofficial warehouse - parts here do not have formal documentation"
            ]
        },
        officialVsUnofficial: {
            title: "Official vs Unofficial Warehouse",
            content: [
                "**Unofficial Warehouse (This System):**",
                "• Parts without formal documentation",
                "• Used or refurbished parts",
                "• Parts without warranty",
                "• Typically lower-cost items",
                "",
                "**Official Warehouse:**",
                "• Parts with full documentation",
                "• New parts with warranty",
                "• Higher price point",
                "• Used in formal offers",
                "",
                "**When to use Unofficial Warehouse:**",
                "• For budget-conscious repairs",
                "• When documentation is not required",
                "• For non-critical parts",
                "• When cost is primary concern"
            ]
        },
        creatingParts: {
            title: "Adding Parts to Unofficial Warehouse",
            content: [
                "**Required Fields:**",
                "• Name - Descriptive name of the part",
                "• Quantity - How many units in stock",
                "• Price - Price per unit in Euros",
                "",
                "**Optional Fields:**",
                "• Comment - Additional details or specifications",
                "",
                "**Step-by-Step Creation:**",
                "1. Click 'Create' button",
                "2. Fill in all required fields",
                "4. Click 'Add' to save",
                "",
            ]
        },
        inventoryManagement: {
            title: "Inventory Management Best Practices",
            content: [
                "**Quantity Tracking:**",
                "• Update quantities immediately when parts are used",
                "• Set reorder points for critical items",
                "• Regular physical inventory counts",
                "",
                "**Pricing Strategy:**",
                "• Price should reflect part condition (used/refurbished)",
                "• Consider market prices for similar parts",
                "• Document price changes",
                "",
                "**Comment Usage:**",
                "• Document part condition",
                "• Note any special requirements",
                "• Record supplier information",
                "• Add compatibility notes"
            ]
        },
        searchExport: {
            title: "Searching and Exporting Warehouse Data",
            content: [
                "**Search Function:**",
                "• Search by part name, or comments",
                "• Real-time filtering as you type",
                "• Select from dropdown for precise matching",
                "",
                "**Export to Excel:**",
                "• Click 'Export to Excel' button",
                "• Downloads current filtered view",
                "• Includes all visible columns",
                "• Useful for:",
                "   - Inventory reporting",
                "   - Supplier orders",
                "   - Financial analysis",
                "   - Backup purposes",
                "",
                "**View History:**",
                "• Track changes over time",
                "• View part usage history",
                "• Monitor inventory trends"
            ]
        },
        editingDeleting: {
            title: "Editing and Deleting Parts",
            content: [
                "**Editing Parts:**",
                "1. Click pencil icon in Actions column",
                "2. Modify any field",
                "3. Click 'Update' to save changes",
                "",
                "**When to Edit:**",
                "• Update quantity after use",
                "• Change price due to market conditions",
                "• Add additional comments",
                "• Change service category",
                "",
                "**Deleting Parts:**",
                "• Click trash icon to remove part",
                "• Confirmation required before deletion",
                "• Use when part is no longer available",
                "• Consider setting quantity to 0 instead of deleting"
            ]
        },
        bestPractices: {
            title: "Best Practices for Unofficial Warehouse",
            content: [
                "**Data Accuracy:**",
                "• Keep quantities up-to-date",
                "• Update prices regularly",
                "• Ensure correct service category assignment",
                "",
                "**Inventory Control:**",
                "• Regular audits of unofficial inventory",
                "• Document part condition thoroughly",
                "• Set minimum stock levels",
                "",
                "**Financial Management:**",
                "• Track cost vs selling price",
                "• Document profit margins",
                "• Regular financial reporting",
                "",
                "**Customer Communication:**",
                "• Clearly explain unofficial vs official parts",
                "• Document customer choices in offers",
                "• Maintain transparency about warranties",
                "",
                "**Legal Compliance:**",
                "• Ensure proper labeling of unofficial parts",
                "• Maintain safety standards",
                "• Document customer agreements for unofficial parts"
            ]
        }
    };

    const columns = [
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Article Number',
            selector: row => row.articleNumber || '',
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
            selector: row => `${row.pricePerUnit || ''}€`,
            sortable: true,
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit part"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete part"
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await axios.put(`${URL}/warehouse/${editId}`, formData);
                toast.success("Warehouse updated successfully");
            } else {
                switch (true) {
                    // case formData.serviceCategory.serviceName === '':
                    //     toast.error("Error: Service category is required");
                    //     return;
                    case formData.pricePerUnit.trim() === '':
                        toast.error("Error: Price per unit is required");
                        return;
                    case formData.name.trim() === '':
                        toast.error("Error: Name is required");
                        return;
                    case formData.quantity.trim() === '':
                        toast.error("Error: Quantity is required");
                        return;
                }
                await axios.post(`${URL}/warehouse/create`, {
                    ...formData,
                    unofficially: true
                });
                toast.success("Warehouse created successfully");
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
            toast.error("Error updating warehouse");
        }
    };

    const handleEdit = (row) => {
        setFormData({
            name: row.name,
            quantity: row.quantity,
            inventory: row.inventory,
            comment: row.comment,
            countryCode: "",
            serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' },
            pricePerUnit: row.pricePerUnit,
            articleNumber: row.articleNumber || ''
        });
        setEditMode(true);
        setEditId(row.id);
        setModalIsOpen(true);
};


    const handleDelete = (id) => {
        setPartToDelete(id);
        setDeleteConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!partToDelete) return;
        
        setDeleting(true);
        try {
            await axios.post(`${URL}/warehouse/delete/${partToDelete}`);
            getData().then((res) => {
                setData(res);
                setFilteredData(res);
            })
            toast.success("Warehouse deleted successfully");
            setDeleteConfirmModalOpen(false);
            setPartToDelete(null);
        } catch (error) {
            console.log(error);
            toast.error("Error deleting warehouse");
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmModalOpen(false);
        setPartToDelete(null);
    };

    const openModal = () => {
        setFormData({
            name: '',
            quantity: '',
            inventory: '',
            comment: '',
            countryCode: '',
            serviceCategory: { serviceName: '', priceInEuroWithoutVAT: '' },
            pricePerUnit: '',
            articleNumber: ''
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
        setSearch(item.name);
        setFilteredData([item]);
    };

    const handleHistoryClick = () => {
        router.push('/warehouseHistory');
    };

    const exportToExcel = async () => {
        const exportData = filteredData.map(row => ({
            'Name': row.name || '',
            'Article Number': row.articleNumber || '',
            'Quantity': row.quantity || '',
            'Comment': row.comment || '',
            'Price': `${row.pricePerUnit || ''}€`,
        }));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Unofficial Warehouse');
        const headers = Object.keys(exportData[0] || {});
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unofficial_warehouse_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        Promise.all([getData()])
            .then(([res1]) => {
                setData(res1);
                setFilteredData(res1);
            });
    }, []);

    useEffect(() => {
        const result = data.filter(item => 
            (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
            (item.countryCode && item.countryCode.toLowerCase().includes(search.toLowerCase()))
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
                            {/* Help Button */}
                            <Button 
                                onClick={() => setHelpModalOpen(true)}
                                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                                <span>Help</span>
                            </Button>
                            
                            <Button onClick={openModal} className="w-full md:w-auto bg-[#dd3333] text-white">
                                Create
                            </Button>
                            <Button className="w-full md:w-auto bg-[#282828] text-white" onClick={exportToExcel}>
                                Export to Excel
                            </Button>
                            <Button onClick={handleHistoryClick} color="white" className="w-full md:w-auto border-[2px] border-[#D33] text-[#000]">
                                View History
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table ref={tableRef} style={{ display: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Article Number</th>
                                    <th>Quantity</th>
                                    <th>Comment</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                    {filteredData.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.name || ''}</td>
                                            <td>{row.articleNumber || ''}</td>
                                            <td>{row.quantity || ''}</td>
                                            <td>{row.comment || ''}</td>
                                            <td>{`${row.pricePerUnit || ''}€`}</td> 
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
                title="Unofficial Warehouse Management Help & User Manual"
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
                                            <span>Use <strong>Search</strong> to quickly find parts</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Click <strong>Create</strong> to add new parts</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Update <strong>quantities</strong> when parts are used</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Export data regularly for <strong>backup</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {/* Warning for Unofficial Warehouse */}
                            {activeHelpSection === 'officialVsUnofficial' && (
                                <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                                    <h4 className="font-semibold text-orange-700 mb-2">⚠️ Important Notice</h4>
                                    <p className="text-sm text-orange-600">
                                        Unofficial warehouse parts do not come with formal documentation or warranty. 
                                        Always inform customers when using unofficial parts and document their agreement.
                                    </p>
                                </div>
                            )}
                            
                            {/* Export Tips */}
                            {activeHelpSection === 'searchExport' && (
                                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                                    <p className="text-sm text-green-700">
                                        <span className="font-semibold">Tip:</span> Export your inventory data monthly for financial reporting and audit purposes.
                                    </p>
                                </div>
                            )}
                            
                            {/* Category Assignment Tip */}
                            {activeHelpSection === 'creatingParts' && (
                                <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                                    <p className="text-sm text-purple-700">
                                        <span className="font-semibold">Note:</span> Service category selection determines which offers this part will appear in. Choose carefully!
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
                                                <title>Unofficial Warehouse Manual - ${helpSections[activeHelpSection].title}</title>
                                                <style>
                                                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                                                    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                                                    h2 { color: #555; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                                                    h3 { color: #666; margin-top: 15px; }
                                                    h4 { color: #777; margin-top: 10px; }
                                                    p { line-height: 1.6; margin: 10px 0; }
                                                    ul { margin-left: 20px; }
                                                    li { margin-bottom: 5px; line-height: 1.5; }
                                                    .tip { background: #f0f8ff; padding: 10px; border-left: 4px solid #007bff; margin: 15px 0; }
                                                    .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                                                    .highlight { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-weight: bold; }
                                                    .note { background: #e7f1ff; padding: 10px; border-left: 4px solid #0d6efd; margin: 15px 0; }
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
                                                            <li>Use <span class="highlight">Search</span> to quickly find parts</li>
                                                            <li>Click <span class="highlight">Create</span> to add new parts</li>
                                                            <li>Update <span class="highlight">quantities</span> when parts are used</li>
                                                            <li>Export data regularly for <span class="highlight">backup</span></li>
                                                        </ul>
                                                    </div>
                                                ` : ''}
                                                ${activeHelpSection === 'officialVsUnofficial' ? `
                                                    <div class="warning">
                                                        <h4>⚠️ Important Notice</h4>
                                                        <p>Unofficial warehouse parts do not come with formal documentation or warranty. 
                                                        Always inform customers when using unofficial parts and document their agreement.</p>
                                                    </div>
                                                ` : ''}
                                                ${activeHelpSection === 'creatingParts' ? `
                                                    <div class="note">
                                                        <p><strong>Note:</strong> Service category selection determines which offers this part will appear in. Choose carefully!</p>
                                                    </div>
                                                ` : ''}
                                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                                    <p>Printed from Unofficial Warehouse Management System on ${new Date().toLocaleDateString()}</p>
                                                    <p>© ${new Date().getFullYear()} Warehouse Management System. All rights reserved.</p>
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
            <Modal isOpen={modalIsOpen} onClose={closeModal} title={editMode ? "Edit Part" : "Add New Part to Unofficial Warehouse"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                            <span className="font-semibold">Unofficial Warehouse:</span> These parts do not have formal documentation or warranty.
                        </p>
                    </div>
                    
                    <Input
                        label="Part Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Engine Filter, Propeller"
                    />
                    <Input
                        label="Article Number"
                        name="articleNumber"
                        value={formData.articleNumber}
                        onChange={handleChange}
                        placeholder="e.g., ART-12345"
                    />
                    <Input
                        label="Quantity *"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        placeholder="Number of units in stock"
                    />
                    <Input
                        label="Price per Unit (€) *"
                        name="pricePerUnit"
                        type="text"
                        value={formData.pricePerUnit}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 45.50"
                    />
                    <Input
                        label="Comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Condition, specifications, notes"
                    />
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                            <span className="font-semibold">Reminder:</span> This part will be added to the unofficial warehouse (no documentation/warranty).
                        </p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button variant="text" color="red" onClick={closeModal} className="w-full md:w-auto">
                            <span>Cancel</span>
                        </Button>
                        <Button color="green" type="submit" className="w-full md:w-auto">
                            <span>{editMode ? 'Update Part' : 'Add to Unofficial Warehouse'}</span>
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                <div className="space-y-4">
                    {partToDelete && (() => {
                        const part = data.find(p => p.id === partToDelete);
                        return (
                            <p className="text-gray-700">
                                Are you sure you want to delete part <strong>&quot;{part?.name || `#${partToDelete}`}&quot;</strong>? This action cannot be undone.
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

export default WarehousePage;