"use client"
import React, { use, useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Image from 'next/image';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";
import ReactSelect from 'react-select';

const OrderDetail = ({ params }) => {
    const { id } = use(params);
    const [order, setOrder] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const [selectedTab, setSelectedTab] = useState('Before');
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [statusHistory, setStatusHistory] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [clientMessages, setClientMessages] = useState([]);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [updatingWorkers, setUpdatingWorkers] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            axios.get(`${URL}/orders/${id}`)
                .then(response => {
                    const data = response.data.data;
                    setOrder(data);
                    const initialSelected = (data.assignedWorkers || []).map(worker => ({
                        value: worker.id,
                        label: worker.fullName,
                    }));
                    setSelectedWorkers(initialSelected);
                })
                .catch(error => console.error('Error fetching order:', error));

            axios.get(`${URL}/orders/${id}/status-history`)
                .then(response => {
                    setStatusHistory(response.data.data || []);
                })
                .catch(error => console.error('Error fetching status history:', error));

            axios.get(`${URL}/orders/${id}/assignment-history`)
                .then(response => {
                    setAssignmentHistory(response.data.data || []);
                })
                .catch(error => console.error('Error fetching assignment history:', error));

            // Client messages (visible to admins and assigned workers)
            axios.get(`${URL}/orders/client/${id}/messages`)
                .then(res => {
                    if (res.data?.code === 200) {
                        setClientMessages(res.data.data || []);
                    }
                })
                .catch(error => console.error('Error fetching client messages:', error));

            if (can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE)) {
                axios.get(`${URL}/users/role/worker`)
                    .then(res => {
                        const workers = res.data.data || [];
                        const options = workers.map(worker => ({
                            value: worker.id,
                            label: worker.fullName,
                        }));
                        setAvailableWorkers(options);
                    })
                    .catch(error => console.error('Error fetching workers:', error));
            }
        }
    }, [id, permissions]);

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
            
            // Используем URL из ответа сервера
            const newFileUrl = response.data.file.url;
            
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
            setDeleting(true);
            const tabMapping = {
                'Before': 'process',
                'In Progress': 'result',
                'Result': 'tab'
            };
            const tabName = tabMapping[selectedTab];
            
            const response = await axios.post(`${URL}/orders/${id}/delete/${tabName}`, { fileUrl: url });
            
            if (response.data.code === 200) {
                // Обновляем данные с сервера
                const orderResponse = await axios.get(`${URL}/orders/${id}`);
                setOrder(orderResponse.data.data);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            // В случае ошибки обновляем данные с сервера
            try {
                const orderResponse = await axios.get(`${URL}/orders/${id}`);
                setOrder(orderResponse.data.data);
            } catch (refreshError) {
                console.error('Error refreshing data:', refreshError);
            }
        } finally {
            setDeleting(false);
        }
    };

    // Добавляем функцию для обновления данных
    const refreshOrderData = async () => {
        try {
            const response = await axios.get(`${URL}/orders/${id}`);
            setOrder(response.data.data);
        } catch (error) {
            console.error('Error refreshing order data:', error);
        }
    };

    // Добавляем useEffect для периодического обновления данных
    useEffect(() => {
        if (id) {
            refreshOrderData();
            // Обновляем данные каждые 5 секунд
            const interval = setInterval(refreshOrderData, 5000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setShowGallery(true);
    };

    const getCurrentImages = () => {
        const tabMapping = {
            'Before': 'processImageUrls',
            'In Progress': 'resultImageUrls',
            'Result': 'tabImageUrls'
        };
        const imageKey = tabMapping[selectedTab];
        return order?.[imageKey]?.map(url => ({
            original: url,
            thumbnail: url,
            originalAlt: 'Order Image',
            thumbnailAlt: 'Order Image Thumbnail'
        })) || [];
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
                                <div key={index} className="relative group cursor-pointer" onClick={() => handleImageClick(index)}>
                                    <Image
                                        src={url}
                                        alt={`Order Image ${index + 1}`}
                                        width={500}
                                        height={300}
                                        className="w-full h-auto rounded-lg shadow-md transition-transform transform group-hover:scale-105"
                                    />
                                    {can(permissions, PermissionsList.ORDERS_MEDIA_DELETE) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(url);
                                            }}
                                            disabled={deleting}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors disabled:opacity-50"
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
                                    {can(permissions, PermissionsList.ORDERS_MEDIA_DELETE) && (
                                        <button
                                            onClick={() => handleDelete(url)}
                                            disabled={deleting}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors disabled:opacity-50"
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

    const handleWorkersUpdate = async () => {
        if (!order) return;
        const userIds = (selectedWorkers || []).map(w => w.value);
        setUpdatingWorkers(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${URL}/orders/${order.id}/workers`,
                { userIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const updatedOrderRes = await axios.get(`${URL}/orders/${order.id}`);
            setOrder(updatedOrderRes.data.data);
            const historyRes = await axios.get(`${URL}/orders/${order.id}/assignment-history`);
            setAssignmentHistory(historyRes.data.data || []);
        } catch (error) {
            console.error('Error updating workers:', error);
        } finally {
            setUpdatingWorkers(false);
        }
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
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg space-y-8">
                <div className="flex items-center justify-between">
                    <Button color="blue" onClick={() => router.push('/orders')}>Back</Button>
                    <span className="text-sm text-gray-500">
                        Order ID: <span className="font-mono">{order.id}</span>
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold text-black">Order Details</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-sm text-black">
                        <div><span className="font-semibold">Customer:</span> {order.offer?.customerFullName || 'N/A'}</div>
                        <div><span className="font-semibold">Yacht:</span> {order.offer?.yachtName || 'N/A'}</div>
                        <div><span className="font-semibold">Status:</span> {order.status}</div>
                        <div><span className="font-semibold">Created at:</span> {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-black">Assigned employees</h3>
                        <ReactSelect
                            options={availableWorkers}
                            value={selectedWorkers}
                            onChange={(selected) => setSelectedWorkers(selected || [])}
                            isMulti
                            isClearable
                            isSearchable
                            placeholder="Select employees..."
                            className="text-black"
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                                multiValueLabel: (provided) => ({
                                    ...provided,
                                    color: 'black',
                                }),
                            }}
                            isDisabled={!can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE)}
                        />
                        {can(permissions, PermissionsList.ORDERS_ASSIGNMENT_MANAGE) && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleWorkersUpdate}
                                    disabled={updatingWorkers}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-60"
                                >
                                    {updatingWorkers ? 'Saving...' : 'Save employees'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {statusHistory && statusHistory.length > 0 && (
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-3 text-black">Status History</h2>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                            <ul className="space-y-2 text-sm text-black">
                                {statusHistory.map((item, index) => (
                                    <li key={item.id || index} className="flex justify-between">
                                        <span className="font-medium">{item.oldStatus || '—'} → {item.newStatus}</span>
                                        <span className="text-gray-500">
                                            {item.changedAt ? new Date(item.changedAt).toLocaleString() : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {assignmentHistory && assignmentHistory.length > 0 && (
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-3 text-black">Employees Assignment History</h2>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                            <ul className="space-y-2 text-sm text-black">
                                {assignmentHistory.map((item, index) => (
                                    <li key={item.id || index} className="flex justify-between">
                                        <div>
                                            <span className="font-medium">
                                                [{(item.oldWorkerIds || []).join(', ') || '—'}] → [{(item.newWorkerIds || []).join(', ')}]
                                            </span>
                                            {item.changedBy && (
                                                <span className="ml-2 text-xs text-gray-500">
                                                    by {item.changedBy}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-gray-500">
                                            {item.changedAt ? new Date(item.changedAt).toLocaleString() : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {clientMessages && clientMessages.length > 0 && (
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-3 text-black">Client messages</h2>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                            <ul className="space-y-3 text-sm text-black">
                                {clientMessages.map((m, index) => (
                                    <li key={m.id || index} className="border rounded p-3 bg-white">
                                        <div className="flex justify-between gap-2 text-xs text-gray-600">
                                            <span className="uppercase">{m.kind}</span>
                                            <span>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                                        </div>
                                        <div className="mt-1 whitespace-pre-wrap">{m.message}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
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
                {can(permissions, PermissionsList.ORDERS_MEDIA_ADD) && (
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

            {showGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="w-full h-full p-4">
                        <div className="relative w-full h-full">
                            <ImageGallery
                                items={getCurrentImages()}
                                startIndex={selectedImageIndex}
                                showFullscreenButton={true}
                                showPlayButton={false}
                                showThumbnails={true}
                                showNav={true}
                                showBullets={true}
                                infinite={true}
                                slideInterval={3000}
                                slideOnThumbnailOver={true}
                                thumbnailPosition="bottom"
                                onClick={() => setShowGallery(false)}
                            />
                            <button
                                onClick={() => setShowGallery(false)}
                                className="absolute top-4 right-4 text-white z-50 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;