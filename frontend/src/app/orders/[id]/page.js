"use client"
import React, { use, useState, useEffect } from 'react';
import axios from 'axios';
import { URL } from '@/utils/constants';
import { XMarkIcon } from '@heroicons/react/24/solid';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Image from 'next/image';
import ReactPlayer from 'react-player';
import { Tab } from '@headlessui/react';

const OrderDetail = ({ params }) => {
    const { id } = use(params);
    const [order, setOrder] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [selectedTab, setSelectedTab] = useState('Before');

    useEffect(() => {
        if (id) {
            axios.get(`${URL}/orders/${id}`)
                .then(response => {
                    setOrder(response.data.data)
                })
                .catch(error => console.error('Error fetching order:', error));
        }
    }, [id]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            const tabMapping = {
                'Before': 'process',
                'In Progress': 'result',
                'Result': 'tab'
            };
            const tabName = tabMapping[selectedTab];
            const response = await axios.post(`${URL}/orders/${id}/upload/${tabName}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newFileUrl = `${URL}/${response.data.file.path.replace(/\\/g, '/')}`;
            const isVideo = selectedFile.type.startsWith('video/');
            const key = isVideo ? `${tabName}VideoUrls` : `${tabName}ImageUrls`;
            setOrder((prevOrder) => ({
                ...prevOrder,
                [key]: [...(prevOrder[key] || []), newFileUrl],
            }));
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (url) => {
        try {
            const tabMapping = {
                'Before': 'process',
                'In Progress': 'result',
                'Result': 'tab'
            };
            const tabName = tabMapping[selectedTab];
            await axios.post(`${URL}/orders/${id}/delete/${tabName}`, { fileUrl: url });
            const isVideo = url.endsWith('.mp4') || url.endsWith('.avi');
            const key = isVideo ? `${tabName}VideoUrls` : `${tabName}ImageUrls`;
            setOrder((prevOrder) => ({
                ...prevOrder,
                [key]: prevOrder[key]?.filter((fileUrl) => fileUrl !== url) || [],
            }));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const renderTabContent = () => {
        const tabMapping = {
            'Before': { imageKey: 'processImageUrls', videoKey: 'processVideoUrls' },
            'In Progress': { imageKey: 'resultImageUrls', videoKey: 'resultVideoUrls' },
            'Result': { imageKey: 'tabImageUrls', videoKey: 'tabVideoUrls' }
        };
        const { imageKey, videoKey } = tabMapping[selectedTab];

        return (
            <div className="text-black">
                {order[imageKey] && order[imageKey].length > 0 && (
                    <div className="mt-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {order[imageKey].map((url, index) => (
                                <div key={index} className="relative group">
                                    <Image
                                        src={url}
                                        alt={`Order Image ${index + 1}`}
                                        width={500}
                                        height={300}
                                        className="w-full h-auto rounded-lg shadow-md transition-transform transform group-hover:scale-105"
                                    />
                                    {role !== 'user' && (
                                        <button
                                            onClick={() => handleDelete(url)}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6 bg-white rounded-full p-1" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {order[videoKey] && order[videoKey].length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Videos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {order[videoKey].map((url, index) => (
                                <div key={index} className="relative group">
                                    <ReactPlayer
                                        url={url}
                                        controls
                                        width="100%"
                                        height="100%"
                                        className="rounded-lg shadow-md"
                                    />
                                    {role !== 'user' && (
                                        <button
                                            onClick={() => handleDelete(url)}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6 bg-white rounded-full p-1" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
                <h1 className="text-4xl font-extrabold mb-6 text-black">Order Details</h1>
                <Tab.Group>
                    <Tab.List className="flex space-x-1 border-b-2 border-gray-300">
                        {['Before', 'In Progress', 'Result'].map((tab) => (
                            <Tab
                                key={tab}
                                className={({ selected }) =>
                                    `w-full py-2.5 text-sm leading-5 font-bold text-black
                                    ${selected ? 'border-b-2 border-black focus:outline-none' : 'hover:text-gray-500'}
                                    transition duration-300 ease-in-out`
                                }
                                onClick={() => setSelectedTab(tab)}
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels className="mt-2">
                        <Tab.Panel>{selectedTab === 'Before' && renderTabContent()}</Tab.Panel>
                        <Tab.Panel>{selectedTab === 'In Progress' && renderTabContent()}</Tab.Panel>
                        <Tab.Panel>{selectedTab === 'Result' && renderTabContent()}</Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
                {role != 'user' && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Upload New File</h2>
                        <input 
                            type="file" 
                            onChange={handleFileChange} 
                            className="text-sm text-stone-500
                            file:mr-5 file:py-1 file:px-3 file:border-[1px]
                            file:text-xs file:font-medium
                            file:bg-stone-50 file:text-stone-700
                            hover:file:cursor-pointer hover:file:bg-blue-50
                            hover:file:text-blue-700"
                        />
                        <button
                            onClick={handleUpload}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;