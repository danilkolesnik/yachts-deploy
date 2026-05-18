"use client"
import React, { use, useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Modal from '@/ui/Modal';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import {
    ASSIGNMENT_CHANGE_REASONS,
    buildAssignmentChangeReason,
    assignmentChangeRequiresReason,
} from '@/constants/orderAssignment';
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
    const reduxRole = useAppSelector((s) => s.userData?.role) || (typeof window !== 'undefined' ? localStorage.getItem('role') : '');
    const role = String(reduxRole || '').toLowerCase();
    const hidePrices = ['mechanic', 'electrician', 'user', 'client'].includes(role);
    const [selectedTab, setSelectedTab] = useState('Before');
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [statusHistory, setStatusHistory] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [clientMessages, setClientMessages] = useState([]);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [updatingWorkers, setUpdatingWorkers] = useState(false);
    const [itemsEditMode, setItemsEditMode] = useState(false);
    const [itemsSaving, setItemsSaving] = useState(false);
    const [draftServices, setDraftServices] = useState([]);
    const [draftParts, setDraftParts] = useState([]);
    const [timerSessions, setTimerSessions] = useState([]);
    const [timerEvents, setTimerEvents] = useState([]);
    const [timerSessionsLoading, setTimerSessionsLoading] = useState(false);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustTimer, setAdjustTimer] = useState(null);
    const [adjustTotalSeconds, setAdjustTotalSeconds] = useState('');
    const [adjustNote, setAdjustNote] = useState('');
    const [adjustSaving, setAdjustSaving] = useState(false);
    const [clearTimersOpen, setClearTimersOpen] = useState(false);
    const [clearTimersLoading, setClearTimersLoading] = useState(false);
    const [assignmentReasonOpen, setAssignmentReasonOpen] = useState(false);
    const [assignmentReasonPreset, setAssignmentReasonPreset] = useState('');
    const [assignmentReasonOther, setAssignmentReasonOther] = useState('');
    const [assignmentError, setAssignmentError] = useState('');
    const router = useRouter();

    const normalizeArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    const getOfferServices = () => {
        const services = normalizeArray(order?.offer?.services);
        return services
            .map((s) => ({
                name: s?.label ?? s?.serviceName ?? s?.name ?? '',
                qty: s?.quantity ?? s?.qty ?? '',
                unit: s?.value?.unitsOfMeasurement ?? s?.unitsOfMeasurement ?? s?.unit ?? '',
                price: s?.value?.priceInEuroWithoutVAT ?? s?.priceInEuroWithoutVAT ?? s?.price ?? '',
            }))
            .filter((x) => x.name);
    };

    const getOfferParts = () => {
        const parts = normalizeArray(order?.offer?.parts);
        return parts
            .map((p) => ({
                name: p?.label ?? p?.name ?? '',
                qty: p?.quantity ?? p?.qty ?? '',
                unit: p?.unitsOfMeasurement ?? p?.unit ?? '',
                price: p?.pricePerUnit ?? p?.price ?? '',
                articleNumber: p?.articleNumber ?? '',
                warehouse: p?.warehouse ?? '',
            }))
            .filter((x) => x.name);
    };

    const getOrderServices = () => {
        const services = normalizeArray(order?.services?.length ? order?.services : order?.offer?.services);
        return services
            .map((s) => ({
                serviceName: s?.serviceName ?? s?.label ?? s?.name ?? '',
                priceInEuroWithoutVAT: s?.priceInEuroWithoutVAT ?? s?.value?.priceInEuroWithoutVAT ?? s?.price ?? null,
                unitsOfMeasurement: s?.unitsOfMeasurement ?? s?.value?.unitsOfMeasurement ?? s?.unit ?? '',
                quantity: s?.quantity ?? s?.qty ?? 1,
            }))
            .filter((x) => x.serviceName);
    };

    const getOrderParts = () => {
        const parts = normalizeArray(order?.parts?.length ? order?.parts : order?.offer?.parts);
        return parts
            .map((p) => ({
                partName: p?.partName ?? p?.label ?? p?.name ?? '',
                quantity: p?.quantity ?? p?.qty ?? 1,
                articleNumber: p?.articleNumber ?? '',
                warehouse: p?.warehouse ?? '',
                pricePerUnit: p?.pricePerUnit ?? p?.price ?? null,
            }))
            .filter((x) => x.partName);
    };

    const formatMsHms = (ms) => {
        if (ms == null || Number.isNaN(Number(ms))) return '—';
        const totalS = Math.floor(Number(ms) / 1000);
        const h = Math.floor(totalS / 3600);
        const m = Math.floor((totalS % 3600) / 60);
        const s = totalS % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatUserList = (users, fallbackIds) => {
        if (Array.isArray(users) && users.length > 0) {
            return users.map((u) => u?.fullName || u?.id).filter(Boolean).join(', ');
        }
        if (Array.isArray(fallbackIds) && fallbackIds.length > 0) {
            return fallbackIds.map(String).join(', ');
        }
        return '—';
    };

    const displayUser = (userRef, fallbackId) => {
        if (userRef?.fullName) return userRef.fullName;
        if (fallbackId) return String(fallbackId);
        return '—';
    };

    const timerEventActionLabel = (action) => {
        const a = String(action || '');
        const map = {
            start: 'Start',
            pause: 'Pause',
            resume: 'Resume',
            stop: 'Stop',
            adjusted: 'Adjust duration',
            cleared: 'Clear all',
            'items.updated': 'Items updated',
        };
        return map[a] || a || '—';
    };

    const formatMetaMs = (ms) => {
        if (ms == null || Number.isNaN(Number(ms))) return null;
        return formatMsHms(ms);
    };

    const loadTimerSessions = async () => {
        if (!id || !can(permissions, PermissionsList.ORDERS_TIMERS_HISTORY_READ)) {
            setTimerSessions([]);
            setTimerEvents([]);
            return;
        }
        setTimerSessionsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [histResult, evResult] = await Promise.allSettled([
                axios.get(`${URL}/orders/${id}/timer/history`, { headers }),
                axios.get(`${URL}/orders/${id}/timer/events`, { headers }),
            ]);
            if (histResult.status === 'fulfilled') {
                const res = histResult.value;
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setTimerSessions(Array.isArray(list) ? list : []);
            } else {
                console.error('Error fetching timer sessions:', histResult.reason);
                setTimerSessions([]);
            }
            if (evResult.status === 'fulfilled') {
                const res = evResult.value;
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setTimerEvents(Array.isArray(list) ? list : []);
            } else {
                setTimerEvents([]);
            }
        } catch (error) {
            console.error('Error fetching timer sessions:', error);
            setTimerSessions([]);
            setTimerEvents([]);
        } finally {
            setTimerSessionsLoading(false);
        }
    };

    const openAdjustTimer = (t) => {
        const sec = t.totalDuration != null ? Math.floor(Number(t.totalDuration) / 1000) : 0;
        setAdjustTimer(t);
        setAdjustTotalSeconds(String(sec));
        setAdjustNote('');
        setAdjustOpen(true);
    };

    const saveAdjustTimer = async () => {
        if (!order || !adjustTimer) return;
        const sec = Number(adjustTotalSeconds);
        if (!Number.isFinite(sec) || sec < 0) return;
        setAdjustSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(
                `${URL}/orders/${order.id}/timers/${adjustTimer.id}`,
                { totalDurationMs: Math.floor(sec * 1000), note: adjustNote.trim() || undefined },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data?.code === 200) {
                setAdjustOpen(false);
                setAdjustTimer(null);
                await loadTimerSessions();
            }
        } catch (error) {
            console.error('Error adjusting timer:', error);
        } finally {
            setAdjustSaving(false);
        }
    };

    const canClearAllOrderTimers =
        can(permissions, PermissionsList.ORDERS_TIMER_CLEAR_ALL) &&
        ['admin', 'manager'].includes(role);

    const confirmClearAllTimers = async () => {
        if (!order || !canClearAllOrderTimers) return;
        setClearTimersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${URL}/orders/${order.id}/timers/clear`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data?.code === 200) {
                setClearTimersOpen(false);
                await loadTimerSessions();
                await refreshOrderData();
            }
        } catch (error) {
            console.error('Error clearing timers:', error);
        } finally {
            setClearTimersLoading(false);
        }
    };

    useEffect(() => {
        loadTimerSessions();
    }, [id, permissions]);

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
                    // Source of truth is still offer; order snapshots (if present) override it.
                    setDraftServices(
                        Array.isArray(data?.services) && data.services.length > 0
                            ? data.services
                            : Array.isArray(data?.offer?.services)
                              ? data.offer.services
                              : [],
                    );
                    setDraftParts(
                        Array.isArray(data?.parts) && data.parts.length > 0
                            ? data.parts
                            : Array.isArray(data?.offer?.parts)
                              ? data.offer.parts
                              : [],
                    );
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

    const saveOrderItems = async () => {
        if (!order) return;
        setItemsSaving(true);
        try {
            const res = await axios.post(`${URL}/orders/${order.id}/items`, {
                services: Array.isArray(draftServices) ? draftServices : [],
                parts: Array.isArray(draftParts) ? draftParts : [],
            });
            if (res.data?.code === 200) {
                setOrder(res.data.data);
                setItemsEditMode(false);
            }
        } catch (error) {
            console.error('Error saving order items:', error);
        } finally {
            setItemsSaving(false);
        }
    };

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
            
            // Use the file URL returned by the server
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
                // Refresh order from server
                const orderResponse = await axios.get(`${URL}/orders/${id}`);
                setOrder(orderResponse.data.data);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            // On error, still try to refresh order from server
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

    // Refresh order payload from API
    const refreshOrderData = async () => {
        try {
            const response = await axios.get(`${URL}/orders/${id}`);
            setOrder(response.data.data);
        } catch (error) {
            console.error('Error refreshing order data:', error);
        }
    };

    // Poll order details every 5 seconds
    useEffect(() => {
        if (id) {
            refreshOrderData();
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
                                    <img
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

    const handleWorkersUpdate = async (changeReason) => {
        if (!order) return;
        const userIds = (selectedWorkers || []).map((w) => w.value);
        setUpdatingWorkers(true);
        setAssignmentError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${URL}/orders/${order.id}/workers`,
                { userIds, changeReason: changeReason || undefined },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (res.data?.code === 400) {
                setAssignmentError(res.data.message || 'Validation failed');
                return;
            }
            setAssignmentReasonOpen(false);
            setAssignmentReasonPreset('');
            setAssignmentReasonOther('');
            const updatedOrderRes = await axios.get(`${URL}/orders/${order.id}`);
            setOrder(updatedOrderRes.data.data);
            const historyRes = await axios.get(`${URL}/orders/${order.id}/assignment-history`);
            setAssignmentHistory(historyRes.data.data || []);
        } catch (error) {
            const msg = error.response?.data?.message || 'Error updating workers';
            setAssignmentError(msg);
            console.error('Error updating workers:', error);
        } finally {
            setUpdatingWorkers(false);
        }
    };

    const onSaveWorkersClick = () => {
        if (assignmentChangeRequiresReason(order, selectedWorkers)) {
            setAssignmentReasonPreset('');
            setAssignmentReasonOther('');
            setAssignmentError('');
            setAssignmentReasonOpen(true);
            return;
        }
        handleWorkersUpdate();
    };

    const confirmAssignmentReason = () => {
        const reason = buildAssignmentChangeReason(assignmentReasonPreset, assignmentReasonOther);
        if (!reason) {
            setAssignmentError('Please select or enter a reason for the assignment change.');
            return;
        }
        handleWorkersUpdate(reason);
    };

    const openOrderReport = () => {
        if (!id) return;
        window.open(`/orders/${id}/report`, '_blank', 'noopener,noreferrer,width=960,height=900');
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button color="blue" onClick={() => router.push('/orders')}>Back</Button>
                    <div className="flex flex-wrap items-center gap-2">
                        {can(permissions, PermissionsList.ORDERS_READ) && (
                            <button
                                type="button"
                                onClick={openOrderReport}
                                className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-black"
                            >
                                Work order report
                            </button>
                        )}
                        <span className="text-sm text-gray-500">
                            Order ID: <span className="font-mono">{order.id}</span>
                        </span>
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-black">Order Details</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-sm text-black">
                        <div><span className="font-semibold">Customer:</span> {order.offer?.customerFullName || 'N/A'}</div>
                        <div><span className="font-semibold">Yacht:</span> {order.offer?.yachtName || 'N/A'}</div>
                        <div><span className="font-semibold">Status:</span> {order.status}</div>
                        <div><span className="font-semibold">Created at:</span> {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
                        {(order.createdByUser?.fullName || order.createdBy) && (
                            <div>
                                <span className="font-semibold">Created by:</span>{' '}
                                {order.createdByUser?.fullName || order.createdBy}
                            </div>
                        )}
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
                                    onClick={onSaveWorkersClick}
                                    disabled={updatingWorkers}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-60"
                                >
                                    {updatingWorkers ? 'Saving...' : 'Save employees'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <h2 className="text-xl font-bold text-black">Order works & materials</h2>
                        {can(permissions, PermissionsList.ORDERS_UPDATE) && (
                            <div className="flex gap-2">
                                {!itemsEditMode ? (
                                    <Button color="blue" onClick={() => setItemsEditMode(true)}>
                                        Edit
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outlined" color="gray" onClick={() => {
                                            setItemsEditMode(false);
                                            setDraftServices(
                                                Array.isArray(order?.services) && order.services.length > 0
                                                    ? order.services
                                                    : Array.isArray(order?.offer?.services)
                                                      ? order.offer.services
                                                      : [],
                                            );
                                            setDraftParts(
                                                Array.isArray(order?.parts) && order.parts.length > 0
                                                    ? order.parts
                                                    : Array.isArray(order?.offer?.parts)
                                                      ? order.offer.parts
                                                      : [],
                                            );
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button color="green" onClick={saveOrderItems} disabled={itemsSaving}>
                                            {itemsSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border rounded-lg p-4">
                            <div className="font-semibold text-black mb-2">Works / services</div>
                            {!itemsEditMode ? (
                                getOrderServices().length === 0 ? (
                                    <div className="text-sm text-gray-600">No services in order</div>
                                ) : (
                                    <div className="space-y-2 text-sm text-black">
                                        {getOrderServices().map((s, idx) => (
                                            <div key={`${s.serviceName}-${idx}`} className="flex items-start justify-between gap-3">
                                                <div className="font-medium">{s.serviceName}</div>
                                                <div className="text-right text-gray-700 whitespace-nowrap">
                                                    <span>{String(s.quantity || 1)} {s.unitsOfMeasurement || ''}</span>
                                                    {!hidePrices && s.priceInEuroWithoutVAT !== null && s.priceInEuroWithoutVAT !== undefined && s.priceInEuroWithoutVAT !== '' && (
                                                        <span className="ml-3">{String(s.priceInEuroWithoutVAT)} €</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-2">
                                    {(draftServices || []).map((s, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <input
                                                value={s?.serviceName ?? ''}
                                                onChange={(e) => {
                                                    const next = [...draftServices];
                                                    next[idx] = { ...(next[idx] || {}), serviceName: e.target.value };
                                                    setDraftServices(next);
                                                }}
                                                className="border p-2 rounded text-black md:col-span-2"
                                                placeholder="Service name"
                                            />
                                            <input
                                                value={String(s?.quantity ?? 1)}
                                                onChange={(e) => {
                                                    const next = [...draftServices];
                                                    next[idx] = { ...(next[idx] || {}), quantity: Number(e.target.value) || 1 };
                                                    setDraftServices(next);
                                                }}
                                                className="border p-2 rounded text-black"
                                                placeholder="Qty"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    value={String(s?.priceInEuroWithoutVAT ?? '')}
                                                    onChange={(e) => {
                                                        const next = [...draftServices];
                                                        next[idx] = { ...(next[idx] || {}), priceInEuroWithoutVAT: e.target.value === '' ? null : Number(e.target.value) };
                                                        setDraftServices(next);
                                                    }}
                                                    className="border p-2 rounded text-black w-full"
                                                    placeholder="Price €"
                                                />
                                                <button
                                                    onClick={() => setDraftServices(draftServices.filter((_, i) => i !== idx))}
                                                    className="px-3 border rounded text-red-600"
                                                    type="button"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setDraftServices([...(draftServices || []), { serviceName: '', quantity: 1, priceInEuroWithoutVAT: null }])}
                                        className="text-sm text-blue-600 hover:underline"
                                        type="button"
                                    >
                                        + Add service
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                            <div className="font-semibold text-black mb-2">Parts / materials</div>
                            {!itemsEditMode ? (
                                getOrderParts().length === 0 ? (
                                    <div className="text-sm text-gray-600">No parts in order</div>
                                ) : (
                                    <div className="space-y-2 text-sm text-black">
                                        {getOrderParts().map((p, idx) => (
                                            <div key={`${p.partName}-${idx}`} className="flex items-start justify-between gap-3">
                                                <div className="font-medium">{p.partName}</div>
                                                <div className="text-right text-gray-700 whitespace-nowrap">
                                                    <span>{String(p.quantity || 1)}</span>
                                                    {!hidePrices && p.pricePerUnit !== null && p.pricePerUnit !== undefined && p.pricePerUnit !== '' && (
                                                        <span className="ml-3">{String(p.pricePerUnit)} €</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-2">
                                    {(draftParts || []).map((p, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <input
                                                value={p?.partName ?? ''}
                                                onChange={(e) => {
                                                    const next = [...draftParts];
                                                    next[idx] = { ...(next[idx] || {}), partName: e.target.value };
                                                    setDraftParts(next);
                                                }}
                                                className="border p-2 rounded text-black md:col-span-2"
                                                placeholder="Part name"
                                            />
                                            <input
                                                value={String(p?.quantity ?? 1)}
                                                onChange={(e) => {
                                                    const next = [...draftParts];
                                                    next[idx] = { ...(next[idx] || {}), quantity: Number(e.target.value) || 1 };
                                                    setDraftParts(next);
                                                }}
                                                className="border p-2 rounded text-black"
                                                placeholder="Qty"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    value={String(p?.pricePerUnit ?? '')}
                                                    onChange={(e) => {
                                                        const next = [...draftParts];
                                                        next[idx] = { ...(next[idx] || {}), pricePerUnit: e.target.value === '' ? null : Number(e.target.value) };
                                                        setDraftParts(next);
                                                    }}
                                                    className="border p-2 rounded text-black w-full"
                                                    placeholder="Price €"
                                                />
                                                <button
                                                    onClick={() => setDraftParts(draftParts.filter((_, i) => i !== idx))}
                                                    className="px-3 border rounded text-red-600"
                                                    type="button"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setDraftParts([...(draftParts || []), { partName: '', quantity: 1, pricePerUnit: null }])}
                                        className="text-sm text-blue-600 hover:underline"
                                        type="button"
                                    >
                                        + Add part
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-600">
                        Offer snapshot (read-only): {getOfferServices().length} services, {getOfferParts().length} parts.
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
                                    <li key={item.id || index} className="flex justify-between gap-2">
                                        <div>
                                            <span className="font-medium">
                                                [{formatUserList(item.oldWorkers, item.oldWorkerIds)}] → [{formatUserList(item.newWorkers, item.newWorkerIds)}]
                                            </span>
                                            {item.changeReason && (
                                                <div className="text-xs text-gray-700 mt-1">
                                                    Reason: {item.changeReason}
                                                </div>
                                            )}
                                            {(item.changedByUser || item.changedBy) && (
                                                <span className="ml-0 block text-xs text-gray-500 mt-0.5">
                                                    by {displayUser(item.changedByUser, item.changedBy)}
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

                {(can(permissions, PermissionsList.ORDERS_TIMERS_HISTORY_READ) || canClearAllOrderTimers) && (
                    <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <h2 className="text-2xl font-bold text-black">Timer sessions</h2>
                            {canClearAllOrderTimers && (
                                <button
                                    type="button"
                                    onClick={() => setClearTimersOpen(true)}
                                    className="text-sm px-3 py-1.5 rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 w-fit"
                                >
                                    Clear all timers…
                                </button>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-72 overflow-y-auto">
                            {!can(permissions, PermissionsList.ORDERS_TIMERS_HISTORY_READ) ? (
                                <div className="text-sm text-gray-600">
                                    You do not have permission to view the session list. You can still clear all timer rows using the button above (manager / administrator only).
                                </div>
                            ) : timerSessionsLoading ? (
                                <div className="text-sm text-gray-600">Loading…</div>
                            ) : (timerSessions || []).length === 0 ? (
                                <div className="text-sm text-gray-600">No timer records for this order.</div>
                            ) : (
                                <ul className="space-y-2 text-sm text-black">
                                    {(timerSessions || []).map((t) => {
                                        const workerName =
                                            t.worker?.fullName ||
                                            (order?.assignedWorkers || []).find(
                                                (w) => String(w.id) === String(t.userId),
                                            )?.fullName;
                                        const lineLabel =
                                            t.serviceLineIndex == null
                                                ? '—'
                                                : `#${Number(t.serviceLineIndex) + 1}`;
                                        const canAdjust = can(permissions, PermissionsList.ORDERS_TIMER_ADJUST);
                                        return (
                                            <li key={t.id} className="border rounded p-3 bg-white space-y-1">
                                                <div className="flex flex-wrap justify-between gap-2">
                                                    <span className="font-medium">{t.status}</span>
                                                    <span className="text-gray-500 text-xs">
                                                        {t.startTime ? new Date(t.startTime).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>Line: {lineLabel}</span>
                                                    <span>Worker: {workerName || t.userId || '—'}</span>
                                                    <span>Duration: {formatMsHms(t.totalDuration)}</span>
                                                </div>
                                                {t.status === 'Completed' && canAdjust && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAdjustTimer(t)}
                                                        className="text-xs text-blue-600 hover:underline mt-1"
                                                    >
                                                        Adjust duration
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        {can(permissions, PermissionsList.ORDERS_TIMERS_HISTORY_READ) && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-black mb-2">Timer event log</h3>
                                <p className="text-xs text-gray-600 mb-2">
                                    Start, pause, resume, and stop with segment durations and who performed each action.
                                </p>
                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                                    {timerSessionsLoading ? (
                                        <div className="text-sm text-gray-600">Loading…</div>
                                    ) : (timerEvents || []).length === 0 ? (
                                        <div className="text-sm text-gray-600">No timer events recorded.</div>
                                    ) : (
                                        <ul className="space-y-2 text-sm text-black">
                                            {(timerEvents || []).map((ev) => {
                                                let meta = {};
                                                try {
                                                    if (ev.meta) meta = JSON.parse(ev.meta);
                                                } catch (_) {
                                                    meta = {};
                                                }
                                                const seg = formatMetaMs(meta.segmentWorkedMs);
                                                const brk = formatMetaMs(meta.pauseBreakMs);
                                                const cum = formatMetaMs(meta.cumulativeActiveWorkMs);
                                                const wall = formatMetaMs(meta.wallClockMs);
                                                const activeTot = formatMetaMs(meta.activeWorkTotalMs);
                                                const pauseTot = formatMetaMs(meta.totalPausedTimeMs);
                                                return (
                                                    <li key={ev.id} className="border rounded p-3 bg-white space-y-1">
                                                        <div className="flex flex-wrap justify-between gap-2">
                                                            <span className="font-medium">{timerEventActionLabel(ev.action)}</span>
                                                            <span className="text-gray-500 text-xs">
                                                                {ev.changedAt ? new Date(ev.changedAt).toLocaleString() : ''}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 space-y-0.5">
                                                            <div>
                                                                By:{' '}
                                                                <span className="text-black">
                                                                    {displayUser(ev.changedByUser, ev.changedBy)}
                                                                </span>
                                                                {(ev.timerOwnerUser || meta.timerOwnerUserId) &&
                                                                    String(ev.timerOwnerUser?.id || meta.timerOwnerUserId) !==
                                                                        String(ev.changedByUser?.id || ev.changedBy) && (
                                                                        <span className="ml-2">
                                                                            · Timer owner:{' '}
                                                                            {displayUser(
                                                                                ev.timerOwnerUser,
                                                                                meta.timerOwnerUserId || meta.timerUserId,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                            {meta.serviceLineIndex != null && (
                                                                <div>Service line: #{Number(meta.serviceLineIndex) + 1}</div>
                                                            )}
                                                            {seg && <div>Segment worked: {seg}</div>}
                                                            {brk && <div>Pause (break) duration: {brk}</div>}
                                                            {cum && <div>Cumulative active work (after pause): {cum}</div>}
                                                            {wall && activeTot && (
                                                                <div>
                                                                    Wall {wall} · Active total {activeTot}
                                                                    {pauseTot ? ` · Paused total ${pauseTot}` : ''}
                                                                </div>
                                                            )}
                                                            {meta.sessionStartedAt && (
                                                                <div className="text-[11px]">Session start (UTC): {String(meta.sessionStartedAt)}</div>
                                                            )}
                                                            {(meta.pauseAt || meta.resumeAt || meta.stopAt) && (
                                                                <div className="text-[11px]">
                                                                    {[meta.pauseAt && `Pause @ ${meta.pauseAt}`, meta.resumeAt && `Resume @ ${meta.resumeAt}`, meta.stopAt && `Stop @ ${meta.stopAt}`].filter(Boolean).join(' · ')}
                                                                </div>
                                                            )}
                                                            {meta.newSegmentStartedAt && (
                                                                <div className="text-[11px]">New segment (UTC): {String(meta.newSegmentStartedAt)}</div>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
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

            <Modal
                isOpen={adjustOpen}
                onClose={() => {
                    if (!adjustSaving) setAdjustOpen(false);
                }}
                title="Adjust timer duration"
                bodyClassName="max-h-[80vh] overflow-y-auto"
            >
                <div className="space-y-3 text-black">
                    <p className="text-sm text-gray-600">
                        Total logged time for this completed session (seconds). An audit entry is recorded.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Total seconds</label>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            className="border rounded p-2 w-full text-black"
                            value={adjustTotalSeconds}
                            onChange={(e) => setAdjustTotalSeconds(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Note (optional)</label>
                        <textarea
                            className="border rounded p-2 w-full text-black text-sm"
                            rows={2}
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="text" color="gray" onClick={() => !adjustSaving && setAdjustOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="green" onClick={saveAdjustTimer} disabled={adjustSaving}>
                            {adjustSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={assignmentReasonOpen}
                onClose={() => {
                    if (!updatingWorkers) setAssignmentReasonOpen(false);
                }}
                title="Reason for worker replacement"
                bodyClassName="max-h-[80vh] overflow-y-auto"
            >
                <div className="space-y-3 text-black">
                    <p className="text-sm text-gray-600">
                        Enter the reason for changing assigned workers. This is saved in the work order history and included in the work order report.
                    </p>
                    <div className="space-y-2">
                        {ASSIGNMENT_CHANGE_REASONS.map((r) => (
                            <label key={r.value} className="flex items-start gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="assignmentReason"
                                    value={r.value}
                                    checked={assignmentReasonPreset === r.value}
                                    onChange={() => setAssignmentReasonPreset(r.value)}
                                    className="mt-1"
                                />
                                <span>{r.label}</span>
                            </label>
                        ))}
                    </div>
                    {assignmentReasonPreset === 'other' && (
                        <textarea
                            className="border rounded p-2 w-full text-sm text-black"
                            rows={3}
                            placeholder="Describe the work reason…"
                            value={assignmentReasonOther}
                            onChange={(e) => setAssignmentReasonOther(e.target.value)}
                        />
                    )}
                    {assignmentError && <p className="text-sm text-red-600">{assignmentError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="text"
                            color="gray"
                            onClick={() => !updatingWorkers && setAssignmentReasonOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button color="green" onClick={confirmAssignmentReason} disabled={updatingWorkers}>
                            {updatingWorkers ? 'Saving…' : 'Save assignment'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={clearTimersOpen}
                onClose={() => {
                    if (!clearTimersLoading) setClearTimersOpen(false);
                }}
                title="Delete all timer data?"
                bodyClassName="max-h-[80vh] overflow-y-auto"
            >
                <div className="space-y-3 text-black">
                    <p className="text-sm text-gray-700">
                        All timer records for work order{' '}
                        <span className="font-mono font-semibold">{order?.id}</span> will be permanently deleted from the database.
                        This cannot be undone. The action is written to the audit log (user, time, work order id).
                    </p>
                    {can(permissions, PermissionsList.ORDERS_TIMERS_HISTORY_READ) &&
                        (timerSessions || []).length > 0 && (
                        <p className="text-sm text-gray-600">
                            Sessions to remove: <strong>{timerSessions.length}</strong>
                        </p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="text" color="gray" onClick={() => !clearTimersLoading && setClearTimersOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmClearAllTimers} disabled={clearTimersLoading}>
                            {clearTimersLoading ? 'Deleting…' : 'Yes, delete all'}
                        </Button>
                    </div>
                </div>
            </Modal>

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