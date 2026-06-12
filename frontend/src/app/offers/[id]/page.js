"use client"
import React, { use, useState, useEffect } from 'react';
import { URL } from '@/utils/constants';
import { Button } from "@material-tailwind/react";
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Image from 'next/image';
import ReactPlayer from 'react-player';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";
import { statusStyles } from '@/utils/statusStyles';
import { useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import { downloadOfferPdf } from '@/utils/exportOfferPdf';
import { downloadInvoicePdfByOffer, sendInvoiceEmailByOffer } from '@/utils/exportInvoicePdf';
import { getCustomerEmailForOffer } from '@/utils/customerEmail';
import { sendOfferEmail } from '@/utils/sendOfferEmail';
import SendEmailModal from '@/ui/SendEmailModal';
import { uploadOfferMedia, getUploadErrorMessage } from '@/utils/uploadMedia';
import {
    formatEuroAmount,
    getPartLineTotal,
    getPartUnitPrice,
    getServiceLineTotal,
    getServiceUnitPrice,
    normalizeOfferPart,
    normalizeOfferService,
} from '@/utils/offerLineItems';
import OfferTotalsSummary from '@/component/OfferTotalsSummary';

const OfferDetail = ({ params }) => {
    const { id } = use(params);
    const [offer, setOffer] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFeedback, setUploadFeedback] = useState(null);
    const [role, setRole] = useState(null);
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [pdfExportLoading, setPdfExportLoading] = useState(false);
    const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailKind, setEmailKind] = useState('offer');
    const [emailLoading, setEmailLoading] = useState(false);
    const [offerHistory, setOfferHistory] = useState([]);
    const router = useRouter();
    const session = useAppSelector((s) => s.userData?.session);
    const permissions = useAppSelector((s) => s.userData?.permissions || []);
    const reduxRole = useAppSelector((s) => s.userData?.role);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setRole(localStorage.getItem('role'));
        }
    }, []);

    useEffect(() => {
        if (session !== true) return;
        const effectiveRole = reduxRole || role || localStorage.getItem('role');
        if (effectiveRole === 'client') {
            router.replace('/client/orders');
            return;
        }
        if (!can(permissions, PermissionsList.OFFERS_READ)) {
            const landing =
                can(permissions, PermissionsList.ORDERS_READ) ? '/orders'
                : can(permissions, PermissionsList.USERS_READ) ? '/yachts'
                : '/login';
            router.replace(landing);
        }
    }, [session, reduxRole, role, permissions, router]);

    useEffect(() => {
        if (!id) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        axios
            .get(`${URL}/offer/${id}`, { headers })
            .then((response) => setOffer(response.data.data))
            .catch((error) => console.error('Error fetching offer:', error));
        axios
            .get(`${URL}/offer/${id}/history`, { headers })
            .then((response) => {
                if (response.data?.code === 200) {
                    setOfferHistory(response.data.data || []);
                }
            })
            .catch((error) => console.error('Error fetching offer history:', error));
    }, [id]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadFeedback(null);
        try {
            const { fileUrl, isVideo } = await uploadOfferMedia(id, selectedFile, {
                onProgress: setUploadProgress,
            });

            if (isVideo) {
                setOffer((prevOffer) => ({
                    ...prevOffer,
                    videoUrls: [...(prevOffer.videoUrls || []), fileUrl],
                }));
            } else {
                setOffer((prevOffer) => ({
                    ...prevOffer,
                    imageUrls: [...(prevOffer.imageUrls || []), fileUrl],
                }));
            }
            setSelectedFile(null);
            setUploadFeedback({ type: 'success', message: 'File uploaded successfully.' });
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadFeedback({ type: 'error', message: getUploadErrorMessage(error) });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (url) => {
        try {
            await axios.post(`${URL}/upload/delete`, { url, offerId: id });
            setOffer((prevOffer) => ({
                ...prevOffer,
                imageUrls: prevOffer.imageUrls.filter((imageUrl) => imageUrl !== url),
                videoUrls: prevOffer.videoUrls.filter((videoUrl) => videoUrl !== url),
            }));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setShowGallery(true);
    };

    const handleExportPdf = async () => {
        if (!offer || !id) return;
        setPdfExportLoading(true);
        try {
            await downloadOfferPdf(id);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please try again.');
        } finally {
            setPdfExportLoading(false);
        }
    };

    const handleExportInvoicePdf = async () => {
        if (!offer || !id) return;
        setInvoicePdfLoading(true);
        try {
            await downloadInvoicePdfByOffer(id);
        } catch (error) {
            console.error('Error exporting invoice PDF:', error);
            alert('Error exporting invoice PDF. Please try again.');
        } finally {
            setInvoicePdfLoading(false);
        }
    };

    const handleSendEmail = async (payload) => {
        setEmailLoading(true);
        try {
            const response = emailKind === 'invoice'
                ? await sendInvoiceEmailByOffer(id, payload)
                : await sendOfferEmail(id, payload);
            
            if (response.code === 200) {
                alert(emailKind === 'invoice' ? 'Invoice email sent successfully!' : 'Email sent successfully!');
                setEmailModalOpen(false);
            } else {
                alert('Error sending email: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert(error.response?.data?.message || 'Error sending email');
        } finally {
            setEmailLoading(false);
        }
    };

    const images = offer?.imageUrls?.map(url => ({
        original: url,
        thumbnail: url,
        originalAlt: 'Offer Image',
        thumbnailAlt: 'Offer Image Thumbnail'
    })) || [];

    if (!offer) {
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
                <div className="flex justify-between items-center mb-6">
                    <Button color="blue" onClick={() => router.push('/offers')}>Back</Button>
                    {role !== 'user' && (
                        <div className="flex gap-2">
                            <Button 
                                color="green" 
                                onClick={handleExportPdf}
                                disabled={pdfExportLoading}
                            >
                                {pdfExportLoading ? 'Generating PDF...' : 'Export PDF'}
                            </Button>
                            <Button 
                                color="purple" 
                                onClick={handleExportInvoicePdf}
                                disabled={invoicePdfLoading}
                            >
                                {invoicePdfLoading ? 'Generating...' : 'Invoice PDF'}
                            </Button>
                            <Button 
                                color="orange" 
                                onClick={() => { setEmailKind('offer'); setEmailModalOpen(true); }}
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Sending...' : 'Send Email'}
                            </Button>
                            <Button 
                                color="indigo" 
                                onClick={() => { setEmailKind('invoice'); setEmailModalOpen(true); }}
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Sending...' : 'Send Invoice'}
                            </Button>
                        </div>
                    )}
                </div>
                <h1 className="text-4xl font-extrabold mb-6 text-black pt-4">Offer Details</h1>
                
                {/* Basic Information */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">ID:</span>
                            <span className="text-black">#{offer.id}</span>
                        </div>
                        {offer.currentVersionNumber != null && (
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Version:</span>
                                <span className="text-black">
                                    v{offer.currentVersionNumber}
                                    {offer.versionCount > 0
                                        ? ` (${offer.versionCount} archived)`
                                        : ''}
                                </span>
                            </div>
                        )}
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Date:</span>
                            <span className="text-black">{new Date(offer.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Customer:</span>
                            <span className="text-black">{offer.customerFullName || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Status:</span>
                            <span 
                                className="text-black px-3 py-1 rounded"
                                style={{
                                    ...statusStyles[offer.status],
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    display: 'inline-block'
                                }}
                            >
                                {offer.status || 'N/A'}
                            </span>
                        </div>
                        {offer.location && (
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Location:</span>
                                <span className="text-black">{offer.location}</span>
                            </div>
                        )}
                        {offer.language && (
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Language:</span>
                                <span className="text-black">{offer.language.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yachts Information */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Yacht Information</h2>
                    {Array.isArray(offer.yachts) && offer.yachts.length > 0 ? (
                        <div className="space-y-4">
                            {offer.yachts.map((yacht, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-semibold text-gray-800">Yacht Name:</span>
                                            <span className="text-black ml-2">{yacht.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800">Model:</span>
                                            <span className="text-black ml-2">{yacht.model || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800">Boat Registration:</span>
                                            <span className="text-black ml-2">{yacht.countryCode || 'N/A'}</span>
                                        </div>
                                        {yacht.userName && (
                                            <div>
                                                <span className="font-semibold text-gray-800">Owner:</span>
                                                <span className="text-black ml-2">{yacht.userName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-semibold text-gray-800">Yacht Name:</span>
                                <span className="text-black ml-2">{offer.yachtName || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800">Model:</span>
                                <span className="text-black ml-2">{offer.yachtModel || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800">Boat Registration:</span>
                                <span className="text-black ml-2">{offer.countryCode || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Services */}
                {(Array.isArray(offer.services) && offer.services.length > 0) || (offer.services && typeof offer.services === 'object' && Object.keys(offer.services).length > 0) ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Services</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Service Name</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Quantity</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Price per unit (€)</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Total (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(offer.services) ? (
                                        offer.services.map((service, index) => {
                                            const normalized = normalizeOfferService(service);
                                            return (
                                                <tr key={index}>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {normalized.serviceName}
                                                        {normalized.unitsOfMeasurement
                                                            ? ` (${normalized.unitsOfMeasurement})`
                                                            : ''}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {normalized.quantity}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {formatEuroAmount(getServiceUnitPrice(service))} €
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black font-medium">
                                                        {formatEuroAmount(getServiceLineTotal(service))} €
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        (() => {
                                            const normalized = normalizeOfferService(offer.services || {});
                                            return (
                                                <tr>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {normalized.serviceName}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {normalized.quantity}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                                        {formatEuroAmount(getServiceUnitPrice(offer.services))} €
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-black font-medium">
                                                        {formatEuroAmount(getServiceLineTotal(offer.services))} €
                                                    </td>
                                                </tr>
                                            );
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}

                {/* Parts */}
                {Array.isArray(offer.parts) && offer.parts.length > 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Parts</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Part Name</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Article Number</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Quantity</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Price per unit (€)</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Total (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offer.parts.map((part, index) => {
                                        const normalized = normalizeOfferPart(part);
                                        return (
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{normalized.label || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{normalized.articleNumber || '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{normalized.quantity}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{formatEuroAmount(getPartUnitPrice(part))} €</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black font-medium">{formatEuroAmount(getPartLineTotal(part))} €</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}

                <OfferTotalsSummary offer={offer} />

                {/* Comment */}
                {offer.comment && String(offer.comment).trim() ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Comments</h2>
                        <p className="text-black whitespace-pre-wrap">{offer.comment}</p>
                    </div>
                ) : null}

                {role !== 'user' && role !== 'client' && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-2 text-black">Change chronology</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Each edit records date, time, author, and changed fields. Offer ID stays the same
                            (work orders remain linked).
                        </p>
                        {(offerHistory || []).length === 0 ? (
                            <p className="text-sm text-gray-600">No changes recorded yet.</p>
                        ) : (
                            <ul className="text-sm space-y-3 max-h-96 overflow-y-auto">
                                {[...(offerHistory || [])].reverse().map((entry) => (
                                    <li key={entry.id} className="border rounded p-3 bg-white">
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                                            <span>
                                                <span className="font-semibold text-gray-800">Date:</span>{' '}
                                                {entry.changedDate ||
                                                    (entry.changedAt
                                                        ? new Date(entry.changedAt).toLocaleDateString()
                                                        : '—')}
                                            </span>
                                            <span>
                                                <span className="font-semibold text-gray-800">Time:</span>{' '}
                                                {entry.changedTime ||
                                                    (entry.changedAt
                                                        ? new Date(entry.changedAt).toLocaleTimeString()
                                                        : '—')}
                                            </span>
                                            <span>
                                                <span className="font-semibold text-gray-800">Author:</span>{' '}
                                                {entry.author?.fullName ||
                                                    entry.user?.fullName ||
                                                    'Unknown'}
                                            </span>
                                            {entry.versionNumber != null && (
                                                <span>
                                                    <span className="font-semibold text-gray-800">Version:</span>{' '}
                                                    v{entry.versionNumber}
                                                </span>
                                            )}
                                        </div>
                                        {(entry.changes || []).length > 0 ? (
                                            <ul className="text-gray-800 space-y-1 list-disc list-inside">
                                                {entry.changes.map((c, idx) => (
                                                    <li key={`${entry.id}-${c.field}-${idx}`}>
                                                        {c.summary ||
                                                            `${c.fieldLabel || c.field}: ${String(c.oldValue ?? '—')} → ${String(c.newValue ?? '—')}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 text-xs">No field details recorded.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {(offer.versionsSummary || []).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Archived snapshots</h3>
                                <ul className="text-xs space-y-1 text-gray-600">
                                    {(offer.versionsSummary || []).map((v) => (
                                        <li key={v.versionNumber}>
                                            v{v.versionNumber}
                                            {v.savedAt ? ` · ${new Date(v.savedAt).toLocaleString()}` : ''}
                                            {v.savedByName ? ` · ${v.savedByName}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {offer.imageUrls.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Images</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {offer.imageUrls.map((url, index) => (
                                <div key={index} className="relative group cursor-pointer" onClick={() => handleImageClick(index)}>
                                    <Image
                                        src={url}
                                        alt={`Offer Image ${index + 1}`}
                                        width={500}
                                        height={300}
                                        className="w-full h-auto rounded-lg shadow-md transition-transform transform group-hover:scale-105"
                                    />
                                    {role != 'user' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(url);
                                            }}
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
                {offer.videoUrls && offer.videoUrls.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Videos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {offer.videoUrls.map((url, index) => (
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
                {role != 'user' && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Upload New File</h2>
                        <input 
                            type="file"
                            accept="image/*,video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v"
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
                            {uploading
                                ? (uploadProgress > 0 ? `Uploading… ${uploadProgress}%` : 'Uploading…')
                                : 'Upload'}
                        </button>
                        {uploadFeedback && (
                            <p className={`mt-2 text-sm ${uploadFeedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                                {uploadFeedback.message}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {showGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="w-full h-full p-4">
                        <div className="relative w-full h-full">
                            <ImageGallery
                                items={images}
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

            <SendEmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                title={emailKind === 'invoice' ? 'Send Invoice Email' : 'Send Email'}
                customerName={offer?.customerFullName || ''}
                customerEmail={getCustomerEmailForOffer(offer)}
                loading={emailLoading}
                onSend={handleSendEmail}
            />
        </div>
    );
};

export default OfferDetail;