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
import Header from '@/component/header';
import SearchInput from '@/component/search';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ExcelJS from 'exceljs';
import { ClipLoader } from 'react-spinners';

const WarehouseUnofficiallyPage = () => {
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
            title: "Official Warehouse Management System - User Manual",
            content: [
                "Welcome to the Official Warehouse Management System! This system manages inventory of parts with full documentation and warranty.",
                "Track official parts that come with proper documentation, warranty certificates, and meet all regulatory requirements.",
                "Use the 'Help' button for quick access to this manual at any time."
            ]
        },
        navigation: {
            title: "Understanding the Official Warehouse Table",
            content: [
                "**Name** - Official part name with manufacturer specifications",
                "**Quantity** - Current stock of certified parts",
                "**Comment** - Technical specifications or special notes",
                "**Price** - Official price per unit including documentation",
                "**Service Category** - Service category this certified part belongs to",
                "**Actions** - Edit or delete official warehouse records",
                "",
                "**Important:** This is the official warehouse - all parts here have full documentation and warranty"
            ]
        },
        officialVsUnofficial: {
            title: "Official vs Unofficial Warehouse - Key Differences",
            content: [
                "**Official Warehouse (This System):**",
                "• Full manufacturer documentation",
                "• Valid warranty certificates",
                "• New parts with original packaging",
                "• Meets all regulatory requirements",
                "• Higher price reflecting certification",
                "",
                "**Unofficial Warehouse:**",
                "• No formal documentation",
                "• No warranty coverage",
                "• Used or refurbished parts",
                "• Lower cost, higher risk",
                "",
                "**When to use Official Warehouse:**",
                "• For warranty-required repairs",
                "• When documentation is legally required",
                "• For critical system components",
                "• When customer requests certified parts"
            ]
        },
        creatingParts: {
            title: "Adding Parts to Official Warehouse",
            content: [
                "**Required Fields:**",
                "• Name - Official manufacturer part name",
                "• Quantity - Number of certified units in stock",
                "• Price - Official price including documentation",
                "• Service Category - Must select a category",
                "",
                "**Documentation Requirements:**",
                "• Warranty certificates must be filed separately",
                "• Manufacturer documentation should be scanned",
                "• Certification numbers should be recorded",
                "",
                "**Step-by-Step Creation:**",
                "1. Click 'Create' button",
                "2. Fill in all required fields",
                "3. Select appropriate service category",
                "4. Click 'Add' to save certified part",
                "",
                "**Verification:** Always verify part numbers match manufacturer specifications"
            ]
        },
        qualityAssurance: {
            title: "Quality Assurance for Official Parts",
            content: [
                "**Documentation Verification:**",
                "• Verify all certificates are valid",
                "• Check expiration dates on warranties",
                "• Ensure documentation matches part numbers",
                "",
                "**Storage Requirements:**",
                "• Store in appropriate conditions",
                "• Maintain original packaging when possible",
                "• Implement first-in-first-out (FIFO) system",
                "",
                "**Tracking Systems:**",
                "• Record batch numbers",
                "• Track warranty start dates",
                "• Document supplier information",
                "",
                "**Inspection Procedures:**",
                "• Regular quality checks",
                "• Verify against manufacturer specs",
                "• Document any quality issues"
            ]
        },
        inventoryManagement: {
            title: "Inventory Management for Official Parts",
            content: [
                "**Stock Control:**",
                "• Maintain minimum stock levels for critical parts",
                "• Set reorder points based on lead times",
                "• Regular physical inventory verification",
                "",
                "**Pricing Strategy:**",
                "• Include documentation costs in pricing",
                "• Factor in warranty administration",
                "• Consider market position and value",
                "",
                "**Service Category Assignment:**",
                "• Assign to correct service categories",
                "• Ensures parts appear in appropriate offers",
                "• Multiple parts can share same category",
                "",
                "**Comment Usage:**",
                "• Document certification details",
                "• Note warranty terms",
                "• Record supplier quality ratings"
            ]
        },
        searchExport: {
            title: "Searching and Exporting Official Inventory",
            content: [
                "**Search Function:**",
                "• Search by part name, service category, or comments",
                "• Real-time filtering as you type",
                "• Select from dropdown for precise matching",
                "",
                "**Export to Excel:**",
                "• Click 'Export to Excel' button",
                "• Downloads current filtered view",
                "• Includes all visible columns",
                "• Essential for:",
                "   - Audits and compliance reporting",
                "   - Insurance documentation",
                "   - Financial reporting",
                "   - Supplier management",
                "",
                "**View History:**",
                "• Track certification changes",
                "• View warranty expiration dates",
                "• Monitor quality assurance history"
            ]
        },
        bestPractices: {
            title: "Best Practices for Official Warehouse",
            content: [
                "**Compliance Management:**",
                "• Maintain up-to-date certification records",
                "• Regularly audit documentation",
                "• Ensure regulatory compliance",
                "",
                "**Quality Control:**",
                "• Implement regular quality inspections",
                "• Document all quality issues",
                "• Maintain supplier quality ratings",
                "",
                "**Financial Management:**",
                "• Track certification costs separately",
                "• Document warranty administration expenses",
                "• Regular financial reporting for certified inventory",
                "",
                "**Customer Service:**",
                "• Provide full documentation to customers",
                "• Explain warranty terms clearly",
                "• Document customer receipt of certified parts",
                "",
                "**Risk Management:**",
                "• Insure high-value certified inventory",
                "• Maintain backup documentation",
                "• Implement security measures for valuable parts"
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
            name: 'Service Category',
            selector: row => row.serviceCategory?.serviceName || '',
            sortable: true,
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit official part"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete official part"
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
            const res = await axios.get(`${URL}/warehouse/unofficially`);
            return res.data.data;
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
                toast.success("Official warehouse updated successfully");
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
                    unofficially: false
                });
                toast.success("Official part added to warehouse successfully");
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
            toast.error("Error updating official warehouse");
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
            toast.success("Official part deleted successfully");
            setDeleteConfirmModalOpen(false);
            setPartToDelete(null);
        } catch (error) {
            console.log(error);
            toast.error("Error deleting official part");
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

    const exportToExcel = async () => {
        const exportData = filteredData.map(row => ({
            'Name': row.name || '',
            'Quantity': row.quantity || '',
            'Comment': row.comment || '',
            'Price': `${row.pricePerUnit || ''}€`,
            'Service Category': row.serviceCategory?.serviceName || ''
        }));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Official Warehouse');
        const headers = Object.keys(exportData[0] || {});
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'official_warehouse_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
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
                            {/* Help Button */}
                            <Button 
                                onClick={() => setHelpModalOpen(true)}
                                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                                <span>Help</span>
                            </Button>
                            
                            <Button onClick={openModal} className="w-full md:w-auto bg-[#dd3333] text-white">
                                Add Official Part
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
                                    <th>Quantity</th>
                                    <th>Comment</th>
                                    <th>Price</th>
                                    <th>Service Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row) => (
                                    <tr key={row.id}>
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

            {/* Help/Manual Modal */}
            <Modal 
                isOpen={helpModalOpen} 
                onClose={() => setHelpModalOpen(false)} 
                title="Official Warehouse Management Help & User Manual"
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
                                            <span>Use <strong>Search</strong> to find certified parts</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Click <strong>Add Official Part</strong> for certified inventory</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Maintain <strong>documentation</strong> separately</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>Export for <strong>audit and compliance</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {/* Certification Requirements */}
                            {activeHelpSection === 'officialVsUnofficial' && (
                                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                                    <h4 className="font-semibold text-green-700 mb-2">✓ Certification Requirements</h4>
                                    <ul className="text-sm text-green-600 space-y-1">
                                        <li>• Manufacturer documentation must be on file</li>
                                        <li>• Warranty certificates must be valid</li>
                                        <li>• Certification numbers must be recorded</li>
                                        <li>• Quality inspection records must be maintained</li>
                                    </ul>
                                </div>
                            )}
                            
                            {/* Documentation Tip */}
                            {activeHelpSection === 'creatingParts' && (
                                <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                                    <p className="text-sm text-purple-700">
                                        <span className="font-semibold">Important:</span> Always scan and file warranty certificates separately in the physical documentation system.
                                    </p>
                                </div>
                            )}
                            
                            {/* Export Tip */}
                            {activeHelpSection === 'searchExport' && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-semibold">Audit Tip:</span> Export your official warehouse inventory quarterly for compliance audits and insurance reporting.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            For compliance questions, contact the quality assurance department
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
                                                <title>Official Warehouse Manual - ${helpSections[activeHelpSection].title}</title>
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
                                                    .certification { background: #d1e7dd; padding: 10px; border-left: 4px solid #0f5132; margin: 15px 0; }
                                                    .highlight { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-weight: bold; }
                                                    .important { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
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
                                                            <li>Use <span class="highlight">Search</span> to find certified parts</li>
                                                            <li>Click <span class="highlight">Add Official Part</span> for certified inventory</li>
                                                            <li>Maintain <span class="highlight">documentation</span> separately</li>
                                                            <li>Export for <span class="highlight">audit and compliance</span></li>
                                                        </ul>
                                                    </div>
                                                ` : ''}
                                                ${activeHelpSection === 'officialVsUnofficial' ? `
                                                    <div class="certification">
                                                        <h4>✓ Certification Requirements</h4>
                                                        <ul>
                                                            <li>• Manufacturer documentation must be on file</li>
                                                            <li>• Warranty certificates must be valid</li>
                                                            <li>• Certification numbers must be recorded</li>
                                                            <li>• Quality inspection records must be maintained</li>
                                                        </ul>
                                                    </div>
                                                ` : ''}
                                                ${activeHelpSection === 'creatingParts' ? `
                                                    <div class="important">
                                                        <p><strong>Important:</strong> Always scan and file warranty certificates separately in the physical documentation system.</p>
                                                    </div>
                                                ` : ''}
                                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                                    <p>Printed from Official Warehouse Management System on ${new Date().toLocaleDateString()}</p>
                                                    <p>© ${new Date().getFullYear()} Official Warehouse Management System. All rights reserved.</p>
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
            <Modal isOpen={modalIsOpen} onClose={closeModal} title={editMode ? "Edit Official Part" : "Add New Part to Official Warehouse"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-green-700">
                                <span className="font-semibold">Official Warehouse:</span> Parts must have full documentation and warranty.
                            </p>
                        </div>
                    </div>
                    
                    <Input
                        label="Official Part Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Official manufacturer part name"
                    />
                    <Input
                        label="Certified Quantity *"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        placeholder="Number of certified units"
                    />
                    <Input
                        label="Official Price per Unit (€) *"
                        name="pricePerUnit"
                        type="text"
                        value={formData.pricePerUnit}
                        onChange={handleChange}
                        required
                        placeholder="Including documentation and warranty"
                    />
                    <Input
                        label="Technical Specifications"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Certification numbers, specifications"
                    />
                    <Select
                        label="Service Category *"
                        value={formData.serviceCategory}
                        onChange={handleSelectChange}
                        required
                        className="text-black"
                        labelProps={{ className: "text-black" }}
                    >
                        <Option value={{ serviceName: '', priceInEuroWithoutVAT: '' }} className="text-black">
                            Select a certified service category...
                        </Option>
                        {catagoryData.map((category) => (
                            <Option key={category.id} value={category} className="text-black">
                                {category.serviceName} - Certified
                            </Option>
                        ))}
                    </Select>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                            <span className="font-semibold">Documentation Checklist:</span> Ensure all warranty certificates and manufacturer documentation are filed in the physical documentation system.
                        </p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button variant="text" color="red" onClick={closeModal} className="w-full md:w-auto">
                            <span>Cancel</span>
                        </Button>
                        <Button color="green" type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                            <span>{editMode ? 'Update Certified Part' : 'Add to Official Warehouse'}</span>
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
                                Are you sure you want to delete official part <strong>&quot;{part?.name || `#${partToDelete}`}&quot;</strong>? This will also remove associated documentation records. This action cannot be undone.
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

export default WarehouseUnofficiallyPage;